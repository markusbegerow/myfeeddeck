// Global state
let currentLanguage = 'English';
let translations = {};
let projects = {};
let readStatus = {};
let seenStatus = {};
let currentProject = null;
let notificationHistory = [];
let settings = {
    numItems: 5,
    searchTerm: '',
    searchAllProjects: false,
    refreshInterval: 0,
    enableNotifications: false,
    notificationTimeout: 10,
    webhookUrl: '',
    showImages: true,
    showStreamlitNotifications: true,
    showDesktopNotifications: true,
    playSound: false
};

// DOM elements
const elements = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await initializeElements();
    await loadInitialData();
    setupEventListeners();
    initializeSidebar();
    await updateUI();
});

function initializeElements() {
    // Mobile menu elements
    elements.mobileMenuToggle = document.getElementById('mobileMenuToggle');
    elements.sidebarOverlay = document.getElementById('sidebarOverlay');
    elements.sidebar = document.querySelector('.sidebar');
    
    elements.languageSelect = document.getElementById('languageSelect');
    elements.numItems = document.getElementById('numItems');
    elements.numItemsValue = document.getElementById('numItemsValue');
    elements.searchTerm = document.getElementById('searchTerm');
    elements.searchAllProjects = document.getElementById('searchAllProjects');
    elements.refreshInterval = document.getElementById('refreshInterval');
    elements.enableNotifications = document.getElementById('enableNotifications');
    elements.notificationTimeout = document.getElementById('notificationTimeout');
    elements.testNotification = document.getElementById('testNotification');
    elements.projectSelect = document.getElementById('projectSelect');
    elements.newProjectName = document.getElementById('newProjectName');
    elements.createProject = document.getElementById('createProject');
    elements.deleteProject = document.getElementById('deleteProject');
    elements.websiteInput = document.getElementById('websiteInput');
    elements.findFeeds = document.getElementById('findFeeds');
    elements.foundFeedsSection = document.getElementById('foundFeedsSection');
    elements.foundFeedsSelect = document.getElementById('foundFeedsSelect');
    elements.addFoundFeed = document.getElementById('addFoundFeed');
    elements.feedsList = document.getElementById('feedsList');
    elements.webhookUrl = document.getElementById('webhookUrl');
    elements.projectTitle = document.getElementById('projectTitle');
    elements.currentProjectName = document.getElementById('currentProjectName');
    elements.refreshFeeds = document.getElementById('refreshFeeds');
    elements.newArticlesBadge = document.getElementById('newArticlesBadge');
    elements.loadingSpinner = document.getElementById('loadingSpinner');
    elements.feedColumns = document.getElementById('feedColumns');
    elements.noProjectMessage = document.getElementById('noProjectMessage');
    elements.notificationContainer = document.getElementById('notificationContainer');
    
    // Notification extras
    elements.showImages = document.getElementById('showImages');
    elements.showStreamlitNotifications = document.getElementById('showStreamlitNotifications');
    elements.showDesktopNotifications = document.getElementById('showDesktopNotifications');
    elements.playSound = document.getElementById('playSound');
    elements.notificationHistory = document.getElementById('notificationHistory');
    elements.notificationList = document.getElementById('notificationList');
    elements.clearNotifications = document.getElementById('clearNotifications');
}

function initializeSidebar() {
    // Initialize all sections as collapsed (like Streamlit expanders)
    const sections = document.querySelectorAll('.sidebar-section.expandable');
    sections.forEach(section => {
        const content = section.querySelector('.section-content');
        if (content) {
            content.classList.add('collapsed');
        }
    });
}

// Expandable section functionality (recreating Streamlit expanders)
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const header = section.previousElementSibling;
    
    if (section.classList.contains('collapsed')) {
        // Expand
        section.classList.remove('collapsed');
        section.classList.add('expanded');
        header.classList.add('expanded');
    } else {
        // Collapse
        section.classList.remove('expanded');
        section.classList.add('collapsed');
        header.classList.remove('expanded');
    }
}

