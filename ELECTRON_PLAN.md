# Electron App Conversion Plan

## PC Prebuild Spec Card Generator — Standalone Desktop Application

---

## 1. Current State Assessment

### What We Have
- **Framework**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand 5 with Immer
- **PDF Generation**: jsPDF (client-side)
- **Codes**: jsbarcode + qrcode
- **Storage**: localStorage via custom adapter with versioning/migration
- **Features**: Google Sheets import, EmailJS integration, brand icon manager, preset system, print queue, PDF export (shelf tag / price card / poster sizes)
- **PWA**: vite-plugin-pwa with workbox caching
- **Deployment**: Docker + nginx (web)
- **Tests**: Vitest + React Testing Library (comprehensive suite)

### What Needs to Change for Electron
| Area | Current (Web) | Target (Electron) |
|------|--------------|-------------------|
| Storage | localStorage | electron-store (JSON files on disk) |
| PDF Save | Browser download dialog | Native OS file save dialog |
| Printing | Browser print | Native OS print / direct printer |
| Email | EmailJS (browser script injection) | nodemailer (Node.js native SMTP) |
| File Access | No direct access | Full filesystem via Node.js |
| Google Sheets | Browser fetch (CORS limitations) | Node.js fetch (no CORS) |
| Updates | Manual re-deploy | Auto-updater (electron-updater) |
| Distribution | URL | .exe (Win), .dmg (Mac), .AppImage (Linux) |

---

## 2. Architecture Overview

```
prebuild-card-generator/
├── electron/                    # NEW — Electron main process
│   ├── main.ts                  # Main process entry point
│   ├── preload.ts               # Preload script (context bridge)
│   ├── ipc/                     # IPC handler modules
│   │   ├── fileHandlers.ts      # File save/open dialogs
│   │   ├── printHandlers.ts     # Native print integration
│   │   ├── storeHandlers.ts     # electron-store CRUD
│   │   ├── emailHandlers.ts     # nodemailer email sending
│   │   └── updateHandlers.ts    # Auto-update management
│   ├── menu.ts                  # Native application menu
│   ├── tray.ts                  # System tray (optional)
│   └── updater.ts               # Auto-update logic
├── src/                         # EXISTING — Renderer process (React app)
│   ├── lib/storage/
│   │   ├── localStorage.ts      # Keep as fallback
│   │   ├── electronStore.ts     # NEW — electron-store adapter
│   │   └── index.ts             # Updated — auto-detect environment
│   ├── utils/
│   │   ├── emailService.ts      # Updated — dual mode (web/electron)
│   │   └── nativePrint.ts       # NEW — Electron print bridge
│   └── ... (existing components unchanged)
├── resources/                   # NEW — Build resources
│   ├── icon.ico                 # Windows icon
│   ├── icon.icns                # macOS icon
│   ├── icon.png                 # Linux icon (512x512)
│   └── installer/               # NSIS/DMG customization
├── electron-builder.yml         # NEW — electron-builder config
├── vite.config.ts               # Updated — electron-vite integration
├── package.json                 # Updated — electron scripts & deps
└── forge.config.ts              # ALTERNATIVE — if using Electron Forge
```

---

## 3. Implementation Phases

### Phase 1: Project Scaffolding & Electron Shell
**Goal**: Get the existing React app running inside an Electron window.

**Tasks**:
1. Install Electron and build tooling dependencies
   ```
   electron
   electron-builder          (for packaging)
   electron-vite   OR   vite-plugin-electron + vite-plugin-electron-renderer
   concurrently              (dev script orchestration)
   ```

2. Create `electron/main.ts` — Main process
   - Create BrowserWindow with sensible defaults (1280x900, minWidth/minHeight)
   - Load Vite dev server URL in development, `file://` index.html in production
   - Set Content Security Policy headers
   - Handle window close / app quit lifecycle (especially macOS dock behavior)

