const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // JSON file operations
  loadJSON: (fileName) => ipcRenderer.invoke('load-json', fileName),
  saveJSON: (fileName, data) => ipcRenderer.invoke('save-json', fileName, data),
  
  // Feed operations
  parseFeed: (feedUrl) => ipcRenderer.invoke('parse-feed', feedUrl),
  findRSSFeeds: (websiteUrl) => ipcRenderer.invoke('find-rss-feeds', websiteUrl),
  
  // Content fetching
  fetchOGImage: (link) => ipcRenderer.invoke('fetch-og-image', link),
  fetchOGDescription: (link) => ipcRenderer.invoke('fetch-og-description', link),
  
  // Notifications and external links
  sendNotification: (title, message, link, imageUrl) => ipcRenderer.invoke('send-notification', title, message, link, imageUrl),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Menu events
  onMenuNewProject: (callback) => ipcRenderer.on('menu-new-project', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});