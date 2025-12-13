set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$ROOT_DIR/.build"
APP_DIR="$BUILD_DIR/UnscrammMenubar.app"

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

swiftc "$ROOT_DIR/main.swift" -O -o "$APP_DIR/Contents/MacOS/UnscrammMenubar" -framework AppKit
cp "$ROOT_DIR/Info.plist" "$APP_DIR/Contents/Info.plist"

echo "$APP_DIR"