3. Create `electron/preload.ts` — Context bridge
   - Expose safe IPC channels via `contextBridge.exposeInMainWorld`
   - Define the `window.electronAPI` interface
   - Keep the renderer sandboxed (no direct Node.js access)

4. Update `vite.config.ts`
   - Add electron-vite plugin or configure for electron renderer
   - Adjust build output directory to `dist/` for electron-builder
   - Remove PWA plugin when building for Electron (feature-flag it)

5. Update `package.json`
   - Add `"main": "dist-electron/main.js"`
   - Add scripts: `electron:dev`, `electron:build`, `electron:preview`
   - Keep existing web scripts untouched (dual-target build)

6. Update `index.html`
   - Add CSP meta tag appropriate for Electron
   - Conditionally handle base path differences

**Outcome**: App opens in an Electron window with full existing functionality.

---

### Phase 2: Native Storage Layer
**Goal**: Replace localStorage with persistent file-based storage.

**Tasks**:
1. Install `electron-store` (or build custom JSON store)
   - Stores data as JSON files in the OS app data directory
   - Windows: `%APPDATA%/PC Prebuild Spec Card Generator/`
   - macOS: `~/Library/Application Support/PC Prebuild Spec Card Generator/`
   - Linux: `~/.config/PC Prebuild Spec Card Generator/`

2. Create `electron/ipc/storeHandlers.ts`
   - `store:get(key)` — Read from electron-store
   - `store:set(key, value)` — Write to electron-store
   - `store:delete(key)` — Remove key
   - `store:has(key)` — Check existence
   - `store:getAll()` — Export all data
   - `store:importData(data)` — Import/restore from backup

3. Create `src/lib/storage/electronStore.ts`
   - Implements the existing `StorageAdapter` interface
   - Uses `window.electronAPI.store.*` IPC calls
   - Drop-in replacement — no component changes needed

4. Update `src/lib/storage/index.ts`
   - Auto-detect: use electronStore in Electron, localStorage in web
   ```ts
   export const storage = window.electronAPI
     ? new ElectronStoreAdapter()
     : new LocalStorageAdapter();
   ```

5. Data migration utility
   - On first Electron launch, offer to import from browser localStorage (if accessible)
   - Backup/restore functionality from the UI

**Outcome**: All presets, brand icons, settings persist properly across app restarts via native files.

---

### Phase 3: Native File System Integration
**Goal**: PDF save, file open/save dialogs, export/import features.

**Tasks**:
1. Create `electron/ipc/fileHandlers.ts`
   - `file:savePDF(pdfBytes, suggestedName)` — Native "Save As" dialog, write PDF to disk
   - `file:saveCSV(csvContent, suggestedName)` — Native save for CSV export
   - `file:openFile(filters)` — Native "Open" dialog for importing presets/CSV
   - `file:showInFolder(path)` — Open file explorer at saved location
   - `file:getDesktopPath()` — Get default save location

2. Update `src/components/PDFExporter.tsx`
   - Detect Electron environment
   - In Electron: call `window.electronAPI.savePDF()` which opens native dialog
   - In Web: keep existing blob download behavior
   - Add "Save & Open" option that saves then opens the PDF in the system viewer

3. Update `src/utils/googleSheets.ts`
   - In Electron: route fetch through main process (no CORS issues)
   - Add IPC handler `sheets:fetch(url)` in main process

4. Add drag-and-drop import support
   - Drop preset JSON files onto the window to import
   - Drop CSV files to trigger Google Sheets-style import

**Outcome**: Native OS file dialogs for all save/open operations. No more browser download bar.

---

### Phase 4: Native Print Support
**Goal**: Print spec cards directly to connected printers.

**Tasks**:
1. Create `electron/ipc/printHandlers.ts`
   - `print:getPrinters()` — List available system printers
   - `print:printPDF(pdfBytes, printerName?, options?)` — Send PDF to printer
   - `print:printPreview(pdfBytes)` — Open print preview window
   - `print:getDefaultPrinter()` — Get default printer name

2. Create `src/utils/nativePrint.ts`
   - Bridge between React components and Electron print IPC
   - Printer selection dropdown data source

