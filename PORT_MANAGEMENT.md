# Port Management System

This project includes a port management system to prevent port conflicts during development. It provides a centralized way to manage port assignments and ensures that development servers don't accidentally interfere with each other or system-critical services.

## Why We Need This

When working with multiple development servers (Next.js, Storybook, test runners, etc.), port conflicts can occur that lead to:

- Failed server startups
- Unexpected behavior
- Accidental interference with important services (like Ollama or Open WebUI)
- Confusing error messages

This system solves these problems by providing:

1. Centralized port configuration
2. Pre-startup port availability checks
3. Protection for reserved system ports
4. Helpful error messages and suggestions

## Getting Started

### 1. Initialize Port Configuration

If you haven't already, create the `.env.ports` configuration file:

```bash
npm run ports:init
```

This creates a `.env.ports` file at the project root with default port assignments.

### 2. View Current Port Assignments

To see which ports are currently assigned to various services:

```bash
npm run ports:list
```

### 3. Running Services Safely

All npm scripts have been updated to check port availability before starting services. For example:

- `npm run dev` - Starts Next.js on port 6002 (checks first)
- `npm run storybook` - Starts Storybook on port 6006 (checks first)

If a port is already in use, you'll receive a helpful error message with suggestions.

## How It Works

### Port Check Script

The core of the system is `scripts/check-and-run.sh`, a shell script that:

1. Checks if the requested port is available
2. Checks if the port is reserved by a critical system
3. Provides suggestions if the port is unavailable
4. Only runs the requested command if it's safe to do so

### Configuration File

The `.env.ports` file contains all port assignments in a centralized location with clear documentation:

```
# Web and API Services
NEXT_PORT=6002           # Next.js development server
STORYBOOK_PORT=6006      # Storybook UI component development server
TEST_PREVIEW_PORT=6007   # Storybook test runner preview port
```

### Protected Ports

The system automatically protects important system ports:

- Ports 0-1023: System reserved ports
- Port 11434: Ollama AI Service
- Port 8080: Open WebUI
- Port 3000: Common dev server port that may conflict with other projects

## Advanced Usage

### Using the Port Check Script Directly

You can use the port check script directly for custom commands:

```bash
./scripts/check-and-run.sh 8000 "python -m http.server 8000"
```

### JavaScript Utility

The system includes a Node.js utility (`scripts/ports.js`) for programmatic port management:

```javascript
const { getPort } = require('./scripts/ports.js');
const storybookPort = getPort('STORYBOOK_PORT');
```

### Adding New Services

To add a new service:

1. Edit `.env.ports` and add your service's port
2. Update your npm scripts to use the `check-and-run.sh` script

### Customizing Port Assignments

To change port assignments:

1. Edit `.env.ports` file with your preferred port numbers
2. Update corresponding npm scripts if necessary
3. Run `npm run ports:list` to verify the changes

## Troubleshooting

### Port Conflict Detected

If you see a port conflict error:

```
⚠️ Port 6006 is already in use by node
ℹ️ Consider using port 6008 instead

Options:
1. Fix the port conflict manually and try again
2. Update the .env.ports file with a different port
```

You can:

1. Find and close the other process using the port
2. Edit `.env.ports` to use a different port
3. Temporarily use a different port by modifying the npm script

### Unable to Find Process Using Port

If the system can't identify which process is using a port:

```bash
# On macOS or Linux
lsof -i :6006

# On Windows (PowerShell)
netstat -ano | findstr :6006
```

## Implementation Details

The port management system consists of:

- **check-and-run.sh**: Shell script for port availability checking
- **ports.js**: Node.js utility for reading and managing port configuration
- **.env.ports**: Configuration file for port assignments
- **Updated npm scripts**: Pre-configured to use the port management system

The implementation is lightweight and requires no additional infrastructure or dependencies. 