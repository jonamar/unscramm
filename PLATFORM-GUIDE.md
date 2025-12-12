# Platform Guide: Chrome Extension + Mac Menu Bar App

This project supports **two platforms** from a **single codebase**:

1. **Chrome Extension** - Browser popup for spell-checking visualization
2. **Tauri App** - Mac menu bar app with native integration

## Architecture

### Platform Abstraction Layer

The app uses a platform abstraction pattern to provide a consistent API across different platforms:

```
src/platform/
├── types.ts      # Platform interface definition
├── chrome.ts     # Chrome extension implementation
└── tauri.ts      # Tauri app implementation
```

**Abstracted APIs:**
- **Clipboard**: Read/write text to system clipboard
- **Storage**: Persistent key-value storage

### Entry Points

Each platform has its own entry point:

- **Chrome**: `src/main-chrome.tsx` (via `index.html`)
- **Tauri**: `src/main-tauri.tsx` (via `index-tauri.html`)

All UI components, animation logic, spell-checking, and styling are 100% shared.

## Development

### Chrome Extension

```bash
# Dev mode
npm run dev
# or explicitly:
npm run dev:chrome

# Build
npm run build:chrome

# Load in Chrome
1. npm run build:chrome
2. Open chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/` folder
```

### Tauri App (Mac Menu Bar)

```bash
# Dev mode
npm run tauri:dev

# Build (Mac only)
npm run tauri:build
```

**Note**: Mac builds must be done on macOS. The app is configured as a menu bar app that:
- Shows/hides on tray icon click
- Stays in the menu bar (doesn't appear in Dock)
- Has a compact 400x600 window
- Runs natively with minimal resource usage

## Building

### Chrome Extension

```bash
npm run build:chrome
```

Outputs to `dist/`:
- `index.html` - Popup UI
- `manifest.json` - Extension manifest
- `assets/` - Bundled JS/CSS
- `icon*.png` - Extension icons
- `frequency-dictionary.txt` - Spell-check dictionary

### Tauri App

```bash
npm run tauri:build
```

Creates native Mac app bundle in `src-tauri/target/release/bundle/`.

**Bundle size comparison:**
- Chrome extension: ~350KB
- Tauri app: ~3-5MB (vs Electron: 50-100MB)

## Configuration

### Chrome Extension

- **Config**: `public/manifest.json`
- **Permissions**: clipboard read/write
- **Icons**: `public/icon*.png`

### Tauri App

- **Config**: `src-tauri/tauri.conf.json`
- **Window**: 400x600, frameless, menu bar mode
- **Tray icon**: `src-tauri/icons/icon.png`
- **Plugins**: clipboard-manager, store

### Vite Configs

- **Chrome**: `vite.config.chrome.ts` - Uses `index.html`
- **Tauri**: `vite.config.tauri.ts` - Uses `index-tauri.html`, fixed port 5173

## What's Shared vs. Platform-Specific

### 100% Shared (no changes needed):
- All React components (`src/components/`)
- All animation logic (`src/utils/`)
- All spell-checking logic (`src/services/`)
- All styling (`src/index.css`, Tailwind)
- All TypeScript types
- All tests

### Platform-Specific (~5% of code):
- Platform adapters (`src/platform/`)
- Entry points (`src/main-*.tsx`)
- Build configs (`vite.config.*.ts`)
- Platform manifests (`public/manifest.json`, `src-tauri/tauri.conf.json`)

## Adding New Platform-Dependent Features

To add a new platform capability (e.g., notifications):

1. **Update the interface** (`src/platform/types.ts`):
```typescript
export interface Platform {
  clipboard: { ... };
  storage: { ... };
  notifications: {  // ← new
    send(message: string): Promise<void>;
  };
}
```

2. **Implement for Chrome** (`src/platform/chrome.ts`):
```typescript
notifications: {
  send: async (message) => {
    chrome.notifications.create({ ... });
  }
}
```

3. **Implement for Tauri** (`src/platform/tauri.ts`):
```typescript
notifications: {
  send: async (message) => {
    const { sendNotification } = await import('@tauri-apps/api/notification');
    await sendNotification(message);
  }
}
```

4. **Use in components**:
```typescript
function App({ platform }: { platform: Platform }) {
  await platform.notifications.send('Done!');
}
```

## Testing

Tests run in jsdom and are platform-agnostic:

```bash
npm test           # Run all tests
npm run test:ui    # Interactive test UI
```

## Maintenance

When developing new features:

1. ✅ Build the feature using the `platform` prop
2. ✅ Test in Chrome extension first (faster iteration)
3. ✅ Test in Tauri to verify cross-platform compatibility
4. ✅ Both builds should pass: `npm run build:chrome && npm run build:tauri`

The platform abstraction ensures features work everywhere with minimal platform-specific code.
