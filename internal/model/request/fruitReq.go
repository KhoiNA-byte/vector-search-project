package request

type FruitReq struct {
	ID      int64   `json:"id"`
	Name    string  `json:"name"`
	Origin  string  `json:"origin"`
	BestFor string  `json:"bestFor"`
	Texture string  `json:"texture"`
	Flavor  string  `json:"flavor"`
	Season  string  `json:"season"`
	Color   string  `json:"color"`
	Price   float64 `json:"price"`
}
