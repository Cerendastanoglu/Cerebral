/**
 * API Service for fetching data from external sources
 * Supports: Google Books API, The Movie Database (TMDB), Spotify API, etc.
 */

class APIService {
    constructor() {
        // API Keys (in production, these should be stored securely)
        this.googleBooksAPI = 'https://www.googleapis.com/books/v1/volumes';
        this.omdbAPI = 'https://www.omdbapi.com/';
        this.omdbKey = 't='; // Users will need to get their own key from http://www.omdbapi.com/apikey.aspx
        
        // Rate limiting
        this.lastRequestTime = 0;
        this.minRequestInterval = 500; // ms between requests
    }

    /**
     * Rate limiter to prevent API abuse
     */
    async rateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve => 
                setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
            );
        }
        
        this.lastRequestTime = Date.now();
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
     * Search across multiple sources based on category
     * @param {string} query - Search query
     * @param {string} category - Category type (books, movies, music, etc.)
     * @returns {Promise<Array>} Array of results
     */
    async search(query, category) {
        switch (category) {
            case 'books':
            case 'academic':
                return await this.searchBooks(query);
            
            case 'movies':
            case 'films':
                return await this.searchMovies(query);
            
            default:
                // For other categories, search books by default
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

