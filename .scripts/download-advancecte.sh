#!/bin/bash
#
# Download Advance CTE Data
#
# Downloads Career Technical Education framework crosswalks
# Source: https://careertech.org/
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")/.source/AdvanceCTE"

echo "Downloading Advance CTE Framework Crosswalks..."
echo "Source directory: $SOURCE_DIR"
echo ""

mkdir -p "$SOURCE_DIR"
cd "$SOURCE_DIR"

# Base URL (update the date/version as needed)
BASE_URL="https://careertech.org/wp-content/uploads/2025/09"

# Full Framework Crosswalk
echo "Downloading Full Framework Crosswalk..."
curl -L -o "Full_Framework_Crosswalk.xlsx" \
  "${BASE_URL}/Full_Framework_Crosswalk.xlsx" || \
curl -L -o "Full_Framework_Crosswalk.xlsx" \
  "https://careertech.org/resource/framework-crosswalk/"

# CIP to Career Clusters
echo "Downloading CIP-Career Clusters Crosswalk..."
curl -L -o "CIP_Career_Clusters_Crosswalk.xlsx" \
  "${BASE_URL}/Full_Framework_Crosswalk_CIP-Career-Clusters.xlsx" || true

# SOC to Career Clusters
echo "Downloading SOC-Career Clusters Crosswalk..."
curl -L -o "SOC_Career_Clusters_Crosswalk.xlsx" \
  "${BASE_URL}/Full_Framework_Crosswalk_SOC-Career-Clusters.xlsx" || true

# NAICS to Sub-Clusters
echo "Downloading NAICS-SubClusters Crosswalk..."
curl -L -o "NAICS_Subclusters_Crosswalk.xlsx" \
  "${BASE_URL}/Full_Framework_Crosswalk_NAICS-Career-Clusters-Subclusters.xlsx" || true

echo ""

# Check if at least the main file was downloaded
if [ -f "Full_Framework_Crosswalk.xlsx" ]; then
    echo "✓ Advance CTE crosswalks downloaded"
else
    echo "⚠ Full Framework Crosswalk not found"
    echo ""
    echo "Manual download may be required:"
    echo "1. Visit: https://careertech.org/resource/framework-crosswalk/"
    echo "2. Download the framework crosswalk files"
    echo "3. Save to: $SOURCE_DIR/"
    echo ""
    exit 1
fi

echo ""
echo "Downloaded:"
echo "  - Full Framework Crosswalk (CIP, SOC, NAICS, Career Clusters)"
echo "  - Individual crosswalk files (if available)"
echo ""
echo "Run: bun run generate:advancecte"
echo ""
echo "Note: Check https://careertech.org/resource/framework-crosswalk/ for updates"
