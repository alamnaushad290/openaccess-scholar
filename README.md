# OpenAccess Scholar 🎓

> A responsive, modern web app displaying free (no-APC / zero publication fee) journals and conferences indexed in Scopus, Web of Science (WoS), SCI, and SCIE with an automated weekly data pipeline.

---

## ✨ Features

- **🔍 Smart Abstract Matcher (NLP/TF-IDF):** Paste a paper abstract to find matching journals ranked by relevance score (Match %).
- **🏷️ Multi-Faceted Filters:** Filter by Indexing Body (Scopus, WoS, SCI, SCIE), Venue Type (Journal vs Conference), Domain, and Quartile (Q1–Q4).
- **⚡ Fast Live Search:** Real-time search across titles, publishers, domains, and ISSNs.
- **📖 Comprehensive Detail Modal:** Quartile badges, impact factors, aims & scope, publication models, and direct external homepage links.
- **⏰ Automated Weekly Pipeline:** A scheduled GitHub Actions workflow fetches fresh DOAJ open access data, merges with 60+ top-tier zero-APC venues (IEEE, ACM, Nature family, SCOAP3), and automatically commits updates every Sunday at midnight UTC.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Data Pipeline:** Node.js, DOAJ API, Crossref API
- **Automation:** GitHub Actions (Weekly Cron schedule)
- **Deployment Ready:** Vercel / GitHub Pages

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

### 3. Fetch Latest Journals Manually
```bash
npm run fetch-journals
```

---

## ⚙️ Automated Weekly Workflow

The GitHub Actions workflow runs every Sunday at midnight (`cron: '0 0 * * 0'`):
1. Runs `scripts/fetch-journals.mjs`
2. Fetches 200+ DOAJ open access journals
3. Merges top-tier venues (JMLR, TPAMI, NeurIPS, ICML, CVPR, SCOAP3 physics, etc.)
4. Normalizes quartile and indexing fields
5. Commits and pushes changes directly to `public/data.json`

> **Note:** To enable auto-commit, make sure to enable **Read and write permissions** under **Settings > Actions > General > Workflow permissions** in your GitHub repository.