3. Update `src/components/PrintQueue.tsx`
   - Add "Print All" button that sends entire queue to printer
   - Add printer selector dropdown (populated from system printers)
   - Add print options: copies, paper size, orientation
   - Show print progress indicator

4. Update `src/components/PDFExporter.tsx`
   - Add "Print" button alongside "Download PDF"
   - Quick-print to default printer with one click

**Outcome**: One-click printing directly to any connected printer. Batch print entire queue.

---

### Phase 5: Native Email Integration
**Goal**: Replace browser-based EmailJS with Node.js SMTP.

**Tasks**:
1. Install `nodemailer` in main process dependencies
2. Create `electron/ipc/emailHandlers.ts`
   - `email:send(config)` — Send email with PDF attachment via SMTP
   - `email:testConnection(smtpConfig)` — Verify SMTP settings
   - `email:getSavedConfig()` — Retrieve stored SMTP settings

3. Create email settings panel in the app
   - SMTP server, port, username, password (stored encrypted in electron-store)
   - Test connection button
   - Support for Gmail, Outlook, custom SMTP
   - Alternative: keep EmailJS as an option for users who prefer it

4. Update `src/utils/emailService.ts`
   - Route through Electron IPC when available
   - Fall back to EmailJS/mailto for web version

**Outcome**: Send spec card PDFs via email directly from the app with no third-party service dependency.

---

### Phase 6: Application Menu & System Integration
**Goal**: Native menu bar, keyboard shortcuts, system tray.

**Tasks**:
1. Create `electron/menu.ts` — Native application menu
   ```
   File:    New Card, Open Preset, Save Preset, Import CSV, Export PDF, Print, Quit
   Edit:    Undo, Redo, Cut, Copy, Paste
   View:    Zoom In/Out, Reset Zoom, Toggle DevTools (dev only)
   Cards:   Shelf Tag, Price Card, Poster, Queue Manager
   Help:    About, Check for Updates, Documentation
   ```

2. Register global keyboard shortcuts
   - `Ctrl/Cmd+N` — New card (reset)
   - `Ctrl/Cmd+S` — Save current as preset
   - `Ctrl/Cmd+P` — Print current card
   - `Ctrl/Cmd+E` — Export PDF
   - `Ctrl/Cmd+Z/Y` — Undo/Redo (already implemented in web)
   - `Ctrl/Cmd+Shift+I` — Import from Google Sheets

3. System tray integration (optional)
   - Minimize to tray option
   - Quick-access to recent presets from tray menu

4. OS-level file associations
   - Register `.prebuild` file extension for preset files
   - Double-click `.prebuild` file to open in app with that preset loaded

**Outcome**: App feels like a native desktop application with proper menus and shortcuts.

---

### Phase 7: Auto-Updater
**Goal**: Ship updates seamlessly to users.

**Tasks**:
1. Install `electron-updater`
2. Create `electron/updater.ts`
   - Check for updates on app launch (configurable)
   - Download updates in background
   - Prompt user to install and restart
   - Support for both GitHub Releases and custom update server

3. Update `electron/main.ts`
   - Initialize auto-updater on app ready
   - Send update status to renderer via IPC

4. Add update UI in the app
   - Update available notification badge
   - "Update & Restart" button
   - Release notes display
   - Version info in About dialog

5. Configure `electron-builder.yml` for publishing
   - GitHub Releases publish provider
   - Code signing configuration (see Phase 8)

**Outcome**: Users get updates automatically without manual reinstallation.

---

### Phase 8: Packaging & Distribution
**Goal**: Build standalone executables for all platforms.

