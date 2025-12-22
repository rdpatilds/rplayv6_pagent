# TTS Connection Troubleshooting Guide

## Quick Fix Steps

### 1. Hard Refresh Your Browser
Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac) to reload the page and clear the cache.

### 2. Check Browser Console
Open Developer Tools (F12) and look at the Console tab. You should see:

**✅ Good - Working Connection:**
```
[TTS] Initializing TTS connection...
[TTS Client] Connecting to: http://localhost:3001
[TTS Client] Socket connected
[TTS Client] Socket connected, waiting for tts-connected event
[TTS Client] Received tts-connected event: {message: 'TTS service ready', socketId: '...'}
[TTS Client] Connected to TTS service
```

**❌ Bad - Not Working:**
```
[TTS] Initializing TTS connection...
[TTS Client] Connecting to: http://localhost:3001
[TTS Client] Connection timeout - socket state: false
[TTS] Failed to connect: Connection timeout
```

### 3. Check What You See

#### If you see "Socket connected" but then timeout:
The frontend is connecting but not receiving the confirmation event. **Restart the backend:**
```bash
# Kill backend
pkill -f "tsx index.ts"

# Start backend
cd backend && npm run dev
```

#### If you see "Connection timeout - socket state: false":
The Socket.io connection isn't being established at all. Check:

1. **Backend is running:**
   ```bash
   curl http://localhost:3001/health
   ```
   Should return JSON with `"tts":{"enabled":true}`

2. **No CORS errors in console:**
   Look for red errors mentioning "CORS" or "blocked by CORS policy"

3. **Socket.io endpoint is accessible:**
   ```bash
   curl "http://localhost:3001/socket.io/?EIO=4&transport=polling"
   ```
   Should return something like: `0{"sid":"...","upgrades":["websocket"]...}`

#### If you see "Connection error" with details:
Check the specific error message - it might be:
- `ECONNREFUSED`: Backend isn't running on port 3001
- `CORS error`: CORS configuration issue
- `Timeout`: Network or firewall issue

### 4. Verify Environment Variables

Check `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

This must match where your backend is running.

### 5. Check Network Tab

In Browser Dev Tools → Network tab:
1. Filter by "WS" (WebSocket)
2. Reload the page
3. Look for a connection to `localhost:3001`
4. Check if it shows "101 Switching Protocols" (success) or an error

## Common Issues and Solutions

### Issue: "Failed to load module script"
**Cause:** Next.js build issue
**Solution:**
```bash
cd frontend
rm -rf .next
npm run dev
```

### Issue: Backend logs show "address already in use"
**Cause:** Backend is already running
**Solution:**
```bash
lsof -i :3001  # Find the process
kill <PID>     # Kill it
cd backend && npm run dev
```

### Issue: No logs in backend when frontend connects
**Cause:** Frontend isn't reaching backend
**Solution:**
1. Check frontend is using correct URL
2. Check no firewall blocking localhost
3. Try accessing http://localhost:3001/health in browser

### Issue: CORS error in browser console
**Cause:** Frontend URL not in CORS whitelist
**Solution:** Edit `backend/index.ts` and add your frontend URL to `corsOrigins` array

## Manual Testing

### Test 1: Backend Health
```bash
curl http://localhost:3001/health
```
Expected: `{"status":"healthy",...,"tts":{"enabled":true,"activeConnections":0}}`

### Test 2: Socket.io Endpoint
```bash
curl "http://localhost:3001/socket.io/?EIO=4&transport=polling"
```
Expected: `0{"sid":"...","upgrades":["websocket"],...}`

### Test 3: TTS Stats
```bash
curl http://localhost:3001/api/tts/stats
```
Expected: `{"activeConnections":0,"connections":[]}`

### Test 4: Backend Logs
Watch backend logs for connection attempts:
```bash
tail -f /path/to/backend/logs
```
When frontend connects, you should see:
```
[TTS Service] Client connected: <socket-id>
```

## Debug Mode

### Enable Verbose Logging

**Backend** - Edit `backend/services/websocket-tts-service.ts`:
Add at the start of `setupEventHandlers()`:
```typescript
this.io.engine.on("connection_error", (err) => {
  console.error("[TTS Service] Connection error:", err);
});
```

**Frontend** - Already added in recent update. Check console for:
- `[TTS Client] Connecting to: ...`
- `[TTS Client] Socket connected`
- `[TTS Client] Connection error: ...`

## Still Not Working?

### Last Resort: Clean Restart

1. **Stop everything:**
   ```bash
   pkill -f "tsx index.ts"
   pkill -f "next dev"
   ```

2. **Clear caches:**
   ```bash
   cd frontend && rm -rf .next node_modules/.cache
   cd ../backend && rm -rf node_modules/.cache
   ```

3. **Start backend:**
   ```bash
   cd backend && npm run dev
   ```
   Wait for: `✓ WebSocket TTS: Enabled`

4. **Start frontend:**
   ```bash
   cd frontend && npm run dev
   ```
   Wait for: `Ready on http://localhost:3000`

5. **Navigate to simulation and check console**

### Check Ports

Make sure nothing else is using ports 3000 or 3001:
```bash
lsof -i :3000
lsof -i :3001
```

## Success Indicators

When everything is working, you should see:

1. **In Browser Console:**
   ```
   [TTS] Initializing TTS connection...
   [TTS Client] Connecting to: http://localhost:3001
   [TTS Client] Socket connected
   [TTS Client] Received tts-connected event
   [TTS Client] Connected to TTS service
   [TTS] Connected successfully
   ```

2. **In UI:**
   - Green "Connected" badge in header
   - TTS toggle button enabled
   - Settings button enabled

3. **In Backend Logs:**
   ```
   [TTS Service] Client connected: <socket-id>
   ```

4. **When Sending Message:**
   - Text appears in chat
   - Audio plays automatically (if TTS is ON)
   - Volume icon shows in header

## Contact

If none of these steps work, please provide:
1. Full browser console output
2. Backend log output
3. Network tab screenshot
4. What step failed
