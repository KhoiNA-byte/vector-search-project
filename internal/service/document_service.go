package service

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/xml"
	"fmt"
	"io"
	"strings"
	"vector-search-project/internal/model"
	"vector-search-project/internal/model/response"
	"vector-search-project/internal/repository"

	"github.com/ledongthuc/pdf"
)

type DocumentService interface {
	Upload(ctx context.Context, filename string, r io.ReaderAt, size int64) error
	Search(ctx context.Context, query string) ([]response.ChunkRes, error)
	GetAllChunks(ctx context.Context) ([]response.ChunkRes, error)
	GetChunksByDocument(ctx context.Context, docName string) ([]response.ChunkRes, error)
	UpdateChunk(ctx context.Context, id int64, content string) error
	DeleteChunk(ctx context.Context, id int64) error
	DeleteDocument(ctx context.Context, name string) error
	GetDocuments(ctx context.Context) ([]response.DocumentRes, error)
}

type documentService struct {
	repo     repository.DocumentRepository
	embedSvc *EmbeddingService
}

func NewDocumentService(repo repository.DocumentRepository, embedSvc *EmbeddingService) DocumentService {
	return &documentService{
		repo:     repo,
		embedSvc: embedSvc,
	}
}

func (s *documentService) Upload(ctx context.Context, filename string, r io.ReaderAt, size int64) error {
	lowerFilename := strings.ToLower(filename)
	var extractedText map[int]string // map of page_number -> text content

	if strings.HasSuffix(lowerFilename, ".pdf") {
		var err error
		extractedText, err = s.parsePDF(r, size)
		if err != nil {
			return fmt.Errorf("failed to parse PDF: %w", err)
		}
	} else if strings.HasSuffix(lowerFilename, ".docx") {
		var err error
		extractedText, err = s.parseDOCX(r, size)
		if err != nil {
			return fmt.Errorf("failed to parse DOCX: %w", err)
		}
	} else {
		return fmt.Errorf("unsupported file format. Only PDF and DOCX are allowed")
	}

	// Loop through pages and chunk them
	for pageNum, text := range extractedText {
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

			// Generate embedding
			embedding, err := s.embedSvc.EmbedDescription(ctx, chunkTextContent)
			if err != nil {
				return fmt.Errorf("failed to embed chunk: %w", err)
			}

			chunk := &model.DocumentChunk{
				DocumentName: filename,
				PageNumber:   pageNum,
				Content:      chunkTextContent,
				Embedding:    embedding,
			}

			if err := s.repo.CreateChunk(ctx, chunk); err != nil {
				return fmt.Errorf("failed to save chunk: %w", err)
			}
		}
	}

	return nil
}

func (s *documentService) Search(ctx context.Context, query string) ([]response.ChunkRes, error) {
	if query == "" {
		return nil, fmt.Errorf("query is required")
	}

	// Generate search embedding
	queryEmbedding, err := s.embedSvc.EmbedDescription(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to embed query: %w", err)
	}

	// Retrieve top 6 matching chunks
	return s.repo.SearchChunks(ctx, queryEmbedding, 6)
}

func (s *documentService) GetAllChunks(ctx context.Context) ([]response.ChunkRes, error) {
	return s.repo.GetAllChunks(ctx)
}

func (s *documentService) GetChunksByDocument(ctx context.Context, docName string) ([]response.ChunkRes, error) {
	return s.repo.GetChunksByDocument(ctx, docName)
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
	return s.repo.DeleteDocument(ctx, name)
}

func (s *documentService) GetDocuments(ctx context.Context) ([]response.DocumentRes, error) {
	return s.repo.GetDistinctDocuments(ctx)
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

		fontNames := p.Fonts()
		fonts := make(map[string]*pdf.Font)
		for _, name := range fontNames {
			font := p.Font(name)
			fonts[name] = &font
		}

		text, err := p.GetPlainText(fonts)
		if err != nil {
			// fallback to general plain text if page specific fails
			continue
		}

		extracted[pageNum] = text
	}

	// Fallback check: if nothing was extracted page-by-page, try general extraction
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

	var buf bytes.Buffer
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
				buf.WriteString(t)
			} else if se.Name.Local == "p" {
				buf.WriteString("\n")
			}
		}
	}

	// Return as a single flow on page 1
	return map[int]string{1: buf.String()}, nil
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