// Make toggleSection globally available
window.toggleSection = toggleSection;

// Mobile menu functions
function toggleMobileMenu() {
    if (elements.sidebar.classList.contains('mobile-open')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    elements.sidebar.classList.add('mobile-open');
    elements.sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeMobileMenu() {
    elements.sidebar.classList.remove('mobile-open');
    elements.sidebarOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Close mobile menu when switching to desktop view using matchMedia
const desktopMediaQuery = window.matchMedia('(min-width: 769px)');
function handleViewportChange(e) {
    if (e.matches) {
        // Desktop view - close mobile menu if open
        closeMobileMenu();
    }
}

// Listen for viewport changes
desktopMediaQuery.addEventListener('change', handleViewportChange);

// Also add a debounced resize listener as fallback for edge cases
const debouncedResize = debounce(() => {
    if (window.innerWidth > 768 && elements.sidebar.classList.contains('mobile-open')) {
        closeMobileMenu();
    }
}, 150);

window.addEventListener('resize', debouncedResize);

async function loadInitialData() {
    try {
        // Load translations
        translations = await window.electronAPI.loadJSON('languages.json');
        
        // Load projects
        projects = await window.electronAPI.loadJSON('projects.json');
        
        // Load read status
        readStatus = await window.electronAPI.loadJSON('read.json');
        
        // Load seen status
        seenStatus = await window.electronAPI.loadJSON('seen.json');
        
        // Update project select
        updateProjectSelect();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('Error loading data', 'error');
    }
}

function setupEventListeners() {
    // Mobile menu
    if (elements.mobileMenuToggle) {
        elements.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Close mobile menu when clicking on sidebar links
    if (elements.sidebar) {
        elements.sidebar.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
                // Reduced delay for snappier mobile experience
                setTimeout(closeMobileMenu, 50);
            }
        });
    }

    // Language selector
    elements.languageSelect.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        updateTranslations();
    });

    // Settings
    elements.numItems.addEventListener('input', (e) => {
        settings.numItems = parseInt(e.target.value);
        elements.numItemsValue.textContent = e.target.value;
        if (currentProject) loadFeeds();
    });

    elements.searchTerm.addEventListener('input', (e) => {
        settings.searchTerm = e.target.value.toLowerCase();
        if (currentProject) loadFeeds();
    });

    elements.searchAllProjects.addEventListener('change', (e) => {
        settings.searchAllProjects = e.target.checked;
        if (currentProject) loadFeeds();
    });

    elements.refreshInterval.addEventListener('change', (e) => {
        settings.refreshInterval = parseInt(e.target.value);
        setupAutoRefresh();
    });

    // Notification settings
    elements.enableNotifications.addEventListener('change', (e) => {
        settings.enableNotifications = e.target.checked;
        updateNotificationExtras();
    });

    elements.notificationTimeout.addEventListener('change', (e) => {
        settings.notificationTimeout = parseInt(e.target.value);
    });

    // Notification extras
    if (elements.showImages) {
        elements.showImages.addEventListener('change', (e) => {
            settings.showImages = e.target.checked;
        });
    }

    if (elements.showStreamlitNotifications) {
        elements.showStreamlitNotifications.addEventListener('change', (e) => {
            settings.showStreamlitNotifications = e.target.checked;
        });
    }

    if (elements.showDesktopNotifications) {
        elements.showDesktopNotifications.addEventListener('change', (e) => {
            settings.showDesktopNotifications = e.target.checked;
        });
    }

    if (elements.playSound) {
        elements.playSound.addEventListener('change', (e) => {
            settings.playSound = e.target.checked;
        });
    }

    // Test notification
    elements.testNotification.addEventListener('click', () => {
        testNotification();
    });

    // Project management
    elements.projectSelect.addEventListener('change', (e) => {
        currentProject = e.target.value;
        updateFeedsList();
        updateMainContent();
        if (currentProject) loadFeeds();
    });

    elements.createProject.addEventListener('click', () => {
        createProject();
    });

    elements.deleteProject.addEventListener('click', () => {
        deleteProject();
    });

    // RSS feed finder
    elements.findFeeds.addEventListener('click', () => {
        findRSSFeeds();
    });

    elements.addFoundFeed.addEventListener('click', () => {
        addFoundFeed();
    });

    // Refresh feeds
    elements.refreshFeeds.addEventListener('click', () => {
        if (currentProject) loadFeeds();
    });

    // Clear notifications
    if (elements.clearNotifications) {
        elements.clearNotifications.addEventListener('click', () => {
            clearNotificationHistory();
        });
    }

    // Menu events
    window.electronAPI.onMenuNewProject(() => {
        elements.newProjectName.focus();
        // Expand project management section
        const projectSection = document.getElementById('projectManagement');
        if (projectSection.classList.contains('collapsed')) {
            toggleSection('projectManagement');
        }
    });
}

