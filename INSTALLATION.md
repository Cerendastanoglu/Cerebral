# Installation Guide

## 📦 What You Get

When you download Cerebral, you receive:

1. **The Application** - Desktop app that runs on your computer
2. **Local Database** - SQLite database created automatically on first run
3. **Documentation** - All guides stored locally:
   - `README.md` - Main documentation
   - `DATA_PRIVACY.md` - Privacy policy and data information
   - `INSTALLATION.md` - This file

## 💾 What Gets Stored Locally

All of your data is stored in the following locations on YOUR device:

### Application Data
- **Location**: `src/data/cerebral.db`
- **Contains**: All your tracked items (books, movies, restaurants, etc.)
- **Format**: SQLite database file
- **Privacy**: Never synced, never uploaded, completely local

### User Preferences
- **Location**: Browser localStorage within the app
- **Contains**: UI preferences, Quick Stats selections
- **Privacy**: Completely local

### Documentation
All documentation files (README, Privacy Policy, etc.) are included in the app installation directory and available within the app via the Help button (? icon) in the header.

## 🚀 Installation Steps

### For Development
```bash
# 1. Install dependencies
npm install

# 2. Run the application
npm start
```

### For Production Use
When you receive the packaged application:
1. Download the installer for your platform
2. Run the installer
3. Launch Cerebral
4. Your data will be stored locally automatically

## 📍 Finding Your Data

Your personal data is stored at:
```
[Application Directory]/src/data/cerebral.db
```

To locate it:
1. Open the app
2. Click the Privacy shield icon (🛡️) in the header
3. Note the file path shown

## 💾 Backing Up Your Data

### Manual Backup (Recommended)
1. Locate your database file: `src/data/cerebral.db`
2. Copy this file to a safe location (external drive, cloud storage of your choice, etc.)
3. To restore: Replace the database file with your backup

### What to Backup
- ✅ `cerebral.db` - Your entire knowledge base
- Optional: Take note of your UI preferences (Quick Stats selections) as they're stored in localStorage

## 🔄 Moving to a New Computer

1. Copy your `cerebral.db` file from the old computer
2. Install Cerebral on the new computer
3. Replace the new `cerebral.db` file with your backup
4. All your data will be available!

## 🗑️ Uninstalling

When you uninstall Cerebral:
1. Your data (`cerebral.db`) remains on your computer
2. To completely remove all data, also delete the `src/data/` folder
3. No data remains on any external servers (because we don't use any!)

## ⚠️ Important Notes

- **First Launch**: Database is created automatically on first run
- **No Internet Required**: App works completely offline
- **No Account Needed**: No sign-up, no login, just use it
- **Your Privacy**: Zero data collection, zero tracking

## 📚 Accessing Documentation

You can access help and documentation:
1. **In-App**: Click the ? icon in the top-right header
2. **Files**: All `.md` files in the installation directory
3. **Privacy Info**: Click the 🛡️ icon in the top-right header

## 🆘 Support

Since this is a local-first application with no external dependencies:
- All documentation is included locally
- No online account or support portal needed
- All help resources available within the app

## 🔐 Security Reminder

- Your data is only as secure as your computer
- Consider encrypting your backup files
- Keep your backup in a secure location
- No passwords or authentication in the app = full access to whoever uses your computer

---

**Remember**: Your data stays on your device. Always. 🔒

