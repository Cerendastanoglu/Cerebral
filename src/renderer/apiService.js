/**
 * API Service for fetching data from external sources
 * Supports: Google Books, iTunes (Podcasts/Music), TMDB, RAWG, TheMealDB, etc.
 */

class APIService {
    constructor() {
        // API Endpoints (Free, No Keys Required)
        this.googleBooksAPI = 'https://www.googleapis.com/books/v1/volumes';
        this.itunesSearchAPI = 'https://itunes.apple.com/search';
        this.mealDBAPI = 'https://www.themealdb.com/api/json/v1/1';
        
        // APIs requiring keys (optional - stored in localStorage)
        this.omdbAPI = 'https://www.omdbapi.com/';
        this.tmdbAPI = 'https://api.themoviedb.org/3';
        this.rawgAPI = 'https://api.rawg.io/api';
        this.yelpAPI = 'https://api.yelp.com/v3';
        
        // Rate limiting
        this.lastRequestTime = {};
        this.minRequestInterval = 500; // ms between requests per API
        
        // Load API keys from localStorage
        this.loadAPIKeys();
    }
    
    loadAPIKeys() {
        this.apiKeys = {
            omdb: localStorage.getItem('apiKey_omdb') || '',
            tmdb: localStorage.getItem('apiKey_tmdb') || '',
            rawg: localStorage.getItem('apiKey_rawg') || '',
            yelp: localStorage.getItem('apiKey_yelp') || ''
        };
    }
    
    saveAPIKey(service, key) {
        localStorage.setItem(`apiKey_${service}`, key);
        this.apiKeys[service] = key;
    }

