package service

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"os"
	"sort"
	"strings"
	"vector-search-project/internal/model"
	"vector-search-project/internal/model/response"
	"vector-search-project/internal/repository"

	"github.com/ledongthuc/pdf"
)

type DocumentService interface {
	Upload(ctx context.Context, filename string, r io.ReaderAt, size int64, contentType string) error
	SearchDocuments(ctx context.Context, query string) ([]response.DocumentRes, error)
	SemanticSearch(ctx context.Context, query string, scope []string) ([]response.ChunkRes, error)
	GetAllChunks(ctx context.Context) ([]response.ChunkRes, error)
	GetChunksByDocument(ctx context.Context, docName string) ([]response.ChunkRes, error)
	GetDocumentDetails(ctx context.Context, docName string) (*response.DocumentRes, []response.ChunkRes, error)
	UpdateChunk(ctx context.Context, id int64, content string) error
	DeleteChunk(ctx context.Context, id int64) error
	DeleteDocument(ctx context.Context, name string) error
	GetDocuments(ctx context.Context) ([]response.DocumentRes, error)
}

type documentService struct {
	repo       repository.DocumentRepository
	embedSvc   *EmbeddingService
	storageSvc StorageService
}

func NewDocumentService(repo repository.DocumentRepository, embedSvc *EmbeddingService) DocumentService {
	bucketName := os.Getenv("MINIO_DOCUMENT_BUCKET")
	if bucketName == "" {
		bucketName = "documents"
	}

	publicURL := os.Getenv("MINIO_DOCUMENT_PUBLIC_URL")
	if publicURL == "" {
		basePublicURL := os.Getenv("MINIO_PUBLIC_URL")
		if basePublicURL != "" {
			publicURL = strings.Replace(basePublicURL, "visual-entities", bucketName, 1)
		} else {
			publicURL = "http://localhost:9000/" + bucketName
		}
	}

	return &documentService{
		repo:       repo,
		embedSvc:   embedSvc,
		storageSvc: NewStorageServiceWithBucket(bucketName, publicURL),
	}
}

func (s *documentService) Upload(ctx context.Context, filename string, r io.ReaderAt, size int64, contentType string) error {
	// Determine file extension and validation
	lowerFilename := strings.ToLower(filename)
	fileType := "pdf"
	if strings.HasSuffix(lowerFilename, ".docx") {
		fileType = "docx"
	} else if !strings.HasSuffix(lowerFilename, ".pdf") {
		return fmt.Errorf("unsupported file format. Only PDF and DOCX are allowed")
	}

	// 1. Delete if duplicate filename (clean overwrite)
	_ = s.DeleteDocument(ctx, filename)

	// 2. Upload raw file to MinIO
	sectionReader := io.NewSectionReader(r, 0, size)
	err := s.storageSvc.Upload(ctx, filename, sectionReader, size, contentType)
	if err != nil {
		return fmt.Errorf("failed to upload file to MinIO: %w", err)
	}

	// 3. Create document record in database
	doc := &model.Document{
		Name:     filename,
		FileSize: size,
		FileType: fileType,
	}
	if err := s.repo.CreateDocument(ctx, doc); err != nil {
		// Clean up MinIO on db save failure
		_ = s.storageSvc.Delete(ctx, filename)
		return fmt.Errorf("failed to save document metadata: %w", err)
	}

	// 4. Parse text contents
	var extractedText map[int]string
	if fileType == "pdf" {
		extractedText, err = s.parsePDF(r, size)
	} else {
		extractedText, err = s.parseDOCX(r, size)
	}

	if err != nil {
		// Clean up MinIO & document record on parse failure
		_ = s.storageSvc.Delete(ctx, filename)
		_ = s.repo.DeleteDocument(ctx, filename)
		return fmt.Errorf("failed to parse document: %w", err)
	}

	// 5. Chunk and embed text contents
	type pendingChunk struct {
		PageNumber int
		Content    string
	}
	var pendingList []pendingChunk
	var rawTexts []string

	// Sort page numbers so chunks are processed sequentially
	var pageNums []int
	for pageNum := range extractedText {
		pageNums = append(pageNums, pageNum)
	}
	sort.Ints(pageNums)

	for _, pageNum := range pageNums {
		text := extractedText[pageNum]
		trimmedText := strings.TrimSpace(text)
		if trimmedText == "" {
			continue
		}

		chunks := chunkText(trimmedText, 600, 60)
		for _, chunkTextContent := range chunks {
			chunkTextContent = strings.TrimSpace(chunkTextContent)
			if chunkTextContent == "" {
				continue
			}

			pendingList = append(pendingList, pendingChunk{
				PageNumber: pageNum,
				Content:    chunkTextContent,
			})
			rawTexts = append(rawTexts, chunkTextContent)
		}
	}

	if len(pendingList) > 0 {
		// Generate all chunk embeddings in batch
		embeddings, err := s.embedSvc.EmbedDescriptions(ctx, rawTexts)
		if err != nil {
			// Clean up on embedding error
			_ = s.storageSvc.Delete(ctx, filename)
			_ = s.repo.DeleteDocument(ctx, filename)
			return fmt.Errorf("failed to generate chunk embeddings: %w", err)
		}

		dbChunks := make([]*model.DocumentChunk, len(pendingList))
		for idx, p := range pendingList {
			dbChunks[idx] = &model.DocumentChunk{
				DocumentName: filename,
				PageNumber:   p.PageNumber,
				Content:      p.Content,
				Embedding:    embeddings[idx],
			}
		}

		// Bulk insert all chunks in one operation
		if err := s.repo.CreateChunks(ctx, dbChunks); err != nil {
			_ = s.storageSvc.Delete(ctx, filename)
			_ = s.repo.DeleteDocument(ctx, filename)
			return fmt.Errorf("failed to save document chunks: %w", err)
		}
	}

	return nil
}

