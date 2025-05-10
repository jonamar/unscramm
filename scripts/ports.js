#!/usr/bin/env node

/**
 * Port configuration utility for development servers
 * 
 * This script reads port assignments from .env.ports and provides
 * tools for checking and managing port availability.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const portConfigFile = path.join(projectRoot, '.env.ports');

// Default port assignments if no config file is found
const DEFAULT_PORTS = {
  NEXT_PORT: 6002,
  STORYBOOK_PORT: 6006,
  TEST_PREVIEW_PORT: 6007,
};

/**
 * Read port assignments from .env.ports file
 * @returns {Object} Port assignments as key-value pairs
 */
function readPortConfig() {
  // Check if .env.ports exists
  if (!fs.existsSync(portConfigFile)) {
    console.log(`No .env.ports file found at ${portConfigFile}`);
    console.log('Using default port assignments.');
    return DEFAULT_PORTS;
  }

  // Read file contents
  const content = fs.readFileSync(portConfigFile, 'utf8');
  const ports = {};

  // Parse line by line
  content.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.startsWith('#') || line.trim() === '') {
      return;
    }

    // Parse key-value pairs
    const match = line.match(/^([A-Z_]+)=(\d+)/);
    if (match) {
      const [, key, value] = match;
      ports[key] = parseInt(value, 10);
    }
  });

  return ports;
}

/**
 * List all configured ports
 */
function listPorts() {
  const ports = readPortConfig();
  
  console.log('\nPort Configuration:');
  console.log('===================');
  
  Object.entries(ports).forEach(([key, value]) => {
    console.log(`${key.padEnd(20)} = ${value}`);
  });
  
  console.log('\nReserved System Ports (Do Not Use):');
  console.log('==================================');
  console.log('0-1023                 = System reserved ports');
  console.log('11434                  = Ollama AI Service');
  console.log('8080                   = Open WebUI');
  console.log('3000                   = Common dev server port');
  console.log();
}

/**
 * Create a sample .env.ports file if it doesn't exist
 */
function createSampleConfig() {
  if (fs.existsSync(portConfigFile)) {
    console.log(`Port configuration file already exists at ${portConfigFile}`);
    return;
  }
  
  const sampleContent = `# Development Server Port Configuration
# This file centralizes all port assignments to avoid conflicts
# between different services during local development.

# Web and API Services
NEXT_PORT=6002           # Next.js development server
STORYBOOK_PORT=6006      # Storybook UI component development server
TEST_PREVIEW_PORT=6007   # Storybook test runner preview port

# Third-Party Services Ports to Avoid (DO NOT USE)
# OLLAMA_PORT=11434      # Reserved for Ollama AI service
# OPENWEBUI_PORT=8080    # Reserved for Open WebUI

# Future Reserved Ports (to be implemented)
# API_PORT=6003          # API server
# WS_PORT=6004           # WebSocket server
# DB_VIEWER_PORT=6010    # Database viewer
`;

  fs.writeFileSync(portConfigFile, sampleContent);
  console.log(`Created sample port configuration at ${portConfigFile}`);
}

/**
 * Get a specific port from the configuration
 * @param {string} portName - The name of the port to get (e.g., NEXT_PORT)
 * @returns {number|null} The port number or null if not found
 */
function getPort(portName) {
  const ports = readPortConfig();
  const port = ports[portName.toUpperCase()];
  
  if (!port) {
    console.error(`Port ${portName} not found in configuration`);
    return null;
  }
  
  return port;
}

/**
 * Main function to handle command line arguments
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'list':
      listPorts();
      break;
    case 'init':
      createSampleConfig();
      break;
    case 'get':
      if (args.length < 2) {
        console.error('Usage: ports.js get <port_name>');
        process.exit(1);
      }
      const port = getPort(args[1]);
      if (port) {
        console.log(port);
      } else {
        process.exit(1);
      }
      break;
    default:
      console.log('Port configuration utility');
      console.log('Usage:');
      console.log('  ports.js list           List all configured ports');
      console.log('  ports.js init           Create a sample .env.ports file');
      console.log('  ports.js get <name>     Get a specific port by name');
      break;
  }
}

// Run the main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export functions for use in other scripts
export {
  readPortConfig,
  getPort,
  listPorts,
  createSampleConfig,
}; 