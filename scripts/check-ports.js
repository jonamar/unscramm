#!/usr/bin/env node

/**
 * Port check utility script
 * 
 * This script checks all configured ports and reports their status.
 */

import { getPort } from './ports.js';
import net from 'net';

// List of port names to check
const PORT_NAMES = [
  'NEXT_PORT',
  'STORYBOOK_PORT',
  'TEST_PREVIEW_PORT'
];

/**
 * Checks if a port is available
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} - True if port is available, false otherwise
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        // For other errors, assume port is unavailable
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      // Close the server and return true - port is available
      server.close(() => {
        resolve(true);
      });
    });
    
    server.listen(port);
  });
}

/**
 * Main function to check ports
 */
async function main() {
  console.log('Checking port availability:');
  console.log('==========================');
  
  for (const portName of PORT_NAMES) {
    const port = getPort(portName);
    if (!port) {
      console.log(`${portName}: Not configured`);
      continue;
    }
    
    const available = await isPortAvailable(port);
    if (available) {
      console.log(`${portName.padEnd(20)} = ${port} ✅ Available`);
    } else {
      console.log(`${portName.padEnd(20)} = ${port} ❌ In use`);
    }
  }
}

main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}); 