# API Integrations for Cerebral

## 📡 Available Data Sources

### ✅ Currently Implemented
1. **Google Books API** (FREE) - Books
2. **OMDB API** (FREE with key) - Movies

### 🚀 Ready to Implement

#### 1. **iTunes Search API** (FREE, No Key Required)
- **Podcasts** - Search and metadata
- **Music** - Albums, artists, tracks
- **Documentaries** - Available through movie search
- **Endpoint**: `https://itunes.apple.com/search`
- **Docs**: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/

#### 2. **TMDB API** (FREE Tier)
- **Movies** - Extensive database
- **TV Shows** - Series and episodes
- **Documentaries** - Category search
- **Images & Posters** - High quality
- **API Key**: Required (free)
- **Docs**: https://developers.themoviedb.org/

#### 3. **Spotify Web API** (FREE)
- **Music** - Albums, artists, playlists
- **Podcasts** - Show and episode data
- **Note**: Requires OAuth for full access, but search works with client credentials
- **Docs**: https://developer.spotify.com/documentation/web-api

#### 4. **RAWG Video Games Database** (FREE)
- **Games** - Extensive game database
- **Screenshots & Videos**
- **Platforms, Genres, Ratings**
- **API Key**: Required (free)
- **Docs**: https://rawg.io/apidocs

#### 5. **Spoonacular API** (FREE Tier - 150 requests/day)
- **Recipes** - Search and details
- **Ingredients & Nutrition**
- **API Key**: Required (free tier)
- **Docs**: https://spoonacular.com/food-api

#### 6. **TheMealDB** (FREE)
- **Recipes** - World cuisines
- **Categories & Ingredients**
- **No API Key Required**
- **Docs**: https://www.themealdb.com/api.php

#### 7. **Yelp Fusion API** (FREE Tier)
- **Restaurants** - Search and details
- **Reviews & Ratings**
- **API Key**: Required (free)
- **Docs**: https://www.yelp.com/developers

## 🔧 Implementation Priority

### Phase 1: Immediate (No API Keys)
1. ✅ iTunes Search API - Podcasts & Music
2. ✅ TheMealDB - Recipes

### Phase 2: With Free API Keys
1. TMDB - Movies & Documentaries
2. RAWG - Games
3. Yelp - Restaurants

### Phase 3: Advanced (OAuth Required)
1. Spotify - Enhanced music/podcast data
2. Google Places - Restaurant details

## 📝 Usage Notes

### Privacy Considerations
- All API calls are made from the user's device
- No data sent to our servers (we don't have any!)
- API keys stored locally in the app
- User data never shared with third parties

### Rate Limits
- iTunes Search API: No documented limits
- TMDB: 40 requests per 10 seconds
- RAWG: 20,000 requests/month (free tier)
- Spoonacular: 150 requests/day (free tier)
- TheMealDB: No limits
- Yelp: 500 requests/day (free tier)

### API Key Management
Users will need to:
1. Sign up for free API keys (one-time)
2. Enter keys in app settings
3. Keys stored securely in local storage
4. Keys never leave the device

## 🎯 Implementation Strategy

For each content type:
1. **Primary Source**: Best free API with no key
2. **Fallback Source**: Alternative API if primary fails
3. **Manual Entry**: Always available as fallback

Example:
- **Podcasts**: iTunes Search API (primary) → Manual entry (fallback)
- **Movies**: OMDB (current) → TMDB (better) → Manual entry
- **Recipes**: TheMealDB (free) → Spoonacular (paid) → Manual entry

## 🔐 Required API Keys (All Free Tiers)

To get full functionality, users should sign up for:
1. **TMDB** - https://www.themoviedb.org/signup
2. **RAWG** - https://rawg.io/apidocs (click "Get API Key")
3. **Spoonacular** - https://spoonacular.com/food-api/console (optional)
4. **Yelp** - https://www.yelp.com/developers/v3/manage_app

All are free, no credit card required!

