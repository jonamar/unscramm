#!/usr/bin/env node

/**
 * Port Management Utility for Development Servers
 * 
 * This script checks if a port is available before running a command.
 * It can also detect and protect reserved ports.
 * 
 * Usage:
 *   node check-and-run.js <port> <command...>
 * 
 * Example:
 *   node check-and-run.js 6006 storybook dev -p 6006
 */

import { execSync } from 'child_process';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Get project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Reserved ports that should never be used
const SYSTEM_RESERVED_PORTS = {
  11434: 'Ollama AI Service',
  8080: 'Open WebUI',
  3000: 'Common dev server port - may conflict with other projects'
};

// Load port configuration from .env.ports file
function loadPortConfig() {
  const envPortsPath = path.resolve(projectRoot, '.env.ports');
  if (fs.existsSync(envPortsPath)) {
    return dotenv.parse(fs.readFileSync(envPortsPath));
  }
  return {};
}

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
 * Finds a process using a specific port
 * @param {number} port - Port to check
 * @returns {string|null} - Process name if found, null otherwise
 */
function findProcessUsingPort(port) {
  try {
    // This command works on macOS and Linux
    const command = `lsof -i :${port} -P -n -t`;
    const pid = execSync(command, { encoding: 'utf8' }).trim();
    
    if (pid) {
      // Get process name
      const psCommand = process.platform === 'darwin' 
        ? `ps -p ${pid} -o comm=` 
        : `ps -p ${pid} -o comm=`;
      
      return execSync(psCommand, { encoding: 'utf8' }).trim();
    }
  } catch (error) {
    // If the command fails, it likely means no process is using the port
    return null;
  }
  
  return null;
}

/**
 * Check if a port is reserved
 * @param {number} port - Port to check
 * @returns {string|null} - Reservation info if reserved, null otherwise
 */
function isPortReserved(port) {
  // Check system reserved ports (0-1023)
  if (port >= 0 && port <= 1023) {
    return 'System reserved port (0-1023)';
  }
  
  // Check custom reserved ports
  if (SYSTEM_RESERVED_PORTS[port]) {
    return SYSTEM_RESERVED_PORTS[port];
  }
  
  return null;
}

/**
 * Find the next available port starting from the given port
 * @param {number} startPort - Port to start checking from
 * @returns {Promise<number>} - Next available port
 */
async function findNextAvailablePort(startPort) {
  let port = startPort;
  
  while (port < 65535) {
    if (await isPortAvailable(port) && !isPortReserved(port)) {
      return port;
    }
    port++;
  }
  
  // If we get here, no ports are available - very unlikely!
  throw new Error('No available ports found!');
}

/**
 * Main function
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: check-and-run.js <port> <command...>');
    process.exit(1);
  }
  
  const port = parseInt(args[0], 10);
  const command = args.slice(1).join(' ');
  
  if (isNaN(port)) {
    console.error(`Invalid port: ${args[0]}`);
    process.exit(1);
  }
  
  // Check if port is reserved
  const reservationInfo = isPortReserved(port);
  if (reservationInfo) {
    console.error(`⛔ Error: Port ${port} is reserved for ${reservationInfo}`);
    console.error('Please choose a different port');
    process.exit(1);
  }
  
  // Check if port is available
  const available = await isPortAvailable(port);
  if (!available) {
    const processName = findProcessUsingPort(port);
    console.error(`⚠️  Port ${port} is already in use${processName ? ` by ${processName}` : ''}`);
    
    // Suggest an alternative port
    try {
      const nextPort = await findNextAvailablePort(port + 1);
      console.error(`ℹ️  Consider using port ${nextPort} instead`);
      
      // Ask if user wants to continue
      console.error('');
      console.error('Options:');
      console.error('1. Fix the port conflict manually and try again');
      console.error('2. Update the .env.ports file with a different port');
      console.error('');
      process.exit(1);
    } catch (error) {
      console.error('Unable to find an alternative port');
      process.exit(1);
    }
  }
  
  // If we get here, the port is available - run the command
  console.log(`✅ Port ${port} is available - running command: ${command}`);
  
  try {
    // Execute the command directly, passing through stdout and stderr
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    // If the command fails, exit with the same code
    process.exit(error.status || 1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}); 