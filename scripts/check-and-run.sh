#!/usr/bin/env bash

# Port Management Utility for Development Servers
#
# This script checks if a port is available before running a command.
# It can also detect and protect reserved ports.
#
# Usage:
#   ./check-and-run.sh <port> <command...>
#
# Example:
#   ./check-and-run.sh 6006 storybook dev -p 6006

# Get the current directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default port configuration file location
PORT_CONFIG_FILE="$PROJECT_ROOT/.env.ports"

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is reserved
is_port_reserved() {
  local port=$1
  
  # Check system reserved ports (0-1023)
  if [ $port -ge 0 ] && [ $port -le 1023 ]; then
    echo "System reserved port (0-1023)"
    return 0
  fi
  
  # Check specific reserved ports
  case $port in
    11434)
      echo "Ollama AI Service"
      return 0
      ;;
    8080)
      echo "Open WebUI"
      return 0
      ;;
    3000)
      echo "Common dev server port - may conflict with other projects"
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# Function to check if a port is available
is_port_available() {
  local port=$1
  
  # On macOS/Linux, we can use the nc (netcat) command to check port availability
  if command -v nc &> /dev/null; then
    # Try to bind to the port
    nc -z localhost $port &> /dev/null
    # Invert the result since nc returns 0 if the port is IN USE
    if [ $? -eq 0 ]; then
      return 1 # Port is NOT available
    else
      return 0 # Port is available
    fi
  # Fallback to less efficient methods
  elif command -v lsof &> /dev/null; then
    lsof -i :$port -P -n -t &> /dev/null
    if [ $? -eq 0 ]; then
      return 1 # Port is NOT available
    else
      return 0 # Port is available
    fi
  # Last resort - try to create a socket on the port
  else
    # Use shell's redirection to try binding to the port
    (echo > /dev/tcp/localhost/$port) &> /dev/null
    if [ $? -eq 0 ]; then
      return 1 # Port is NOT available (could connect to it)
    else
      return 0 # Port is available
    fi
  fi
}

# Function to find the process using a port
find_process_using_port() {
  local port=$1
  local pid=""
  
  if command -v lsof &> /dev/null; then
    pid=$(lsof -i :$port -P -n -t 2>/dev/null | head -n1)
    if [ -n "$pid" ]; then
      if [[ "$(uname)" == "Darwin" ]]; then
        # macOS
        echo "$(ps -p $pid -o comm= 2>/dev/null)"
      else
        # Linux
        echo "$(ps -p $pid -o comm= 2>/dev/null)"
      fi
    fi
  fi
}

# Function to find the next available port
find_next_available_port() {
  local port=$1
  
  while [ $port -lt 65535 ]; do
    if is_port_available $port; then
      reservation=$(is_port_reserved $port)
      if [ -z "$reservation" ]; then
        echo $port
        return 0
      fi
    fi
    port=$((port + 1))
  done
  
  echo "No available ports found!"
  return 1
}

# Main function
main() {
  # Check arguments
  if [ $# -lt 2 ]; then
    echo "Usage: check-and-run.sh <port> <command...>"
    exit 1
  fi
  
  local port=$1
  shift
  local command="$@"
  
  # Validate port is a number
  if ! [[ $port =~ ^[0-9]+$ ]]; then
    echo -e "${RED}Invalid port: $port${NC}"
    exit 1
  fi
  
  # Check if port is reserved
  local reservation=$(is_port_reserved $port)
  if [ -n "$reservation" ]; then
    echo -e "${RED}⛔ Error: Port $port is reserved for $reservation${NC}"
    echo "Please choose a different port"
    exit 1
  fi
  
  # Check if port is available
  if ! is_port_available $port; then
    local process_name=$(find_process_using_port $port)
    echo -e "${YELLOW}⚠️  Port $port is already in use${process_name:+ by $process_name}${NC}"
    
    # Suggest an alternative port
    local next_port=$(find_next_available_port $((port + 1)))
    if [ -n "$next_port" ]; then
      echo -e "${BLUE}ℹ️  Consider using port $next_port instead${NC}"
      echo ""
      echo "Options:"
      echo "1. Fix the port conflict manually and try again"
      echo "2. Update the .env.ports file with a different port"
      echo ""
    else
      echo "Unable to find an alternative port"
    fi
    exit 1
  fi
  
  # If we get here, the port is available - run the command
  echo -e "${GREEN}✅ Port $port is available - running command: $command${NC}"
  
  # Execute the command
  eval "$command"
  exit $?
}

# Run the main function
main "$@" 