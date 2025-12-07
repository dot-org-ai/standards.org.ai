#!/bin/bash
#
# Download IANA Data
#
# Downloads IANA timezone database and other registries
# Source: https://www.iana.org/
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")/.source/IANA"

echo "Downloading IANA Data..."
echo "Source directory: $SOURCE_DIR"
echo ""

mkdir -p "$SOURCE_DIR"
cd "$SOURCE_DIR"

# Timezone Database (from moment-timezone project - easier to parse)
echo "Downloading IANA Timezone Database (JSON format)..."
curl -L -o "moment-timezone-latest.json" \
  "https://raw.githubusercontent.com/moment/moment-timezone/develop/data/packed/latest.json"

# Timezone data from another source
echo "Downloading timezone data (alternative format)..."
curl -L -o "timezones.json" \
  "https://raw.githubusercontent.com/dmfilipenko/timezones.json/master/timezones.json"

# Time zone names
echo "Downloading timezone names..."
curl -L -o "time-zones-names.json" \
  "https://raw.githubusercontent.com/dmfilipenko/timezones.json/master/time-zones-names.json"

# Full TZDB data
echo "Downloading full TZDB data..."
curl -L -o "tzdb-full.json" \
  "https://raw.githubusercontent.com/vvo/tzdb/main/time-zones.json"

echo ""
echo "✓ IANA timezone data downloaded"
echo ""
echo "Downloaded:"
echo "  - Timezone database (multiple formats)"
echo "  - Zone names and identifiers"
echo "  - Offset information"
echo ""
echo "Run: bun run generate:iana"
echo ""
echo "Note: For the official IANA tzdata, visit: https://www.iana.org/time-zones"
