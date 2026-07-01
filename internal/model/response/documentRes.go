package response

type DocumentRes struct {
	Name       string `json:"name"`
	ChunkCount int64  `json:"chunkCount"`
}

type ChunkRes struct {
	ID           int64   `json:"id"`
	DocumentName string  `json:"documentName"`
	PageNumber   int     `json:"pageNumber"`
	Content      string  `json:"content"`
	Similarity   float64 `json:"similarity"`
}