    /**
     * Rate limiter to prevent API abuse
     */
    async rateLimit(apiName = 'default') {
        const now = Date.now();
        const lastRequest = this.lastRequestTime[apiName] || 0;
        const timeSinceLastRequest = now - lastRequest;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve => 
                setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
            );
        }
        
        this.lastRequestTime[apiName] = Date.now();
    }

    /**
     * Search for books using Google Books API
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of book results
     */
    async searchBooks(query) {
        if (!query || query.trim().length < 2) return [];
        
        await this.rateLimit();
        
        try {
            const url = `${this.googleBooksAPI}?q=${encodeURIComponent(query)}&maxResults=10`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.items) return [];
            
            return data.items.map(item => ({
                id: item.id,
                title: item.volumeInfo.title || 'Unknown Title',
                author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown Author',
                year: item.volumeInfo.publishedDate ? item.volumeInfo.publishedDate.split('-')[0] : '',
                description: item.volumeInfo.description || '',
                thumbnail: item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail || '',
                pageCount: item.volumeInfo.pageCount || 0,
                categories: item.volumeInfo.categories ? item.volumeInfo.categories.join(', ') : '',
                language: item.volumeInfo.language || 'en',
                isbn: item.volumeInfo.industryIdentifiers?.[0]?.identifier || '',
                publisher: item.volumeInfo.publisher || '',
                type: 'book'
            }));
        } catch (error) {
            console.error('Error fetching books:', error);
            return [];
        }
    }

    /**
     * Search for movies using OMDB API (alternative to TMDB)
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of movie results
     */
    async searchMovies(query) {
        if (!query || query.trim().length < 2) return [];
        
        await this.rateLimit();
        
        try {
            // Using OMDB API as it doesn't require authentication for basic searches
            const url = `${this.omdbAPI}?s=${encodeURIComponent(query)}&type=movie`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.Response === 'False' || !data.Search) return [];
            
            // Get detailed info for each movie
            const detailedResults = await Promise.all(
                data.Search.slice(0, 5).map(async (movie) => {
                    try {
                        const detailUrl = `${this.omdbAPI}?i=${movie.imdbID}&plot=full`;
                        const detailResponse = await fetch(detailUrl);
                        const detailData = await detailResponse.json();
                        
                        return {
                            id: movie.imdbID,
                            title: detailData.Title || movie.Title,
                            year: detailData.Year || movie.Year,
                            director: detailData.Director || 'Unknown',
                            actors: detailData.Actors || '',
                            plot: detailData.Plot || '',
                            thumbnail: movie.Poster !== 'N/A' ? movie.Poster : '',
                            genre: detailData.Genre || '',
                            rating: detailData.imdbRating || '',
                            runtime: detailData.Runtime || '',
                            language: detailData.Language || '',
                            type: 'movie'
                        };
                    } catch (error) {
                        console.error('Error fetching movie details:', error);
                        return {
                            id: movie.imdbID,
                            title: movie.Title,
                            year: movie.Year,
                            thumbnail: movie.Poster !== 'N/A' ? movie.Poster : '',
                            type: 'movie'
                        };
                    }
                })
            );
            
            return detailedResults;
        } catch (error) {
            console.error('Error fetching movies:', error);
            return [];
        }
    }

    /**
     * Search for podcasts using iTunes Search API (FREE)
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of podcast results
     */
    async searchPodcasts(query) {
        if (!query || query.trim().length < 2) return [];
        
        await this.rateLimit('itunes');
        
        try {
            const url = `${this.itunesSearchAPI}?term=${encodeURIComponent(query)}&media=podcast&limit=20`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) return [];
            
            return data.results.map(item => ({
                id: item.collectionId,
                title: item.collectionName || item.trackName,
                creator: item.artistName || 'Unknown',
                description: item.description || '',
                thumbnail: item.artworkUrl600 || item.artworkUrl100 || '',
                genre: item.primaryGenreName || '',
                episodeCount: item.trackCount || 0,
                feedUrl: item.feedUrl || '',
                releaseDate: item.releaseDate || '',
                type: 'podcast'
            }));
        } catch (error) {
            console.error('Error fetching podcasts:', error);
            return [];
        }
    }

    /**
     * Search for music using iTunes Search API (FREE)
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of music results
     */
    async searchMusic(query) {
        if (!query || query.trim().length < 2) return [];
        
        await this.rateLimit('itunes');
        
        try {
            const url = `${this.itunesSearchAPI}?term=${encodeURIComponent(query)}&media=music&entity=album&limit=20`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) return [];
            
            return data.results.map(item => ({
                id: item.collectionId,
                title: item.collectionName,
                artist: item.artistName,
                year: item.releaseDate ? item.releaseDate.split('-')[0] : '',
                thumbnail: item.artworkUrl100 || '',
                genre: item.primaryGenreName || '',
                trackCount: item.trackCount || 0,
                type: 'music'
            }));
        } catch (error) {
            console.error('Error fetching music:', error);
            return [];
        }
    }

    /**
     * Search for TV shows using iTunes Search API (FREE)
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of TV show results
     */
    async searchTVShows(query) {
        if (!query || query.trim().length < 2) return [];
        
        await this.rateLimit('itunes');
        
        try {
            const url = `${this.itunesSearchAPI}?term=${encodeURIComponent(query)}&media=tvShow&entity=tvSeason&limit=20`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) return [];
            
            return data.results.map(item => ({
                id: item.collectionId,
                title: item.collectionName,
                creator: item.artistName,
                year: item.releaseDate ? item.releaseDate.split('-')[0] : '',
                thumbnail: item.artworkUrl600 || item.artworkUrl100 || '',
                genre: item.primaryGenreName || '',
                description: item.longDescription || item.shortDescription || '',
                type: 'show'
            }));
        } catch (error) {
            console.error('Error fetching TV shows:', error);
            return [];
        }
    }

    /**
     * Search for recipes using TheMealDB (FREE, No Key Required)
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of recipe results
     */
    async searchRecipes(query) {
        if (!query || query.trim().length < 2) return [];
        
        await this.rateLimit('mealdb');
        
        try {
            const url = `${this.mealDBAPI}/search.php?s=${encodeURIComponent(query)}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            if (!data.meals) return [];
            
            return data.meals.map(item => ({
                id: item.idMeal,
                title: item.strMeal,
                category: item.strCategory,
                cuisine: item.strArea,
                thumbnail: item.strMealThumb,
                instructions: item.strInstructions,
                ingredients: this.extractIngredients(item),
                youtubeUrl: item.strYoutube || '',
                sourceUrl: item.strSource || '',
                type: 'recipe'
            }));
        } catch (error) {
            console.error('Error fetching recipes:', error);
            return [];
        }
    }

    extractIngredients(meal) {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                ingredients.push(`${measure} ${ingredient}`.trim());
            }
        }
        return ingredients;
    }

    /**
     * Search across multiple sources based on category
     * @param {string} query - Search query
     * @param {string} category - Category type (books, movies, music, etc.)
     * @returns {Promise<Array>} Array of results
     */
    async search(query, category) {
        switch (category) {
            case 'books':
                return await this.searchBooks(query);
            
            case 'movies':
            case 'documentaries':
                return await this.searchMovies(query);
            
            case 'podcasts':
                return await this.searchPodcasts(query);
            
            case 'music':
                return await this.searchMusic(query);
            
            case 'shows':
                return await this.searchTVShows(query);
            
            case 'recipes':
                return await this.searchRecipes(query);
            
            default:
                return await this.searchBooks(query);
        }
    }

    /**
     * Get recommendations based on item
     * @param {string} itemId - Item ID
     * @param {string} type - Item type (book, movie, etc.)
     * @returns {Promise<Array>} Array of recommendations
     */
    async getRecommendations(itemId, type) {
        // This would be implemented with recommendation APIs
        // For now, return empty array
        return [];
    }
}

// Export as singleton
window.apiService = new APIService();


