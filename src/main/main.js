const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('sqlite3').Database;

let mainWindow;
let db;

// Initialize database
function initDatabase() {
  const dbPath = path.join(__dirname, '..', 'data', 'cerebral.db');
  
  // Ensure the data directory exists
  const fs = require('fs');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  db = new Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
      return;
    }
    console.log('Database opened successfully at:', dbPath);
  });
  
  // Create tables for different categories
  db.serialize(() => {
    // Movies table
    db.run(`CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      year INTEGER,
      genre TEXT,
      rating INTEGER,
      director TEXT,
      actors TEXT,
      plot TEXT,
      watched_date TEXT,
      notes TEXT,
      category TEXT,
      body_part TEXT,
      type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Books table
    db.run(`CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT,
      year TEXT,
      genre TEXT,
      rating INTEGER DEFAULT 0,
      pages INTEGER,
      isbn TEXT,
      read_date TEXT,
      notes TEXT,
      category TEXT,
      subcategory TEXT,
      body_part TEXT,
      type TEXT,
      status TEXT DEFAULT 'wishlist',
      tags TEXT,
      cover_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Add missing columns to existing books table
    db.run(`ALTER TABLE books ADD COLUMN subcategory TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.log('Subcategory column already exists or error:', err.message);
      }
    });
    
    db.run(`ALTER TABLE books ADD COLUMN status TEXT DEFAULT 'wishlist'`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.log('Status column already exists or error:', err.message);
      }
    });
    
    db.run(`ALTER TABLE books ADD COLUMN tags TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.log('Tags column already exists or error:', err.message);
      }
    });
    
    db.run(`ALTER TABLE books ADD COLUMN cover_image TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.log('Cover_image column already exists or error:', err.message);
      }
    });
    
    db.run(`ALTER TABLE books ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.log('Updated_at column already exists or error:', err.message);
      }
    });
    
    // Shops table
    db.run(`CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      location TEXT,
      website TEXT,
      phone TEXT,
      rating INTEGER,
      notes TEXT,
      body_part TEXT,
      type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Magazines table
    db.run(`CREATE TABLE IF NOT EXISTS magazines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      publisher TEXT,
      category TEXT,
      issue_number TEXT,
      publication_date TEXT,
      rating INTEGER,
      notes TEXT,
      body_part TEXT,
      type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // General preferences table
    db.run(`CREATE TABLE IF NOT EXISTS preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      item TEXT NOT NULL,
      value TEXT,
      notes TEXT,
      body_part TEXT,
      type TEXT,
      intensity INTEGER,
      status TEXT,
      duration TEXT,
      benefits TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Add subcategory column to all tables (with error handling)
    db.run(`ALTER TABLE movies ADD COLUMN subcategory TEXT DEFAULT 'general'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding subcategory to movies:', err);
        }
    });
    db.run(`ALTER TABLE books ADD COLUMN subcategory TEXT DEFAULT 'general'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding subcategory to books:', err);
        }
    });
    db.run(`ALTER TABLE shops ADD COLUMN subcategory TEXT DEFAULT 'general'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding subcategory to shops:', err);
        }
    });
    db.run(`ALTER TABLE magazines ADD COLUMN subcategory TEXT DEFAULT 'general'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding subcategory to magazines:', err);
        }
    });
    db.run(`ALTER TABLE preferences ADD COLUMN subcategory TEXT DEFAULT 'general'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding subcategory to preferences:', err);
        }
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    titleBarStyle: 'hiddenInset',
    show: false
  });

  mainWindow.loadFile('src/renderer/index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for database operations
ipcMain.handle('db-query', async (event, query, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database query error:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('db-run', async (event, query, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    db.run(query, params, function(err) {
      if (err) {
        console.error('Database run error:', err);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
});