function updateNotificationExtras() {
    const notificationExtras = document.querySelectorAll('.notification-extras');
    notificationExtras.forEach(extra => {
        extra.style.display = settings.enableNotifications ? 'block' : 'none';
    });
    
    if (elements.notificationHistory) {
        elements.notificationHistory.style.display = settings.enableNotifications ? 'block' : 'none';
    }
}

function updateTranslations() {
    const T = translations[currentLanguage] || translations['English'];
    
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (T[key]) {
            // Handle placeholders for input elements
            if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                element.placeholder = T[key];
            } else {
                element.textContent = T[key];
            }
        }
    });

    // Update language-specific info section content
    updateInfoSectionByLanguage();
    
    // Update dynamic content that may have been set by JavaScript
    updateDynamicTranslations(T);
}

function updateDynamicTranslations(T) {
    // Update project select placeholder
    const projectSelect = document.getElementById('projectSelect');
    if (projectSelect && projectSelect.firstElementChild) {
        projectSelect.firstElementChild.textContent = T.select_project + '...';
    }
    
    // Update found feeds select placeholder  
    const foundFeedsSelect = document.getElementById('foundFeedsSelect');
    if (foundFeedsSelect && foundFeedsSelect.firstElementChild) {
        foundFeedsSelect.firstElementChild.textContent = T.select_found_feed;
    }
}

function updateInfoSectionByLanguage() {
    const infoContent = document.querySelector('.info-content');
    if (!infoContent) return;
    
    const T = translations[currentLanguage] || translations['English'];

    const paypalLocale = currentLanguage === 'Deutsch' ? '?country.x=DE&locale.x=de_DE' :
                        currentLanguage === 'Italiano' ? '?country.x=IT&locale.x=it_IT' :
                        '?country.x=US&locale.x=en_US';

    infoContent.innerHTML = `
        <p>${T.project_created_by} <strong>Markus Begerow</strong>.</p>
        <p>${T.contact_via} <a href="#" onclick="window.electronAPI.openExternal('https://linkedin.com/in/markusbegerow')">LinkedIn</a> ${currentLanguage === 'Deutsch' ? 'oder' : currentLanguage === 'Italiano' ? 'o' : 'or'} <a href="#" onclick="window.electronAPI.openExternal('https://github.com/markusbegerow')">GitHub</a>.</p>
        <div class="button-group">
            <button class="btn btn-coffee" onclick="window.electronAPI.openExternal('https://paypal.me/MarkusBegerow${paypalLocale}')">${T.coffee_button}</button>
            <button class="btn btn-linkedin" onclick="window.electronAPI.openExternal('https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/markusbegerow/myfeeddeck')">${T.linkedin_share}</button>
        </div>
    `;
}

function updateProjectSelect() {
    const T = translations[currentLanguage] || translations['English'];
    elements.projectSelect.innerHTML = `<option value="">${T.select_project}...</option>`;
    Object.keys(projects).forEach(projectName => {
        const option = document.createElement('option');
        option.value = projectName;
        option.textContent = projectName;
        elements.projectSelect.appendChild(option);
    });
}

