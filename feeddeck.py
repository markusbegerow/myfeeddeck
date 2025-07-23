import streamlit as st
import feedparser
import json
import os
import time
import requests
from datetime import datetime
from bs4 import BeautifulSoup

st.set_page_config(layout="wide")
st.sidebar.title = "Language"


if "lang" not in st.session_state:
    st.session_state.lang = "English"

st.sidebar.header("ℹ️ Info") 
with st.sidebar.expander("Info", expanded=False):
    if st.session_state.lang == "Deutsch":
        st.markdown("""
        👋 Dieses Projekt wurde erstellt von **Markus Begerow**.  
        📫 Kontakt auf [LinkedIn](https://linkedin.com/in/markusbegerow) oder [GitHub](https://github.com/markusbegerow).  
        """, unsafe_allow_html=True)
        st.markdown("""
        <div style="display: flex; gap: 10px; margin-top: 10px;">
            <a href="https://paypal.me/MarkusBegerow?country.x=DE&locale.x=de_DE" target="_blank">
                <button style="background-color:#FFD700; border:none; color:black; padding:10px 15px; 
                               border-radius:8px; font-weight:bold; cursor:pointer;">
                    ☕ Kaffee spendieren
                </button>
            </a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/MarkusBegerow/feeddeck" target="_blank">
                <button style="background-color:#0A66C2; border:none; color:white; padding:10px 15px; 
                               border-radius:8px; font-weight:bold; cursor:pointer;">
                    💬 Auf LinkedIn teilen
                </button>
            </a>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        👋 This project was created by **Markus Begerow**.  
        📫 Contact via [LinkedIn](https://linkedin.com/in/markusbegerow) or [GitHub](https://github.com/markusbegerow).  
        """, unsafe_allow_html=True)
        st.markdown("""
        <div style="display: flex; gap: 10px; margin-top: 10px;">
            <a href="https://paypal.me/MarkusBegerow?country.x=US&locale.x=en_US" target="_blank">
                <button style="background-color:#FFD700; border:none; color:black; padding:10px 15px; 
                               border-radius:8px; font-weight:bold; cursor:pointer;">
                    ☕ Buy me a coffee
                </button>
            </a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/MarkusBegerow/feeddeck" target="_blank">
                <button style="background-color:#0A66C2; border:none; color:white; padding:10px 15px; 
                               border-radius:8px; font-weight:bold; cursor:pointer;">
                    💬 Share on LinkedIn
                </button>
            </a>
        </div>
        """, unsafe_allow_html=True)
st.sidebar.markdown("---")

st.sidebar.header("Language / Sprache") 
selected_lang = st.sidebar.selectbox(
    
    "Language / Sprache", ["English", "Deutsch"],
    index=0 if st.session_state.lang == "English" else 1,
    key="language_selector"
)
st.session_state.lang = selected_lang 


T = {
    "Deutsch": {
        "language": "Deutsch",
        "projects": "📁 Projekte",
        "select_project": "Projekt auswählen",
        "new_project": "Neues Projekt anlegen",
        "create_project": "Projekt erstellen",
        "delete_project": "🗑 Projekt löschen",
        "add_feed": "📥 Feed-URL zu Projekt hinzufügen",
        "new_url": "Neue RSS-Feed-URL",
        "add": "Feed hinzufügen",
        "feeds": "📋 Bestehende Feeds",
        "delete": "❌",
        "project_title": "📰 FeedDeck Projekt",
        "items": "📄 Artikel pro Feed",
        "filter": "🔍 Filter",
        "refresh": "🔄 Auto-Refresh (Sekunden)",
        "no_new": "Keine neuen Artikel",
        "new": "🆕 NEU",
        "read": "✓ Gelesen",
        "feed_error": "Feed-Fehler",
        "skip": "Beitrag übersprungen",
        "settings": "⚙️ Einstellungen",
        "n8n_webhook": "🔁 n8n Webhook (optional)",
        "n8n_send": "🔁 An n8n senden"
    },
    "English": {
        "language": "English",
        "projects": "📁 Projects",
        "select_project": "Select project",
        "new_project": "Create new project",
        "create_project": "Create project",
        "delete_project": "🗑 Delete project",
        "add_feed": "📥 Add RSS feed to project",
        "new_url": "New RSS feed URL",
        "add": "Add feed",
        "feeds": "📋 Existing feeds",
        "delete": "❌",
        "project_title": "📰 FeedDeck Project",
        "items": "📄 Articles per feed",
        "filter": "🔍 Filter",
        "refresh": "🔄 Auto-refresh (seconds)",
        "no_new": "No new articles",
        "new": "🆕 NEW",
        "read": "✓ Read",
        "feed_error": "Feed error",
        "skip": "Skipped article",
        "settings": "⚙️ Settings",
        "n8n_webhook": "🔁 n8n Webhook (optional)",
        "n8n_send": "🔁 Send to n8n"
    }
}[selected_lang]

