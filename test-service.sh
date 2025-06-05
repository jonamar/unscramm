#!/bin/bash

# Simple test to check if the LocalWordPairService can load word pairs
echo "Testing LocalWordPairService dictionary loading..."

# Test 1: Check if the wordPairs.json file is accessible
echo "=== Test 1: Checking if /data/wordPairs.json is accessible ==="
response=$(curl -s -w "\n%{http_code}" http://localhost:6002/data/wordPairs.json)
http_code=$(echo "$response" | tail -n1)
content=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo "✅ SUCCESS: wordPairs.json is accessible"
    echo "First few lines of the file:"
    echo "$content" | head -10
    
    # Count word pairs
    word_count=$(echo "$content" | grep -o '"misspelling":' | wc -l)
    echo "📊 Found approximately $word_count word pairs"
else
    echo "❌ FAILED: HTTP $http_code - wordPairs.json not accessible"
    exit 1
fi

# Test 2: Check if the main application loads without errors
echo ""
echo "=== Test 2: Checking if main application loads ==="
app_response=$(curl -s -w "\n%{http_code}" http://localhost:6002)
app_http_code=$(echo "$app_response" | tail -n1)

if [ "$app_http_code" = "200" ]; then
    echo "✅ SUCCESS: Main application loads"
    
    # Check for JavaScript errors in the HTML
    if echo "$app_response" | grep -q "error\|Error\|ERROR"; then
        echo "⚠️  WARNING: Potential errors found in HTML response"
        echo "$app_response" | grep -i error | head -3
    else
        echo "✅ No obvious errors in HTML response"
    fi
else
    echo "❌ FAILED: HTTP $app_http_code - Main application not loading"
fi

echo ""
echo "=== Test Summary ==="
echo "Dictionary file accessible: $([ "$http_code" = "200" ] && echo "✅ YES" || echo "❌ NO")"
echo "Main app loads: $([ "$app_http_code" = "200" ] && echo "✅ YES" || echo "❌ NO")"
echo ""
echo "To test the shuffle functionality manually:"
echo "1. Open http://localhost:6002 in your browser"
echo "2. Open Developer Tools (F12)"
echo "3. Toggle the shuffle button and check for console errors" 