async function createProject() {
    const projectName = elements.newProjectName.value.trim();
    if (!projectName) return;

    if (projects[projectName]) {
        showNotification('Project already exists', 'error');
        return;
    }

    projects[projectName] = [];
    await window.electronAPI.saveJSON('projects.json', projects);
    
    updateProjectSelect();
    elements.projectSelect.value = projectName;
    currentProject = projectName;
    elements.newProjectName.value = '';
    
    updateFeedsList();
    updateMainContent();
    showNotification('Project created successfully', 'success');
}

async function deleteProject() {
    if (!currentProject) return;

    if (confirm(`Are you sure you want to delete project "${currentProject}"?`)) {
        delete projects[currentProject];
        await window.electronAPI.saveJSON('projects.json', projects);
        
        updateProjectSelect();
        currentProject = null;
        elements.projectSelect.value = '';
        
        updateFeedsList();
        updateMainContent();
        showNotification('Project deleted successfully', 'success');
    }
}

async function findRSSFeeds() {
    const websiteUrl = elements.websiteInput.value.trim();
    if (!websiteUrl) return;

    try {
        elements.findFeeds.disabled = true;
        elements.findFeeds.textContent = '🔄 Finding...';
        
        const feeds = await window.electronAPI.findRSSFeeds(websiteUrl);
        
        elements.foundFeedsSelect.innerHTML = '<option value="">Select found feed...</option>';
        feeds.forEach(feed => {
            const option = document.createElement('option');
            option.value = feed.url;
            option.textContent = `${feed.title} – ${feed.url}`;
            elements.foundFeedsSelect.appendChild(option);
        });
        
        if (feeds.length > 0) {
            elements.foundFeedsSection.style.display = 'block';
            showNotification(`Found ${feeds.length} RSS feed(s)`, 'success');
        } else {
            elements.foundFeedsSection.style.display = 'none';
            showNotification('No RSS feeds found', 'error');
        }
        
    } catch (error) {
        console.error('Error finding RSS feeds:', error);
        showNotification('Error finding RSS feeds', 'error');
        elements.foundFeedsSection.style.display = 'none';
    } finally {
        elements.findFeeds.disabled = false;
        elements.findFeeds.textContent = '🔍 Find feeds';
    }
}

async function addFoundFeed() {
    const feedUrl = elements.foundFeedsSelect.value;
    if (!feedUrl || !currentProject) return;

    if (projects[currentProject].includes(feedUrl)) {
        showNotification('Feed already exists in project', 'error');
        return;
    }

    projects[currentProject].push(feedUrl);
    await window.electronAPI.saveJSON('projects.json', projects);
    
    updateFeedsList();
    elements.foundFeedsSection.style.display = 'none';
    elements.websiteInput.value = '';
    elements.foundFeedsSelect.value = '';
    
    showNotification('Feed added successfully', 'success');
    loadFeeds();
}

function updateFeedsList() {
    elements.feedsList.innerHTML = '';
    
    if (!currentProject || !projects[currentProject]) return;

    projects[currentProject].forEach((feedUrl, index) => {
        const feedItem = document.createElement('div');
        feedItem.className = 'feed-item';
        
        feedItem.innerHTML = `
            <a href="#" class="feed-url" title="${feedUrl}" onclick="window.electronAPI.openExternal('${feedUrl}')">${feedUrl}</a>
            <div class="feed-controls">
                <button class="btn btn-secondary" onclick="moveFeedUp(${index})" ${index === 0 ? 'disabled' : ''}>⬆️</button>
                <button class="btn btn-secondary" onclick="moveFeedDown(${index})" ${index === projects[currentProject].length - 1 ? 'disabled' : ''}>⬇️</button>
                <button class="btn btn-danger" onclick="deleteFeed(${index})">❌</button>
            </div>
        `;
        
        elements.feedsList.appendChild(feedItem);
    });
}

async function moveFeedUp(index) {
    if (index === 0 || !currentProject) return;
    
    const feeds = projects[currentProject];
    [feeds[index], feeds[index - 1]] = [feeds[index - 1], feeds[index]];
    
    await window.electronAPI.saveJSON('projects.json', projects);
    updateFeedsList();
}

