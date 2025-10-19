const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const feedparser = require('feedparser');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const notifier = require('node-notifier');

// Constants - Data files stored in root directory for easier access
const DATA_DIR = path.join(__dirname, '..', '..');
const PROJECTS_FILE = path.join(DATA_DIR, 'data', 'projects.json');
const LANGUAGES_FILE = path.join(DATA_DIR, 'data', 'languages.json');
const READ_FILE = path.join(DATA_DIR, 'data', 'read.json');
const LOG_FILE = path.join(DATA_DIR, 'data', 'read_log.json');
const SEEN_FILE = path.join(DATA_DIR, 'data', 'seen.json');
const OG_CACHE_FILE = path.join(DATA_DIR, 'data', 'cache_og.json');

let mainWindow;

// Utility functions
async function ensureDataDir() {
  const dataDir = path.dirname(PROJECTS_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

async function loadJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function saveJSON(filePath, data) {
  try {
    await ensureDataDir();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving JSON:', error);
  }
}

async function fetchOGImage(link) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    const response = await axios.get(link, { headers, timeout: 5000 });
    
    if (response.status !== 200) return null;
    
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // Try og:image
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.content) return ogImage.content;
    
    // Try twitter:image
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage && twitterImage.content) return twitterImage.content;
    
    // Try first img tag
    const firstImg = document.querySelector('img');
    if (firstImg && firstImg.src) return firstImg.src;
    
    return null;
  } catch (error) {
    return null;
  }
}

async function fetchOGDescription(link) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    const response = await axios.get(link, { headers, timeout: 5000 });
    
    if (response.status !== 200) return null;
    
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // Try og:description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && ogDesc.content) return ogDesc.content;
    
    // Try meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.content) return metaDesc.content;
    
    return null;
  } catch (error) {
    return null;
  }
}

async function getCachedOGImage(link) {
  const cache = await loadJSON(OG_CACHE_FILE);
  if (cache[link]) return cache[link];
  
  const image = await fetchOGImage(link);
  if (image) {
    cache[link] = image;
    await saveJSON(OG_CACHE_FILE, cache);
  }
  return image;
}

async function parseFeed(feedUrl) {
  return new Promise((resolve, reject) => {
    const req = axios.get(feedUrl, {
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    req.then(response => {
      const feedParser = new feedparser();
      const entries = [];
      
      feedParser.on('error', reject);
      feedParser.on('readable', function() {
        let item;
        while (item = this.read()) {
          entries.push(item);
        }
      });
      feedParser.on('end', () => resolve(entries));
      
      response.data.pipe(feedParser);
    }).catch(reject);
  });
}

function sendDesktopNotification(title, message, link = null, imageUrl = null) {
  try {
    const notificationOptions = {
      title,
      message,
      sound: true,
      wait: false
    };
    
    if (imageUrl) {
      notificationOptions.icon = imageUrl;
    }
    
    notifier.notify(notificationOptions);
    
    if (link) {
      notifier.on('click', () => {
        shell.openExternal(link);
      });
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload', 'preload.js')
    },
    icon: path.join(DATA_DIR, 'assets', 'icons', 'icon.png'),
    show: false
  });

  mainWindow.loadFile(path.join(DATA_DIR, 'src', 'renderer', 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Create menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-new-project')
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About MyFeedDeck',
              message: 'MyFeedDeck v1.0.0',
              detail: 'A professional RSS feed reader built with Electron\nCreated by Markus Begerow'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('load-json', async (event, fileName) => {
  const filePath = path.join(DATA_DIR, 'data', fileName);
  return await loadJSON(filePath);
});

ipcMain.handle('save-json', async (event, fileName, data) => {
  const filePath = path.join(DATA_DIR, 'data', fileName);
  await saveJSON(filePath, data);
});

ipcMain.handle('parse-feed', async (event, feedUrl) => {
  try {
    return await parseFeed(feedUrl);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('fetch-og-image', async (event, link) => {
  return await getCachedOGImage(link);
});

ipcMain.handle('fetch-og-description', async (event, link) => {
  return await fetchOGDescription(link);
});

ipcMain.handle('send-notification', async (event, title, message, link, imageUrl) => {
  sendDesktopNotification(title, message, link, imageUrl);
});

ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('find-rss-feeds', async (event, websiteUrl) => {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    const response = await axios.get(websiteUrl, { headers, timeout: 7000 });
    
    if (response.status !== 200) return [];
    
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    const found = [];
    
    // Find RSS links
    const rssLinks = document.querySelectorAll('link[type*="rss"], link[type*="atom"]');
    rssLinks.forEach(link => {
      const href = link.href;
      const title = link.title || 'RSS Feed';
      if (href) {
        const fullUrl = new URL(href, websiteUrl).toString();
        found.push({ title: title.trim(), url: fullUrl });
      }
    });
    
    // Find RSS anchor links
    const anchorLinks = document.querySelectorAll('a[href*="rss"], a[href*="feed"]');
    anchorLinks.forEach(a => {
      const href = a.href;
      if (href && (href.toLowerCase().includes('rss') || href.toLowerCase().includes('feed'))) {
        const fullUrl = new URL(href, websiteUrl).toString();
        if (!found.some(f => f.url === fullUrl)) {
          const title = a.textContent.trim() || 'RSS Feed';
          found.push({ title, url: fullUrl });
        }
      }
    });
    
    // Try fallback paths
    const fallbackPaths = ['/feed', '/rss', '/feeds/posts/default', '/index.xml'];
    for (const path of fallbackPaths) {
      const fallbackUrl = new URL(path, websiteUrl).toString();
      if (!found.some(f => f.url === fallbackUrl)) {
        try {
          await parseFeed(fallbackUrl);
          found.push({ title: `Fallback: ${path}`, url: fallbackUrl });
        } catch (error) {
          // Ignore invalid feeds
        }
      }
    }
    
    // Remove duplicates
    const unique = [];
    const seen = new Set();
    found.forEach(feed => {
      if (!seen.has(feed.url)) {
        seen.add(feed.url);
        unique.push(feed);
      }
    });
    
    return unique;
  } catch (error) {
    console.error('Error finding RSS feeds:', error);
    return [];
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});