func (s *documentService) SearchDocuments(ctx context.Context, query string) ([]response.DocumentRes, error) {
	if query == "" {
		return s.GetDocuments(ctx)
	}

	// Generate query embedding
	queryEmbedding, err := s.embedSvc.EmbedDescription(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to embed document query: %w", err)
	}

	docs, err := s.repo.SearchDocuments(ctx, queryEmbedding, 20)
	if err != nil {
		return nil, err
	}

	// Set public download URLs
	for i := range docs {
		docs[i].DownloadURL = s.storageSvc.GetPublicURL(docs[i].Name)
	}
	return docs, nil
}

func (s *documentService) SemanticSearch(ctx context.Context, query string, scope []string) ([]response.ChunkRes, error) {
	if query == "" {
		return nil, fmt.Errorf("query is required")
	}

	// Generate search embedding
	queryEmbedding, err := s.embedSvc.EmbedDescription(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to embed query: %w", err)
	}

	return s.repo.SearchChunksInScope(ctx, queryEmbedding, scope, 15)
}

func (s *documentService) GetAllChunks(ctx context.Context) ([]response.ChunkRes, error) {
	return s.repo.GetAllChunks(ctx)
}

func (s *documentService) GetChunksByDocument(ctx context.Context, docName string) ([]response.ChunkRes, error) {
	return s.repo.GetChunksByDocument(ctx, docName)
}

func (s *documentService) GetDocumentDetails(ctx context.Context, docName string) (*response.DocumentRes, []response.ChunkRes, error) {
	docMetadata, err := s.repo.GetDocument(ctx, docName)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to load document: %w", err)
	}

	chunks, err := s.repo.GetChunksByDocument(ctx, docName)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to load document chunks: %w", err)
	}

	docRes := &response.DocumentRes{
		Name:        docMetadata.Name,
		FileType:    docMetadata.FileType,
		UploadDate:  docMetadata.CreatedAt,
		FileSize:    docMetadata.FileSize,
		ChunkCount:  int64(len(chunks)),
		DownloadURL: s.storageSvc.GetPublicURL(docMetadata.Name),
	}

	return docRes, chunks, nil
}

func (s *documentService) UpdateChunk(ctx context.Context, id int64, content string) error {
	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return fmt.Errorf("content cannot be empty")
	}

	// Regenerate embedding for updated content
	newEmbedding, err := s.embedSvc.EmbedDescription(ctx, trimmed)
	if err != nil {
		return fmt.Errorf("failed to embed updated chunk: %w", err)
	}

	return s.repo.UpdateChunk(ctx, id, trimmed, newEmbedding)
}