async function moveFeedDown(index) {
    if (!currentProject) return;
    
    const feeds = projects[currentProject];
    if (index === feeds.length - 1) return;
    
    [feeds[index], feeds[index + 1]] = [feeds[index + 1], feeds[index]];
    
    await window.electronAPI.saveJSON('projects.json', projects);
    updateFeedsList();
}

async function deleteFeed(index) {
    if (!currentProject) return;
    
    if (confirm('Are you sure you want to delete this feed?')) {
        projects[currentProject].splice(index, 1);
        await window.electronAPI.saveJSON('projects.json', projects);
        updateFeedsList();
        loadFeeds();
    }
}

function updateMainContent() {
    const T = translations[currentLanguage] || translations['English'];
    if (currentProject) {
        elements.currentProjectName.textContent = currentProject;
        elements.noProjectMessage.style.display = 'none';
        elements.feedColumns.style.display = 'flex';
    } else {
        elements.currentProjectName.textContent = T.select_project_main;
        elements.noProjectMessage.style.display = 'flex';
        elements.feedColumns.style.display = 'none';
    }
}

async function loadFeeds() {
    if (!currentProject) return;

    elements.loadingSpinner.style.display = 'flex';
    elements.feedColumns.innerHTML = '';

    try {
        const feedUrls = settings.searchAllProjects ? 
            Object.values(projects).flat() : 
            projects[currentProject] || [];

        let newArticleCount = 0;

        for (const feedUrl of feedUrls) {
            try {
                const entries = await window.electronAPI.parseFeed(feedUrl);
                const feedColumn = await createFeedColumn(feedUrl, entries);
                
                // Count new articles
                const lastSeen = seenStatus[feedUrl] || '1970-01-01T00:00:00';
                const lastSeenDate = new Date(lastSeen);
                
                entries.slice(0, settings.numItems).forEach(entry => {
                    const pubDate = new Date(entry.pubDate || entry.date || '1970-01-01T00:00:00');
                    if (pubDate > lastSeenDate) {
                        newArticleCount++;
                    }
                });

                elements.feedColumns.appendChild(feedColumn);
            } catch (error) {
                console.error(`Error loading feed ${feedUrl}:`, error);
                const errorColumn = createErrorColumn(feedUrl, error.message);
                elements.feedColumns.appendChild(errorColumn);
            }
        }

        // Update seen status
        for (const feedUrl of feedUrls) {
            seenStatus[feedUrl] = new Date().toISOString();
        }
        await window.electronAPI.saveJSON('seen.json', seenStatus);

        // Update new articles badge
        if (newArticleCount > 0) {
            elements.newArticlesBadge.textContent = `${newArticleCount} new`;
            elements.newArticlesBadge.style.display = 'block';
        } else {
            elements.newArticlesBadge.style.display = 'none';
        }

    } catch (error) {
        console.error('Error loading feeds:', error);
        showNotification('Error loading feeds', 'error');
    } finally {
        elements.loadingSpinner.style.display = 'none';
    }
}

