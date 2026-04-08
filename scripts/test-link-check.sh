#!/usr/bin/env bash
# Run with: npm run dev in one terminal, then ./scripts/test-link-check.sh
# Tests /api/check-link: live URL -> active:true, invalid -> active:false
BASE="${BASE_URL:-http://localhost:3000}"
echo "Testing $BASE/api/check-link"
echo "Live URL:"
curl -s "${BASE}/api/check-link?url=https%3A%2F%2Fwww.google.com"
echo ""
echo "Invalid:"
curl -s "${BASE}/api/check-link?url=not-a-url"
echo ""
