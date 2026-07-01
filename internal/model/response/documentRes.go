package response

import "time"

type DocumentRes struct {
	Name         string    `json:"name"`
	FileType     string    `json:"fileType"`
	UploadDate   time.Time `json:"uploadDate"`
	FileSize     int64     `json:"fileSize"`
	StoragePath  string    `json:"storagePath"`
	Similarity   float64   `json:"similarity"`
	ChunkCount   int64     `json:"chunkCount"`
	DownloadURL  string    `json:"downloadURL"`
}

type ChunkRes struct {
	ID           int64   `json:"id"`
	DocumentName string  `json:"documentName"`
	PageNumber   int     `json:"pageNumber"`
	Content      string  `json:"content"`
	Similarity   float64 `json:"similarity"`
}