async function createFeedColumn(feedUrl, entries) {
    const column = document.createElement('div');
    column.className = 'feed-column';

    // Get feed title from first entry
    const feedTitle = entries.length > 0 ? 
        (entries[0].meta?.title || entries[0].feed?.title || 'Unknown Feed') : 
        'Empty Feed';

    column.innerHTML = `
        <h2>${feedTitle}</h2>
        <div class="feed-items"></div>
    `;

    const feedItems = column.querySelector('.feed-items');
    const lastSeen = seenStatus[feedUrl] || '1970-01-01T00:00:00';
    const lastSeenDate = new Date(lastSeen);

    for (const entry of entries.slice(0, settings.numItems)) {
        if (settings.searchTerm && !entry.title.toLowerCase().includes(settings.searchTerm)) {
            continue;
        }

        const pubDate = new Date(entry.pubDate || entry.date || '1970-01-01T00:00:00');
        const isNew = pubDate > lastSeenDate;
        const uniqueId = `${feedUrl}_${entry.link}_${entry.title}`.replace(/[^a-zA-Z0-9]/g, '_');

        // Fetch additional data
        const imageUrl = await window.electronAPI.fetchOGImage(entry.link);
        const rawDescription = await window.electronAPI.fetchOGDescription(entry.link);
        const description = rawDescription && rawDescription.length > 150 ? 
            rawDescription.substring(0, 150) + '...' : 
            rawDescription;

        const feedItem = document.createElement('div');
        feedItem.className = `feed-card${isNew ? ' new-article' : ''}`;
        
        feedItem.innerHTML = `
            ${isNew ? '<div class="new-badge">🆕 NEW</div>' : ''}
            ${imageUrl ? `<a href="#" onclick="window.electronAPI.openExternal('${entry.link}')"><img src="${imageUrl}" alt="Article image" class="feed-image" onerror="this.style.display='none'"></a>` : ''}
            <h4><a href="#" onclick="window.electronAPI.openExternal('${entry.link}')">${entry.title}</a></h4>
            <div class="feed-description">${description || (entry.summary && entry.summary.length > 150 ? entry.summary.substring(0, 150) + '...' : entry.summary) || ''}</div>
            <div class="feed-date">${pubDate.toLocaleString()}</div>
            <div class="feed-actions">
                <button class="btn btn-primary" onclick="markAsRead('${uniqueId}', '${entry.link}', '${entry.title.replace(/'/g, "\\'")}', this)">✓ Read</button>
                <button class="btn btn-secondary" onclick="sendToWebhook('${entry.link}', '${entry.title.replace(/'/g, "\\'")}', this)" ${!settings.webhookUrl ? 'disabled title="Configure webhook URL in settings first"' : ''}>🔁 n8n Send</button>
            </div>
        `;

        // Send notification for new articles
        if (isNew && settings.enableNotifications) {
            const notificationTitle = `📰 New Article: ${feedTitle}`;
            const notificationMessage = entry.title.length > 100 ? entry.title.substring(0, 100) + '...' : entry.title;
            
            // Add to notification history
            addToNotificationHistory(notificationTitle, notificationMessage, entry.link, imageUrl);
            
            if (settings.showDesktopNotifications) {
                await window.electronAPI.sendNotification(
                    notificationTitle,
                    notificationMessage,
                    entry.link,
                    settings.showImages ? imageUrl : null
                );
            }
        }

        feedItems.appendChild(feedItem);
    }

    return column;
}

function createErrorColumn(feedUrl, errorMessage) {
    const column = document.createElement('div');
    column.className = 'feed-column';
    
    column.innerHTML = `
        <h2>Error Loading Feed</h2>
        <div class="feed-items">
            <div class="feed-card" style="background-color: #441111;">
                <h4>Failed to load: ${feedUrl}</h4>
                <div class="feed-description">${errorMessage}</div>
            </div>
        </div>
    `;
    
    return column;
}

async function markAsRead(uniqueId, link, title, buttonElement) {
    readStatus[uniqueId] = true;
    await window.electronAPI.saveJSON('read.json', readStatus);
    
    buttonElement.disabled = true;
    buttonElement.textContent = '✓ Read';
    buttonElement.style.opacity = '0.5';
    
    showNotification('Article marked as read', 'success');
}

