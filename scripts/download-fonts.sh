#!/bin/bash
# ============================================
# CLAUSEWALL — Download Noto Sans Indian Fonts
# Required for Bhasha Engine PDF generation
# ============================================

set -e

FONT_DIR="public/fonts"
BASE_URL="https://github.com/google/fonts/raw/main/ofl"

mkdir -p "$FONT_DIR"

echo "Downloading Noto Sans fonts for Bhasha Engine..."

# Devanagari (Hindi, Marathi)
curl -L -o "$FONT_DIR/NotoSansDevanagari-Regular.ttf" \
  "$BASE_URL/notosansdevanagari/NotoSansDevanagari-Regular.ttf"

# Bengali (Bengali, Assamese)
curl -L -o "$FONT_DIR/NotoSansBengali-Regular.ttf" \
  "$BASE_URL/notosansbengali/NotoSansBengali-Regular.ttf"

# Tamil
curl -L -o "$FONT_DIR/NotoSansTamil-Regular.ttf" \
  "$BASE_URL/notosanstamil/NotoSansTamil-Regular.ttf"

# Telugu
curl -L -o "$FONT_DIR/NotoSansTelugu-Regular.ttf" \
  "$BASE_URL/notosanstelugu/NotoSansTelugu-Regular.ttf"

# Kannada
curl -L -o "$FONT_DIR/NotoSansKannada-Regular.ttf" \
  "$BASE_URL/notosanskannada/NotoSansKannada-Regular.ttf"

# Gujarati
curl -L -o "$FONT_DIR/NotoSansGujarati-Regular.ttf" \
  "$BASE_URL/notosansgujarati/NotoSansGujarati-Regular.ttf"

# Malayalam
curl -L -o "$FONT_DIR/NotoSansMalayalam-Regular.ttf" \
  "$BASE_URL/notosansmalayalam/NotoSansMalayalam-Regular.ttf"

# Gurmukhi (Punjabi)
curl -L -o "$FONT_DIR/NotoSansGurmukhi-Regular.ttf" \
  "$BASE_URL/notosansgurmukhi/NotoSansGurmukhi-Regular.ttf"

# Oriya (Odia)
curl -L -o "$FONT_DIR/NotoSansOriya-Regular.ttf" \
  "$BASE_URL/notosansoriya/NotoSansOriya-Regular.ttf"

echo ""
echo "Done. 9 font files downloaded to $FONT_DIR/"
ls -la "$FONT_DIR/"*.ttf 2>/dev/null || echo "No .ttf files found"