PROJECTS_FILE = "projects.json"
READ_FILE = "read.json"
LOG_FILE = "read_log.json"
SEEN_FILE = "seen.json"

def load_json(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def fetch_og_image(link):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(link, headers=headers, timeout=5)
        if r.status_code != 200:
            return None
        soup = BeautifulSoup(r.text, "html.parser")
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            return og["content"]
        tw = soup.find("meta", attrs={"name": "twitter:image"})
        if tw and tw.get("content"):
            return tw["content"]
        img = soup.find("img")
        if img and img.get("src"):
            return img["src"]
    except:
        return None
    return None

def fetch_og_description(link):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(link, headers=headers, timeout=5)
        if r.status_code != 200:
            return None
        soup = BeautifulSoup(r.text, "html.parser")
        desc = soup.find("meta", property="og:description") or soup.find("meta", attrs={"name": "description"})
        if desc and desc.get("content"):
            return desc["content"]
    except:
        return None
    return None


projects = load_json(PROJECTS_FILE)
read_status = load_json(READ_FILE)
read_log = load_json(LOG_FILE)
seen = load_json(SEEN_FILE)


with open("styles.css", "r") as css_file:
    st.markdown(f"<style>{css_file.read()}</style>", unsafe_allow_html=True)
    
st.sidebar.markdown("---")
st.sidebar.header(T["projects"])
project_names = list(projects.keys())
selected_project = st.sidebar.selectbox(T["select_project"], project_names)


new_proj_name = st.sidebar.text_input(T["new_project"])
if st.sidebar.button(T["create_project"]) and new_proj_name:
    if new_proj_name not in projects:
        projects[new_proj_name] = []
        save_json(PROJECTS_FILE, projects)
        st.rerun()

if selected_project:
    if st.sidebar.button(T["delete_project"]):
        del projects[selected_project]
        save_json(PROJECTS_FILE, projects)
        st.rerun()

st.sidebar.markdown("---")
st.sidebar.header(T["add_feed"])
new_url = st.sidebar.text_input(T["new_url"])
if st.sidebar.button(T["add"]) and new_url and selected_project:
    if new_url not in projects[selected_project]:
        projects[selected_project].append(new_url)
        save_json(PROJECTS_FILE, projects)
        st.rerun()

if selected_project:
    st.sidebar.subheader(T["feeds"])
    for url in projects[selected_project]:
        col1, col2 = st.sidebar.columns([4, 1])
        col1.write(url)
        if col2.button(T["delete"], key=f"delete_{url}"):
            projects[selected_project].remove(url)
            save_json(PROJECTS_FILE, projects)
            st.rerun()

st.sidebar.markdown("---")
st.sidebar.header(T["n8n_webhook"])
new_feed_webhook = st.sidebar.text_input("n8n-Server", key="new_feed_webhook")

st.title(f"{T['project_title']}: {selected_project}")
st.sidebar.markdown("---")
st.sidebar.header(T["settings"]) 
num_items = st.sidebar.slider(T["items"], 3, 20, 5)
search_term = st.sidebar.text_input(T["filter"])
refresh_interval = st.sidebar.number_input(T["refresh"], min_value=0, max_value=3600, value=0)

if refresh_interval > 0:
    time.sleep(refresh_interval)
    st.rerun()

feed_urls = projects.get(selected_project, [])
cols = st.columns(len(feed_urls)) if feed_urls else []
new_article_counter = 0


for idx, feed_url in enumerate(feed_urls):
    with cols[idx]:
        try:
            parsed = feedparser.parse(feed_url)
            st.subheader(parsed.feed.get("title", "No Title"))

            last_seen = seen.get(feed_url, "1970-01-01T00:00:00")
            last_seen_dt = datetime.fromisoformat(last_seen.replace("Z", ""))
            newest_time = last_seen_dt

            for entry_idx, entry in enumerate(parsed.entries[:num_items]):
                try:
                    title = entry.title
                    link = entry.link
                    pub = entry.get("published", "1970-01-01T00:00:00")
                    pub_dt = datetime(*entry.published_parsed[:6])
                    unique_id = f"{idx}_{entry_idx}_{hash(link)}"

                    if pub_dt > last_seen_dt:
                        is_new = True
                        new_article_counter += 1
                    else:
                        is_new = False

                    if pub_dt > newest_time:
                        newest_time = pub_dt

                    if search_term.lower() not in title.lower():
                        continue

                    is_read = read_status.get(unique_id, False)

                    img_url = fetch_og_image(link)
                    description = fetch_og_description(link)

               
                    html_block = f"""
                    <div class='feed-card'>
                        <span class="new-badge">{T['new'] if is_new else ''}</span>
                        <a href="{link}" target="_blank"><img src="{img_url}" class="feed-image" /></a>
                        <a href="{link}" target="_blank"><h4>{title}</h4></a>
                        <p>{description or ''}</p>
                        <p style="font-size: 0.85em; color: #888;">{pub}</p>
                    </div>
                    """

                    with st.container():
                        st.markdown(html_block, unsafe_allow_html=True)

                        col1, col2 = st.columns([1, 1])
                        with col1:
                            if st.button(T["read"], key=f"gelesen_{unique_id}"):
                                read_status[unique_id] = True
                                save_json(READ_FILE, read_status)

                                log_entry = {
                                    "project": selected_project,
                                    "feed_url": feed_url,
                                    "title": title,
                                    "link": link,
                                    "read_at": datetime.utcnow().isoformat() + "Z"
                                }
                                read_log[unique_id] = log_entry
                                save_json(LOG_FILE, read_log)

                                st.rerun()

                        with col2:
                            if st.button(T["n8n_send"], key=f"n8n_send_{unique_id}"):
                                payload = {
                                    "project": selected_project,
                                    "feed_url": feed_url,
                                    "title": title,
                                    "link": link,
                                    "timestamp": datetime.utcnow().isoformat() + "Z"
                                }
                                try:
                                    r = requests.post(new_feed_webhook, json=payload)
                                    if r.status_code == 200:
                                        st.success("✅ Artikel wurde an n8n gesendet.")
                                    else:
                                        st.error(f"❌ Fehler beim Senden ({r.status_code})")
                                except Exception as e:
                                    st.error(f"⚠️ Fehler beim Verbindungsaufbau: {e}")

                        st.markdown("---")

                except Exception as e:
                    st.warning(f"{T['skip']}: {e}")
                    continue

            seen[feed_url] = newest_time.isoformat()
            save_json(SEEN_FILE, seen)
        except Exception as e:
            st.error(f"{T['feed_error']}: {e}")

if new_article_counter > 0:
    st.sidebar.markdown(f"🔔 **{new_article_counter} {T['new']}**")
else:
    st.sidebar.caption(T["no_new"])

