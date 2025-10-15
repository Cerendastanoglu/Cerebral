# Cerebral - Personal Data Manager

A beautiful, cross-platform desktop application for storing and managing all your personal preferences, from movies and books to shops and lifestyle choices.

## Features

- **Movies**: Track your movie collection with ratings, genres, directors, and watch dates
- **Books**: Manage your reading list with author information, ratings, and reading progress
- **Shops**: Keep a record of your favorite stores, restaurants, and businesses
- **Magazines**: Track magazine subscriptions and issues
- **Preferences**: Store personal preferences across different categories
- **Search**: Global search across all your data
- **Modern UI**: Clean, intuitive interface with dark sidebar and light content area

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the App

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Building for Distribution

### Build for Current Platform
```bash
npm run build
```

### Build for Mac
```bash
npm run build:mac
```

### Build for Windows
```bash
npm run build:win
```

## Usage

1. **Dashboard**: View overview statistics and recent items
2. **Add Items**: Click the "Add Item" button to add new entries
3. **Edit Items**: Click the "Edit" button on any item card
4. **Search**: Use the global search bar to find items across all categories
5. **Filter**: Use the filter dropdowns in each section to narrow down results

## Data Storage

All data is stored locally in a SQLite database (`src/data/cerebral.db`). Your data stays private and secure on your device.

## Technology Stack

- **Electron**: Cross-platform desktop app framework
- **SQLite3**: Local database storage
- **HTML/CSS/JavaScript**: Frontend interface
- **Node.js**: Backend runtime

## Customization

You can easily extend the app by:
- Adding new categories in the database schema
- Creating new form fields in the `getFormFields()` method
- Adding new sections to the navigation

## License

ISC License - feel free to modify and distribute as needed.
