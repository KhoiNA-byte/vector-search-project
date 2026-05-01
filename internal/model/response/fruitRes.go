package response

type FruitRes struct {
	Name       string  `json:"name"`
	Origin     string  `json:"origin"`
	BestFor    string  `json:"bestFor"`
	Texture    string  `json:"texture"`
	Flavor     string  `json:"flavor"`
	Season     string  `json:"season"`
	Color      string  `json:"color"`
	Price      float64 `json:"price"`
	Similarity float64 `json:"similarity"`
}
