package response

type VisualEntityRes struct {
	ImageURL   string  `json:"img"`
	Similarity float64 `json:"similarity"`
}
