# Cerebral - Your Personal Knowledge Map 🧠

A beautiful, privacy-focused desktop application for organizing your intellectual, emotional, physical, and spiritual knowledge.

## 🌟 Features

- **Four Knowledge Dimensions**: Intellectual, Emotional, Physical, and Beyond
- **Rich Categories**: Track books, movies, podcasts, restaurants, fitness, meditation, and more
- **Customizable Dashboard**: Choose which stats to display on your dashboard
- **Recent Activity**: See your latest additions across all categories
- **Privacy First**: All data stored locally on your device

## 🔒 Privacy & Data Storage

**Your data never leaves your device.**

- ✅ 100% local storage using SQLite
- ✅ No cloud syncing
- ✅ No data transmission to servers
- ✅ No analytics or tracking
- ✅ No account required

See [DATA_PRIVACY.md](DATA_PRIVACY.md) for complete details.

## 📦 Installation

```bash
# Install dependencies
npm install

# Run the app
npm start
```

## 🎨 Customization

### Quick Stats
Click the "Manage" button in the Quick Stats section to customize which categories appear on your dashboard.

### Data Backup
Your data is stored in: `src/data/cerebral.db`

To backup:
1. Copy the `cerebral.db` file to a safe location
2. Restore by replacing the file in the same location

## 🛠️ Technology Stack

- **Electron**: Cross-platform desktop application
- **SQLite**: Local database storage
- **Vanilla JavaScript**: No heavy frameworks
- **CSS3**: Modern, responsive design
- **Font Awesome**: Beautiful icons

## 📁 Project Structure

```
cerebral/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # UI and app logic
│   │   ├── index.html  # Main HTML
│   │   ├── app.js      # Application logic
│   │   └── apiService.js
│   ├── styles/         # CSS files
│   └── data/           # Local SQLite database (gitignored)
├── node_modules/       # Dependencies
└── package.json        # Project configuration
```

## 🎯 Categories Available

### Intellectual 🧠
- Books, Podcasts, Courses, Documentaries, Ideas

### Emotional ❤️
- Movies, TV Shows, Music, Art, Games, Journal

### Physical 💪
- Restaurants, Recipes, Places, Activities, Shopping, Fitness

### Beyond ✨
- Meditation, Philosophy, Spirituality, Dreams, Gratitude, Wisdom

## 🔐 Security Notes

- Database file is gitignored by default
- No external API calls for data storage
- All preferences stored in browser localStorage (local only)
- Safe to use offline

## 🤝 Contributing

This is a personal knowledge management tool. Feel free to fork and customize for your own use!

## 📝 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for personal knowledge management**

*Your mind is your greatest asset. Keep it organized.*
