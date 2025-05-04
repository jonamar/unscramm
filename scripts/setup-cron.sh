#!/bin/bash

# Get the absolute path to the project
PROJECT_PATH=$(cd "$(dirname "$0")/.." && pwd)

# Create a temporary crontab file
TEMP_CRONTAB=$(mktemp)

# Export existing crontab
crontab -l > "$TEMP_CRONTAB" 2>/dev/null || echo "# New crontab" > "$TEMP_CRONTAB"

# Check if the cron job already exists
if grep -q "cache:clean" "$TEMP_CRONTAB"; then
  echo "Cache cleanup cron job already exists."
  rm "$TEMP_CRONTAB"
  exit 0
fi

# Add the new cron job (runs at 3am on the 1st of each month)
echo "# Unscramm cache cleanup (added $(date))" >> "$TEMP_CRONTAB"
echo "0 3 1 * * cd $PROJECT_PATH && npm run cache:clean" >> "$TEMP_CRONTAB"

# Install the updated crontab
crontab "$TEMP_CRONTAB"

# Clean up
rm "$TEMP_CRONTAB"

echo "Success! Monthly cache cleanup cron job installed."
echo "It will run at 3am on the 1st of every month."
echo "You can verify it with 'crontab -l'" 