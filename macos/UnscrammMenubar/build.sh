set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$ROOT_DIR/.build"
APP_DIR="$BUILD_DIR/UnscrammMenubar.app"
WEB_SRC_DIR="$ROOT_DIR/../../dist-macos"
WEB_DST_DIR="$APP_DIR/Contents/Resources/web"
ICON_SRC="$ROOT_DIR/icon.icns"

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

swiftc "$ROOT_DIR/main.swift" -O -o "$APP_DIR/Contents/MacOS/UnscrammMenubar" -framework AppKit -framework WebKit
cp "$ROOT_DIR/Info.plist" "$APP_DIR/Contents/Info.plist"

if [ -f "$ICON_SRC" ]; then
  cp "$ICON_SRC" "$APP_DIR/Contents/Resources/icon.icns"
fi

rm -rf "$WEB_DST_DIR"
mkdir -p "$WEB_DST_DIR"

if [ -d "$WEB_SRC_DIR" ]; then
  cp -R "$WEB_SRC_DIR"/* "$WEB_DST_DIR"/

  if [ -f "$WEB_DST_DIR/index-macos.html" ]; then
    # WKWebView + file:// can silently fail to load module/CSS when crossorigin is present.
    perl -pi -e 's/\scrossorigin//g' "$WEB_DST_DIR/index-macos.html"
  fi
else
  echo "Warning: $WEB_SRC_DIR not found. Run: npm run build:macos"
fi

echo "$APP_DIR"
