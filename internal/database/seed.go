package database

import (
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"vector-search-project/internal/model"
)

func GetFruitsToSeed() []*model.Fruit {
	return []*model.Fruit{
		{Name: "Banana", Origin: "South America", BestFor: "Snacks and smoothies", Texture: "Creamy", Flavor: "Sweet", Season: "All Season", ColorOutside: "yellow", ColorInside: "yellow", Price: 0.50},
		{Name: "Lemon", Origin: "Europe", BestFor: "Juicing and seasoning", Texture: "Juicy", Flavor: "Extra Sour", Season: "Spring, Winter", ColorOutside: "yellow", ColorInside: "yellow", Price: 0.30},
		{Name: "Red Apple", Origin: "North America", BestFor: "Eating fresh", Texture: "Crunchy", Flavor: "Sweet", Season: "Fall", ColorOutside: "red", ColorInside: "white", Price: 1.00},
		{Name: "Green Apple", Origin: "Oceania", BestFor: "Baking and salads", Texture: "Crisp", Flavor: "Tart and Sour", Season: "Fall", ColorOutside: "green", ColorInside: "white", Price: 1.10},
		{Name: "Strawberry", Origin: "Europe", BestFor: "Desserts", Texture: "Soft", Flavor: "Sweet and tangy", Season: "Spring, Summer", ColorOutside: "red", ColorInside: "red/white", Price: 2.50},
		{Name: "Mango", Origin: "South Asia", BestFor: "Smoothies and salsas", Texture: "Fibrous", Flavor: "Sweet and tropical", Season: "Spring, Summer", ColorOutside: "yellow/green", ColorInside: "orange/yellow", Price: 1.50},
		{Name: "Pineapple", Origin: "South America", BestFor: "Grilling and juices", Texture: "Tough", Flavor: "Sweet and acidic", Season: "All Season", ColorOutside: "yellow/brown", ColorInside: "yellow", Price: 3.00},
		{Name: "Blueberry", Origin: "North America", BestFor: "Pancakes and muffins", Texture: "Firm", Flavor: "Sweet and earthy", Season: "Summer", ColorOutside: "blue/purple", ColorInside: "purple/white", Price: 4.00},
		{Name: "Watermelon", Origin: "South America", BestFor: "Hydration and fruit salads", Texture: "Grainy", Flavor: "Sweet and refreshing", Season: "Summer", ColorOutside: "green", ColorInside: "red", Price: 5.00},
		{Name: "Peach", Origin: "East Asia", BestFor: "Pies and cobblers", Texture: "Soft", Flavor: "Sweet and floral", Season: "Summer", ColorOutside: "orange/pink", ColorInside: "orange/yellow", Price: 1.20},
		{Name: "Plum", Origin: "Europe", BestFor: "Jams and tarts", Texture: "Smooth", Flavor: "Sweet and tart", Season: "Summer, Fall", ColorOutside: "purple", ColorInside: "red/yellow", Price: 0.80},
		{Name: "Cherry", Origin: "West Asia", BestFor: "Snacking and garnish", Texture: "Meaty", Flavor: "Sweet or sour", Season: "Summer", ColorOutside: "red", ColorInside: "red", Price: 5.50},
		{Name: "Pear", Origin: "South America", BestFor: "Poaching and cheese pairings", Texture: "Gritty", Flavor: "Sweet and mild", Season: "Fall, Winter", ColorOutside: "green/yellow", ColorInside: "white/yellow", Price: 0.90},
		{Name: "Orange", Origin: "South America", BestFor: "Juice and vit-C", Texture: "Pulpy", Flavor: "Sweet and citrusy", Season: "Winter", ColorOutside: "orange", ColorInside: "orange", Price: 0.60},
		{Name: "Grape", Origin: "Europe", BestFor: "Wine and table snacking", Texture: "Juicy", Flavor: "Sweet and musky", Season: "Fall", ColorOutside: "purple/green/red", ColorInside: "green/white", Price: 2.00},
		{Name: "Kiwi", Origin: "Oceania", BestFor: "Garnish and fruit cups", Texture: "Fleshy", Flavor: "Sweet and tart", Season: "Winter, Spring", ColorOutside: "brown", ColorInside: "green", Price: 0.70},
		{Name: "Pomegranate", Origin: "Middle East", BestFor: "Salad toppings and juice", Texture: "Crunchy seeds", Flavor: "Sweet and astringent", Season: "Fall, Winter", ColorOutside: "red", ColorInside: "red/pink", Price: 2.50},
		{Name: "Avocado", Origin: "North America", BestFor: "Guacamole and toast", Texture: "Buttery", Flavor: "Nutty and savory", Season: "All Season", ColorOutside: "green/black", ColorInside: "green/yellow", Price: 1.80},
		{Name: "Dragon Fruit", Origin: "South East Asia", BestFor: "Smoothie bowls", Texture: "Crunchy seeds", Flavor: "Mild and sweet", Season: "Summer, Fall", ColorOutside: "pink", ColorInside: "white", Price: 4.50},
		{Name: "Papaya", Origin: "North America", BestFor: "Digestive aid and smoothies", Texture: "Soft", Flavor: "Sweet and musky", Season: "All Season", ColorOutside: "orange/yellow/green", ColorInside: "orange", Price: 2.20},
		{Name: "Guava", Origin: "South East Asia", BestFor: "Jellies and juices", Texture: "Crunchy seeds", Flavor: "Sweet and fragrant", Season: "Winter, Spring", ColorOutside: "green", ColorInside: "pink/white", Price: 1.40},
		{Name: "Fig", Origin: "West Asia", BestFor: "Baking and appetizers", Texture: "Chewy", Flavor: "Sweet and honey-like", Season: "Summer, Fall", ColorOutside: "purple/green", ColorInside: "red/pink", Price: 3.50},
		{Name: "Apricot", Origin: "West Asia", BestFor: "Dried snacks and preserves", Texture: "Velvety", Flavor: "Sweet and tart", Season: "Summer", ColorOutside: "orange", ColorInside: "orange/yellow", Price: 1.10},
		{Name: "Blackberry", Origin: "North America", BestFor: "Baking and jams", Texture: "Bumpy", Flavor: "Tart and sweet", Season: "Summer", ColorOutside: "black/purple", ColorInside: "red/purple", Price: 3.80},
		{Name: "Raspberry", Origin: "North America", BestFor: "Toppings and desserts", Texture: "Hollow", Flavor: "Tart and delicate", Season: "Summer", ColorOutside: "red/pink", ColorInside: "red/white", Price: 4.20},
		{Name: "Blueberry", Origin: "North America", BestFor: "Pies and pancakes", Texture: "Firm", Flavor: "Sweet and tangy", Season: "Summer", ColorOutside: "blue/purple", ColorInside: "purple/white", Price: 3.50},
		{Name: "Cranberry", Origin: "North America", BestFor: "Sauces and juices", Texture: "Firm", Flavor: "Tart", Season: "Fall", ColorOutside: "red", ColorInside: "red/white", Price: 2.80},
		{Name: "Gooseberry", Origin: "Europe", BestFor: "Tarts and jams", Texture: "Translucent", Flavor: "Tart and sweet", Season: "Summer", ColorOutside: "green/yellow", ColorInside: "green/white", Price: 3.10},
		{Name: "Mulberry", Origin: "East Asia", BestFor: "Desserts", Texture: "Soft", Flavor: "Sweet", Season: "Spring, Summer", ColorOutside: "black/red/white", ColorInside: "red/purple", Price: 4.50},
		{Name: "Elderberry", Origin: "Europe", BestFor: "Syrups and wines", Texture: "Juicy", Flavor: "Tart", Season: "Summer, Fall", ColorOutside: "black/purple", ColorInside: "purple", Price: 5.00},
		{Name: "Lychee", Origin: "East Asia", BestFor: "Fresh fruit salads", Texture: "Jelly-like", Flavor: "Sweet and floral", Season: "Summer", ColorOutside: "pink/red", ColorInside: "white", Price: 6.00},
		{Name: "Rambutan", Origin: "South East Asia", BestFor: "Snacking", Texture: "Fleshy", Flavor: "Sweet and creamy", Season: "Summer, Winter", ColorOutside: "red", ColorInside: "white", Price: 5.50},
		{Name: "Mangosteen", Origin: "South East Asia", BestFor: "Desserts", Texture: "Soft", Flavor: "Sweet and tangy", Season: "Summer", ColorOutside: "purple", ColorInside: "white", Price: 8.00},
		{Name: "Durian", Origin: "South East Asia", BestFor: "Baking", Texture: "Custard-like", Flavor: "Sweet and pungent", Season: "Summer", ColorOutside: "green/yellow", ColorInside: "yellow", Price: 15.00},
		{Name: "Star Fruit", Origin: "South East Asia", BestFor: "Garnish", Texture: "Crisp", Flavor: "Sweet and tart", Season: "Fall, Winter", ColorOutside: "yellow/green", ColorInside: "yellow", Price: 3.20},
		{Name: "Passion Fruit", Origin: "South America", BestFor: "Juices and desserts", Texture: "Pulpy", Flavor: "Tart and fragrant", Season: "Summer, Winter", ColorOutside: "purple", ColorInside: "orange/yellow", Price: 4.00},
		{Name: "Persimmon", Origin: "East Asia", BestFor: "Baking and snacks", Texture: "Soft", Flavor: "Sweet and honey-like", Season: "Fall, Winter", ColorOutside: "orange", ColorInside: "orange/yellow", Price: 2.50},
		{Name: "Quince", Origin: "West Asia", BestFor: "Jams and stews", Texture: "Tough", Flavor: "Tart and fragrant", Season: "Fall", ColorOutside: "yellow/green", ColorInside: "yellow/white", Price: 3.00},
		{Name: "Cantaloupe", Origin: "North America", BestFor: "Fruit salads", Texture: "Juicy", Flavor: "Sweet", Season: "Summer", ColorOutside: "orange/brown", ColorInside: "orange", Price: 2.50},
		{Name: "Honeydew", Origin: "North America", BestFor: "Refreshments", Texture: "Juicy", Flavor: "Sweet", Season: "Summer", ColorOutside: "green/white", ColorInside: "green", Price: 3.00},
		{Name: "Blood Orange", Origin: "Europe", BestFor: "Salads and juice", Texture: "Pulpy", Flavor: "Sweet and tart", Season: "Winter, Spring", ColorOutside: "orange/red", ColorInside: "red/orange", Price: 1.50},
		{Name: "Clementine", Origin: "Europe", BestFor: "Snacking", Texture: "Juicy", Flavor: "Sweet", Season: "Winter", ColorOutside: "orange", ColorInside: "orange", Price: 0.80},
		{Name: "Tangerine", Origin: "North America", BestFor: "Snacking", Texture: "Juicy", Flavor: "Sweet", Season: "Winter, Spring", ColorOutside: "orange", ColorInside: "orange", Price: 1.00},
		{Name: "Pomelo", Origin: "East Asia", BestFor: "Fresh snacks", Texture: "Coarse", Flavor: "Sweet and bitter", Season: "Winter", ColorOutside: "green/yellow", ColorInside: "yellow/white", Price: 4.00},
		{Name: "Dates", Origin: "Middle East", BestFor: "Baking and snacks", Texture: "Chewy", Flavor: "Very sweet", Season: "All Season", ColorOutside: "brown", ColorInside: "brown/orange", Price: 5.00},
	}
}
	


func GetVisualEntitiesToSeed() []*model.VisualEntity {
	var entities []*model.VisualEntity

	// Path relative to the root of the project where CMD is run
	dir := "frontend/public/visualEntities"

	files, err := os.ReadDir(dir)
	if err != nil {
		log.Printf("Warning: could not read visualEntities directory: %v", err)
		return entities
	}

	for _, file := range files {
		if file.IsDir() {
			continue
		}

		name := file.Name()
		ext := strings.ToLower(filepath.Ext(name))
		if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".webp" || ext == ".svg" {
			var id int64
			baseName := strings.TrimSuffix(name, filepath.Ext(name))
			if strings.HasPrefix(baseName, "visual_entity_") {
				numStr := strings.TrimPrefix(baseName, "visual_entity_")
				if parsedID, err := strconv.ParseInt(numStr, 10, 64); err == nil {
					id = parsedID
				}
			}
			entities = append(entities, &model.VisualEntity{
				ID:       id,
				ImageURL: "/visualEntities/" + name,
			})
		}
	}

	return entities
}
