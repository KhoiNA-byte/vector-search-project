package request

type FruitReq struct {
	Name         string  `json:"name"`
	Origin       string  `json:"origin"`
	BestFor      string  `json:"bestFor"`
	Texture      string  `json:"texture"`
	Flavor       string  `json:"flavor"`
	Season       string  `json:"season"`
	ColorOutside string  `json:"colorOutside"`
	ColorInside  string  `json:"colorInside"`
	Price        float64 `json:"price"`
}
