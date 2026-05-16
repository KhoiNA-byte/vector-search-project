package response

type VisualEntityRes struct {
	ID         int64   `json:"id"`
	ImageURL   string  `json:"img"`
	Similarity float64 `json:"similarity"`
}
