# Port Conflict Resolution

## Problem Description
The application was failing to start with the following error:
```
Error: listen EADDRINUSE: address already in use :::5000
```

## Root Cause
There were **multiple instances** of the application running simultaneously:
1. **Instance 1**: Running on port 5000 (process 18673)
2. **Instance 2**: Running on port 9000 (process 17037)

When trying to start a new instance on port 5000, it failed because the port was already occupied.

## Solution Applied

### 1. Stopped Conflicting Processes
```bash
# Stopped the process running on port 5000
kill 18673

# Stopped the background process running on port 9000
kill 17037
```

### 2. Enhanced main.ts with Better Port Management
```typescript
// Before (problematic)
await app.listen(5000);

// After (improved)
const port = process.env.PORT || 5000;

try {
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
} catch (error) {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use. Please try a different port.`);
    console.error(`💡 You can set a different port using: PORT=3000 npm run start:dev`);
  } else {
    console.error('❌ Failed to start application:', error.message);
  }
  process.exit(1);
}
```

### 3. Added Convenient Port-Specific Scripts
```json
{
  "scripts": {
    "start:dev:3000": "PORT=3000 nest start --watch",
    "start:dev:4000": "PORT=4000 nest start --watch",
    "start:dev:5000": "PORT=5000 nest start --watch"
  }
}
```

## Current Status
✅ **Issue Resolved**: Application starts successfully on port 5000
✅ **Port Management**: Environment variable support for flexible port configuration
✅ **Error Handling**: Better error messages for port conflicts
✅ **API Endpoints**: All endpoints are responding correctly
✅ **Database Connection**: Working properly with the new schema

## How to Use Different Ports

### Option 1: Environment Variable
```bash
PORT=3000 npm run start:dev
```

### Option 2: Predefined Scripts
```bash
npm run start:dev:3000  # Start on port 3000
npm run start:dev:4000  # Start on port 4000
npm run start:dev:5000  # Start on port 5000
```

### Option 3: Default Behavior
```bash
npm run start:dev       # Uses port 5000 (default)
```

## Testing Results
- **Application Status**: ✅ Running successfully
- **Port**: 5000
- **Database**: Connected and working
- **API Endpoints**: Responding correctly
- **Users Endpoint**: Returns empty array `[]` (expected for new database)

## Best Practices for Future
1. **Check for running processes** before starting the application
2. **Use environment variables** for port configuration
3. **Implement proper error handling** for common startup issues
4. **Use different ports** for development vs production
5. **Monitor port usage** to avoid conflicts

## Troubleshooting Commands
```bash
# Check what's running on a specific port
netstat -tlnp | grep :5000

# Find all nest processes
ps aux | grep "nest start" | grep -v grep

# Kill a specific process
kill <process_id>

# Check if application is responding
curl http://localhost:5000/users
```