**Tasks**:
1. Create `electron-builder.yml` configuration
   ```yaml
   appId: com.prebuild-card-generator.app
   productName: PC Prebuild Spec Card Generator
   directories:
     output: release

   win:
     target:
       - nsis          # Standard installer
       - portable      # No-install .exe
     icon: resources/icon.ico
     artifactName: "${productName}-Setup-${version}.${ext}"

   nsis:
     oneClick: false
     allowToChangeInstallationDirectory: true
     createDesktopShortcut: true
     createStartMenuShortcut: true

   mac:
     target:
       - dmg
       - zip
     icon: resources/icon.icns
     category: public.app-category.business

   linux:
     target:
       - AppImage
       - deb
       - rpm
     icon: resources/icon.png
     category: Office

   publish:
     provider: github
     owner: <your-github-org>
     repo: prebuild-card-generator
   ```

2. Create application icons
   - Design app icon at 1024x1024 minimum
   - Generate platform-specific formats:
     - `.ico` (Windows) — multi-resolution (16, 32, 48, 64, 128, 256)
     - `.icns` (macOS) — via `iconutil`
     - `.png` (Linux) — 512x512

3. Add build scripts to `package.json`
   ```json
   {
     "electron:build:win": "electron-builder --win",
     "electron:build:mac": "electron-builder --mac",
     "electron:build:linux": "electron-builder --linux",
     "electron:build:all": "electron-builder -wml",
     "electron:build:portable": "electron-builder --win portable"
   }
   ```

4. Code signing (for production distribution)
   - **Windows**: EV code signing certificate (avoids SmartScreen warnings)
   - **macOS**: Apple Developer certificate + notarization
   - **Linux**: AppImage signing (optional)

5. CI/CD pipeline
   - GitHub Actions workflow for multi-platform builds
   - Triggered on version tag push (e.g., `v1.0.0`)
   - Auto-publish to GitHub Releases
   - Build matrix: Windows (x64), macOS (x64, arm64), Linux (x64)

**Outcome**: One-command builds produce ready-to-distribute installers for all platforms.

---

### Phase 9: Testing & Quality Assurance
**Goal**: Ensure everything works across all target platforms.

**Tasks**:
1. Update existing Vitest tests
   - Mock `window.electronAPI` for Electron-specific code paths
   - Add tests for new storage adapter
   - Add tests for IPC handler logic

2. Add Electron-specific tests
   - Playwright or Spectron for E2E testing
   - Test: app launches, window loads, IPC communication works
   - Test: PDF saves to correct location
   - Test: print queue sends to printer
   - Test: auto-updater checks for updates

3. Manual testing checklist
   - [ ] App installs correctly on Windows 10/11
   - [ ] App installs correctly on macOS 12+
   - [ ] App installs correctly on Ubuntu 22.04+
   - [ ] All presets save and load correctly
   - [ ] PDF export produces correct output
   - [ ] Printing works with USB and network printers
   - [ ] Google Sheets import works without CORS issues
   - [ ] Auto-update downloads and installs correctly
   - [ ] App survives crash/force-quit (data persists)
   - [ ] Keyboard shortcuts work and don't conflict with OS shortcuts

4. Performance testing
   - Startup time < 3 seconds
   - PDF generation time unchanged from web
   - Memory usage < 200MB idle

**Outcome**: Confidence that the app works reliably on all platforms.

---

### Phase 10: Polish & Enhancements (Post-MVP)
**Goal**: Desktop-specific features that improve the experience.

**Tasks**:
1. **Offline-first**: Already works offline (no backend), but remove any web-only dependencies
2. **Splash screen**: Branded loading screen while Electron initializes
3. **Recent files**: "Open Recent" in File menu for recently saved PDFs/presets
4. **Batch processing**: Command-line interface for headless PDF generation
   ```bash
   prebuild-cards --input builds.csv --output ./pdfs/ --size price
   ```
5. **Dark mode**: Respect OS dark mode preference, toggle in app
6. **Multiple windows**: Open multiple card editors side-by-side
7. **Template editor**: Visual template designer for custom card layouts
8. **Backup/Sync**: Export/import all data as a single backup file
9. **Label printer support**: Direct support for Dymo/Brother label printers

---

## 4. Dependency Changes

