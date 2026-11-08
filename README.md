# SCI One 1.0 — Library First Demo

Interactive proof of concept with illustrative supply-chain tools and sample data. No enterprise data services are connected.

## Easiest way to run — no installations

1. Open [plain-html/SCI-One-Standalone.html](plain-html/SCI-One-Standalone.html).
2. Use GitHub's **Download raw file** button to save the HTML file.
3. Double-click the downloaded file and open it in Edge or Chrome.

This version contains its own HTML, CSS, JavaScript, and inline SVG icons. No Node.js, npm, React, server, internet connection, package installation, or access token is required to run it. Company browser and file handling settings still apply.

Editable plain HTML/CSS/JavaScript files are in [plain-html](plain-html). Keep `index.html`, `style.css`, and `app.js` together and open `index.html`. See the [plain version README](plain-html/README.md).

## Original React source

The original React source is at the repository root. For that version, install an organization-approved Node.js version and run:

```sh
npm ci
npm run build
node demo-server.mjs
```

Open http://127.0.0.1:4173. Keep the terminal running; Ctrl+C stops it. For live development, use `npm run dev`. Dependency installation for the React version requires access to your approved npm registry.

## Demo walkthrough

- Search for Honeywell, BAE Systems, L3Harris, Raytheon, or Boeing.
- Explore the Supplier capability menus and Supplier Intelligence library.
- Filter tools by type, availability, and business area.
- Open tool information and sample documentation.
- Save tools to Favorites.
- Launch a separate sample dashboard and change its filters.

All records and metrics are illustrative. Neither version includes production authentication, live enterprise data, Databricks connections, or AI services.