func (s *documentService) DeleteChunk(ctx context.Context, id int64) error {
	return s.repo.DeleteChunk(ctx, id)
}

func (s *documentService) DeleteDocument(ctx context.Context, name string) error {
	// Remove from MinIO
	err := s.storageSvc.Delete(ctx, name)
	if err != nil {
		log.Printf("Warning: failed to delete file %s from MinIO: %v", name, err)
	}

	// Remove from DB (metadata + chunks)
	return s.repo.DeleteDocument(ctx, name)
}

func (s *documentService) GetDocuments(ctx context.Context) ([]response.DocumentRes, error) {
	docs, err := s.repo.GetDistinctDocuments(ctx)
	if err != nil {
		return nil, err
	}

	// Set public download URLs
	for i := range docs {
		docs[i].DownloadURL = s.storageSvc.GetPublicURL(docs[i].Name)
	}
	return docs, nil
}

// parsePDF extracts text page-by-page from a PDF
func (s *documentService) parsePDF(r io.ReaderAt, size int64) (map[int]string, error) {
	reader, err := pdf.NewReader(r, size)
	if err != nil {
		return nil, err
	}

	extracted := make(map[int]string)
	numPages := reader.NumPage()

	for pageNum := 1; pageNum <= numPages; pageNum++ {
		p := reader.Page(pageNum)
		if p.V.IsNull() {
			continue
		}

		text, err := p.GetPlainText(nil)
		if err != nil {
			continue
		}

		extracted[pageNum] = text
	}

	// Fallback check
	if len(extracted) == 0 {
		plainTextReader, err := reader.GetPlainText()
		if err == nil {
			var buf bytes.Buffer
			if _, err := buf.ReadFrom(plainTextReader); err == nil {
				extracted[1] = buf.String()
			}
		}
	}

	return extracted, nil
}

// parseDOCX extracts text from a DOCX zip archive using sequential XML token parsing
func (s *documentService) parseDOCX(r io.ReaderAt, size int64) (map[int]string, error) {
	reader, err := zip.NewReader(r, size)
	if err != nil {
		return nil, err
	}

	var docXML *zip.File
	for _, f := range reader.File {
		if f.Name == "word/document.xml" {
			docXML = f
			break
		}
	}

	if docXML == nil {
		return nil, fmt.Errorf("word/document.xml not found in DOCX file")
	}

	rc, err := docXML.Open()
	if err != nil {
		return nil, err
	}
	defer rc.Close()

	extracted := make(map[int]string)
	var currentBuf bytes.Buffer
	currentPageNum := 1

	decoder := xml.NewDecoder(rc)
	for {
		token, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		switch se := token.(type) {
		case xml.StartElement:
			if se.Name.Local == "t" {
				var t string
				if err := decoder.DecodeElement(&t, &se); err != nil {
					return nil, err
				}
				currentBuf.WriteString(t)
			} else if se.Name.Local == "p" {
				currentBuf.WriteString("\n")
			} else if se.Name.Local == "br" {
				for _, attr := range se.Attr {
					if attr.Name.Local == "type" && attr.Value == "page" {
						extracted[currentPageNum] = currentBuf.String()
						currentBuf.Reset()
						currentPageNum++
						break
					}
				}
			} else if se.Name.Local == "lastRenderedPageBreak" || se.Name.Local == "pageBreakBefore" {
				extracted[currentPageNum] = currentBuf.String()
				currentBuf.Reset()
				currentPageNum++
			}
		}
	}

	extracted[currentPageNum] = currentBuf.String()

	return extracted, nil
}

// chunkText splits string text into overlapping chunks
func chunkText(text string, chunkSize int, overlap int) []string {
	var chunks []string
	runes := []rune(text)
	n := len(runes)

	if n == 0 {
		return chunks
	}

	if n <= chunkSize {
		return []string{text}
	}

	for i := 0; i < n; {
		end := i + chunkSize
		if end > n {
			end = n
		}

		chunks = append(chunks, string(runes[i:end]))

		if end == n {
			break
		}

		i = end - overlap
		if i < 0 {
			i = 0
		}
	}

	return chunks
}