### New Production Dependencies
```
electron-store          — Persistent JSON storage
nodemailer              — SMTP email sending
electron-updater        — Auto-update support
```

### New Dev Dependencies
```
electron                — Electron framework
electron-builder        — Packaging & distribution
electron-vite           — Vite integration for Electron (OR vite-plugin-electron)
@electron/rebuild       — Native module rebuilding
concurrently            — Run multiple dev processes
```

### Dependencies to Review
```
vite-plugin-pwa         — Disable for Electron builds (PWA not needed)
workbox-window          — Remove for Electron builds
```

---

## 5. Dual-Target Strategy

The app should continue to work as both a web app and desktop app:

```
npm run dev              → Web development server (existing)
npm run build            → Web production build (existing)
npm run electron:dev     → Electron development mode
npm run electron:build   → Package as desktop app
```

Detection in code:
```typescript
export const isElectron = !!(window && window.electronAPI);
```

This boolean gates Electron-specific features while keeping the web version fully functional.

---

## 6. Estimated Effort by Phase

| Phase | Description | Complexity | Notes |
|-------|-------------|------------|-------|
| 1 | Scaffolding & Shell | Medium | Foundation — must be solid |
| 2 | Native Storage | Low | Drop-in adapter swap |
| 3 | File System | Low-Medium | Dialog integration |
| 4 | Print Support | Medium | Printer API nuances |
| 5 | Email (SMTP) | Low-Medium | nodemailer is straightforward |
| 6 | Menu & System | Low | Standard Electron patterns |
| 7 | Auto-Updater | Medium | Code signing complexity |
| 8 | Packaging | Medium-High | Cross-platform builds, CI/CD |
| 9 | Testing | Medium | Multi-platform QA |
| 10 | Polish | Varies | Nice-to-haves |

**Phases 1-3** = Minimum Viable Electron App
**Phases 4-6** = Full-featured Desktop App
**Phases 7-8** = Production-ready Distribution
**Phases 9-10** = Quality & Polish

---

## 7. Key Technical Decisions

### electron-vite vs vite-plugin-electron
**Recommendation: `electron-vite`**
- Purpose-built for Electron + Vite projects
- Handles main, preload, and renderer processes cleanly
- Better TypeScript support and HMR

### electron-builder vs Electron Forge
**Recommendation: `electron-builder`**
- More mature, wider platform support
- Better auto-update integration
- Simpler configuration for our use case

### IPC Architecture
**Recommendation: Typed IPC with preload script**
- All main↔renderer communication through typed channels
- No `nodeIntegration: true` (security best practice)
- Preload script exposes a minimal, typed API surface
- Shared types between main and renderer processes

### Storage Strategy
**Recommendation: `electron-store` with migration**
- Drop-in JSON file storage with encryption support
- Migrate existing localStorage data on first Electron launch
- Keep localStorage adapter for web builds

---

## 8. File Association & Deep Linking

Register custom file types:
- `.prebuild` — Preset file (JSON)
- `.prebuild-batch` — Batch export config

Protocol handler:
- `prebuild-cards://open?preset=xyz` — Open app with specific preset

---

## 9. Security Considerations

- **Context Isolation**: Enabled (default in modern Electron)
- **Node Integration**: Disabled in renderer
- **Sandbox**: Enabled for renderer process
- **CSP**: Strict Content Security Policy
- **Remote Module**: Disabled
- **Web Security**: Enabled
- **SMTP Credentials**: Encrypted at rest in electron-store using `safeStorage`
- **No Remote Code Execution**: All code bundled locally

---

## 10. Getting Started — Phase 1 Quick Start

```bash
# 1. Install dependencies
npm install -D electron electron-vite electron-builder @electron/rebuild

# 2. Create electron/main.ts, electron/preload.ts

# 3. Update vite.config.ts for electron-vite

# 4. Add electron scripts to package.json

# 5. Run in development
npm run electron:dev

# 6. Package for current platform
npm run electron:build
```

This plan maintains 100% backward compatibility with the existing web deployment while adding full desktop capabilities.
