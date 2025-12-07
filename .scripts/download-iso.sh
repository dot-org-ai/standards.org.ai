#!/bin/bash
#
# Download ISO Data
#
# Downloads ISO 3166 (countries), ISO 4217 (currencies), and ISO 639 (languages)
# Uses community-maintained datasets from datahub.io
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")/.source/ISO"

echo "Downloading ISO Standards..."
echo "Source directory: $SOURCE_DIR"
echo ""

mkdir -p "$SOURCE_DIR"
cd "$SOURCE_DIR"

# ISO 3166 - Country Codes
echo "Downloading ISO 3166 (Country Codes)..."
curl -L -o "ISO.CountryCodes.csv" \
  "https://datahub.io/core/country-codes/r/country-codes.csv"

# ISO 4217 - Currency Codes
echo "Downloading ISO 4217 (Currency Codes)..."
curl -L -o "ISO.CurrencyCodes.csv" \
  "https://datahub.io/core/currency-codes/r/codes-all.csv"

# ISO 639 - Language Codes
echo "Downloading ISO 639 (Language Codes)..."
curl -L -o "ISO.LanguageCodes.csv" \
  "https://datahub.io/core/language-codes/r/language-codes.csv"

echo ""
echo "✓ ISO standards downloaded successfully"
echo ""
echo "Downloaded:"
echo "  - ISO 3166 (Country codes)"
echo "  - ISO 4217 (Currency codes)"
echo "  - ISO 639 (Language codes)"
echo ""
echo "Run: bun run generate:iso"
