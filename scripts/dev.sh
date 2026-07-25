#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "Starting Memoria dev server..."
echo "  → Open http://localhost:3000 in your browser"
echo "  → First start can take 30–90 seconds — wait for 'Ready'"
echo "  → This terminal stays open while the server runs (Ctrl+C to stop)"
echo ""

exec next dev -H 0.0.0.0