async function sendToWebhook(link, title, buttonElement) {
    // Get current webhook URL from input field
    const webhookUrl = elements.webhookUrl ? elements.webhookUrl.value.trim() : '';
    
    if (!webhookUrl) {
        showNotification('Please configure webhook URL in settings first', 'error');
        return;
    }

    try {
        // Disable button during sending
        if (buttonElement) {
            buttonElement.disabled = true;
            buttonElement.textContent = '🔄 Sending...';
        }

        const payload = {
            project: currentProject,
            title: title,
            link: link,
            timestamp: new Date().toISOString()
        };

        // Send to webhook via main process
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showNotification('✅ Article sent to n8n successfully', 'success');
            if (buttonElement) {
                buttonElement.textContent = '✅ Sent';
                buttonElement.style.opacity = '0.7';
                setTimeout(() => {
                    buttonElement.textContent = '🔁 n8n Send';
                    buttonElement.style.opacity = '1';
                    buttonElement.disabled = false;
                }, 2000);
            }
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error sending to webhook:', error);
        showNotification(`❌ Webhook error: ${error.message}`, 'error');
        if (buttonElement) {
            buttonElement.textContent = '❌ Failed';
            buttonElement.style.opacity = '0.7';
            setTimeout(() => {
                buttonElement.textContent = '🔁 n8n Send';
                buttonElement.style.opacity = '1';
                buttonElement.disabled = false;
            }, 3000);
        }
    }
}

function testNotification() {
    if (settings.enableNotifications) {
        const testImage = settings.showImages ? "https://via.placeholder.com/200x150/4CAF50/FFFFFF?text=MyFeedDeck" : null;
        
        // Add to notification history
        addToNotificationHistory(
            'MyFeedDeck Test',
            'Notification system is working! You\'ll receive notifications for new articles.',
            'https://github.com/markusbegerow/myfeeddeck',
            testImage
        );
        
        if (settings.showDesktopNotifications) {
            window.electronAPI.sendNotification(
                'MyFeedDeck Test',
                'Notification system is working! You\'ll receive notifications for new articles.',
                'https://github.com/markusbegerow/myfeeddeck',
                testImage
            );
        }
        
        showNotification('Test notification sent!', 'success');
    } else {
        showNotification('Please enable notifications first', 'error');
    }
}

function addToNotificationHistory(title, message, link, imageUrl) {
    const notification = {
        title: title,
        message: message,
        link: link,
        imageUrl: imageUrl,
        timestamp: new Date()
    };
    
    notificationHistory.unshift(notification);
    
    // Keep only last 20 notifications
    if (notificationHistory.length > 20) {
        notificationHistory = notificationHistory.slice(0, 20);
    }
    
    updateNotificationHistoryDisplay();
}

function updateNotificationHistoryDisplay() {
    if (!elements.notificationList) return;
    
    elements.notificationList.innerHTML = '';
    
    if (notificationHistory.length === 0) {
        elements.notificationHistory.style.display = 'none';
        return;
    }
    
    elements.notificationHistory.style.display = 'block';
    elements.clearNotifications.style.display = 'block';
    
    // Show last 5 notifications
    notificationHistory.slice(0, 5).forEach((notif, index) => {
        const notifElement = document.createElement('div');
        notifElement.className = 'notification-item';
        
        notifElement.innerHTML = `
            <h5>${notif.title}</h5>
            <p>${notif.message}</p>
            ${notif.link ? `<a href="#" onclick="window.electronAPI.openExternal('${notif.link}')" style="color: #4a9eff; text-decoration: none; font-size: 0.8rem;">🔗 Read Article</a>` : ''}
            <div class="notification-time">📅 ${notif.timestamp.toLocaleString()}</div>
        `;
        
        elements.notificationList.appendChild(notifElement);
    });
}

function clearNotificationHistory() {
    notificationHistory = [];
    updateNotificationHistoryDisplay();
    showNotification('Notification history cleared', 'success');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    elements.notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function setupAutoRefresh() {
    // Clear existing interval
    if (window.refreshInterval) {
        clearInterval(window.refreshInterval);
    }
    
    // Set new interval if needed
    if (settings.refreshInterval > 0) {
        window.refreshInterval = setInterval(() => {
            if (currentProject) loadFeeds();
        }, settings.refreshInterval * 1000);
    }
}

async function updateUI() {
    updateTranslations();
    updateProjectSelect();
    updateMainContent();
    updateNotificationExtras();
}

// Make functions global for onclick handlers
window.moveFeedUp = moveFeedUp;
window.moveFeedDown = moveFeedDown;
window.deleteFeed = deleteFeed;
window.markAsRead = markAsRead;
window.sendToWebhook = sendToWebhook;