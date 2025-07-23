# MyFeedDeck - Your Visual RSS/Atom/XML-Dashboard

Welcome to MyFeedDeck - a modern, Streamlit-based app for managing, reading, and filtering RSS/Atom/XML-feeds in a visually appealing deck view. Organize your feeds into projects, stay up to date with notifications, and integrate your automations with n8n!

## 🚀 Features

| Feature                            | Description                                                      |
| ---------------------------------- | ---------------------------------------------------------------- |
| 🧩 **Project Management**          | Create as many projects as you like, each with its own RSS feeds |
| 📰 **Feed Deck View**              | Displays articles in columns – inspired by TweetDeck             |
| 🌍 **Language Switch (EN/DE)**     | Toggle between English and German via dropdown                   |
| 💡 **Meta Info & Preview**         | Shows title, meta description, and OG image of each article      |
| ✅ **Read/Unread Status**           | Mark articles as read – persistently stored                      |
| 🔍 **Filter Function**             | Search within a project by title or keyword                      |
| 🌙 **Dark Mode (Streamlit Night)** | Optional dark mode for comfortable reading                       |
| 🔔 **New Article Notifications**   | Visual indicators + optional webhook (e.g. email/Telegram)       |
| 🔁 **n8n Integration**             | Send articles to any n8n workflow via button                     |
| ☕ **Info & Support**               | Built-in info section with contact, GitHub, and donation link    |

## 📷 Screenshots

| Sample A | Sample B |
|-----------------------|----------------------|
| ![datenbanken_news](https://github.com/user-attachments/assets/f88fcf25-89d0-4cad-b4c3-63b81d73e179) | ![ai_data_sciences_news](https://github.com/user-attachments/assets/7d1110ee-53ea-4eb2-aefc-786990668e7c) |

## ▶️ Live in action

![db2](https://github.com/user-attachments/assets/7e36fe82-1e87-4a9e-a5d2-ef10719a2707)

## 🛠️ Installation

```bash
git clone https://github.com/markusbegerow/myfeeddeck.git
cd myfeeddeck
pip install -r requirements.txt
streamlit run myfeeddeck.py
```

## 🔗 n8n-Integration

MyFeedDeck supports directly sending individual articles to n8n webhooks (e.g., for Telegram, email, Airtable):

```json
POST https://n8n.example.com/webhook/myfeeddeck-article
{
  "project": "AI News",
  "title": "GPT-5 announced",
  "url": "https://example.com/article",
  "timestamp": "2025-07-22T15:42:00Z"
}
```

Webhooks are triggered by clicking the 🔁 button on each article.

## ☁️ Upcoming Features (Roadmap)

- 🧠 AI summaries with OpenAI / Ollama
- 📨 Email-to-Feed (IMAP parsing)
- 🔐 Optional login functionality
- 📲 Mobile responsive view

## 🙋‍♂️ Get Involved

Pull requests and feature ideas are welcome! You can:

- contribute new language files
- suggest your own feed templates or themes
- propose UI improvements

## ☕ Support the Project

If you like MyFeedDeck, support further development with a repost or coffee:

<a href="https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/MarkusBegerow/myfeeddeck" target="_blank"> <img src="https://img.shields.io/badge/💼-Share%20on%20LinkedIn-blue" /> </a>

[![Buy Me a Coffee](https://img.shields.io/badge/☕-Buy%20me%20a%20coffee-yellow)](https://paypal.me/MarkusBegerow?country.x=DE&locale.x=de_DE)

## 📬 Contact

- 🧑‍💻 [Markus Begerow](https://linkedin.com/in/markusbegerow)
- 💾 [GitHub](https://github.com/markusbegerow)
- ✉️ [Twitter](https://x.com/markusbegerow)
