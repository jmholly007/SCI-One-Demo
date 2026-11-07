# SCI One 1.0 — Library First Demo

Portable React prototype with illustrative supply-chain tools and sample data. No enterprise data services are connected.

## Run locally

Install an organization-approved Node.js version (22 or newer recommended), then run:

```sh
npm ci
npm run build
node demo-server.mjs
```

Open http://127.0.0.1:4173. Keep the terminal running; press Ctrl+C to stop the server. Dependency installation requires access to your approved npm registry.

For live development instead, run `npm run dev` and open the local address Vite prints.

## Demo walkthrough

- Search for Honeywell on Home; open the supplier profile or tool results.
- Explore the Supplier capability menus and Supplier Intelligence library.
- Combine Tool Type, Availability, and Business Area filters.
- Open tool details and sample documentation.
- Favorite tools and visit My Favorites.
- Launch Tool Example 5 to open a separate sample dashboard tab; allow the popup if prompted.

Favorites and preferences are stored in that browser's local storage.

## Project files

- `src.jsx`: React screens, sample tools, capabilities, navigation, launch behavior.
- `style.css`: styling and wave background.
- `index.html`: app entry point.
- `package.json` and `package-lock.json`: dependencies and reproducible installation.
- `demo-server.mjs`: local-only static server for the built app.

All records are illustrative. No real supplier data, enterprise applications, authentication, Databricks connections, or AI services are connected. This repository contains source only; generate `dist/` with `npm run build`.