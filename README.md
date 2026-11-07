# SCI One 1.0 — Library First Demo

Portable React prototype, exported November 6, 2026. Includes the source and a ready-built demo. All tool records, supplier values, dashboard data, and documentation are sample content. No enterprise data services are connected.

## Fastest way to demo (no package download)

1. Extract the ZIP fully.
2. Install an organization-approved Node.js version (22 or newer recommended).
3. Open the SCI-One-Demo folder in VS Code.
4. Open Terminal → New Terminal and run:

```sh
node demo-server.mjs
```

5. Open http://127.0.0.1:4173 in your browser. Keep the terminal running; Ctrl+C stops it.

This uses the included dist folder and Node's built-in HTTP server. It requires no npm install or internet connection. Do not double-click dist/index.html: serve it with the command above.

## Edit the React app

In the same folder, run:

```sh
npm ci
npm run dev
```

Open the local address printed in the terminal. Dependency installation requires access to your approved npm registry. If needed, ask your IT team for the registry/proxy configuration.

After editing, regenerate the packaged demo:

```sh
npm run build
node demo-server.mjs
```

## Demo walkthrough

- Search for Honeywell on Home; open the supplier profile or tool results.
- Explore the Supplier capability menus and Supplier Intelligence library.
- Combine Tool Type, Availability, and Business Area filters.
- Open tool details and sample documentation.
- Favorite tools and visit My Favorites.
- Launch Tool Example 5 to open a separate sample dashboard tab; allow the popup if prompted.

Favorites and preferences are stored only in that browser's local storage. Clear them using browser site-data controls for a fresh demonstration.

## Files and future handoff

- src.jsx: React screens, sample tools, capabilities, navigation, launch behavior.
- style.css: styling and wave background; no remotely loaded fonts or images.
- index.html: entry page.
- package.json / package-lock.json: dependencies and reproducible install.
- dist/: compiled app for immediate demos; rebuild after source changes.
- demo-server.mjs: local-only, dependency-free demo server.

This export has no hosted-site login, sharing allowlist, credentials, Git history, node_modules, or external hosting configuration. It runs independently of the external website. The local server listens on this computer only.

For GitLab, create an empty approved repository and commit the source folder with its included .gitignore. dist is excluded because it is generated with npm run build. No GitLab destination or credentials are preconfigured. Internal authentication, deployment, and real tool connections would be separate implementation work.
