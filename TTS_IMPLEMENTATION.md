# Text-to-Speech Implementation

## Overview
Real-time text-to-speech streaming using Socket.io and OpenAI TTS API for the AI simulation chat system.

## Architecture

```
Frontend (Browser)          Backend (Node.js)           External API
      │                           │                          │
      │   1. Socket.io Connect    │                          │
      ├──────────────────────────►│                          │
      │                           │                          │
      │   2. Request Speech       │                          │
      ├──────────────────────────►│   3. Generate TTS        │
      │                           ├─────────────────────────►│
      │                           │   (OpenAI TTS API)       │
      │   4. Audio Chunks (Base64)│   5. Stream Response     │
      │◄─────────────────────────►│◄─────────────────────────┤
      │                           │                          │
      ▼                           ▼                          ▼
  Web Audio API             Stream Processing          OpenAI TTS
  (Playback)                 (Chunking)                 (Generation)
```

## Backend Components

### 1. WebSocket TTS Service
**File**: `backend/services/websocket-tts-service.ts`

- Manages Socket.io connections
- Streams audio from OpenAI TTS API
- Handles concurrent connections
- Supports 6 voices and speed control

**Key Events**:
- `generate-speech`: Client requests TTS
- `speech-start`: Audio generation started
- `audio-chunk`: Audio data chunk
- `speech-end`: Audio generation completed
- `tts-error`: Error occurred
- `stop-speech`: Stop current playback

### 2. Server Integration
**File**: `backend/index.ts`

- HTTP server wrapper for Express
- Socket.io initialization with CORS
- TTS service initialization
- Health and stats endpoints

**Endpoints**:
- `GET /health`: Server health with TTS status
- `GET /api/tts/stats`: Active connections info

## Frontend Components

### 1. WebSocket TTS Client
**File**: `frontend/lib/tts/websocket-tts-client.ts`

- Socket.io client connection
- Audio chunk decoding and queueing
- Web Audio API integration
- Connection state management
- Event callbacks

**Key Methods**:
- `connect()`: Establish connection
- `speak(text, options)`: Generate and play speech
- `stop()`: Stop current playback
- `disconnect()`: Close connection
- `setVoice(voice)`: Change voice
- `setSpeed(speed)`: Change speed

**Singleton Instance**:
```typescript
import { websocketTTS } from '@/lib/tts/websocket-tts-client';
```

### 2. TTS Controls Component
**File**: `frontend/components/tts/tts-controls.tsx`

- Connection status indicator
- Enable/disable toggle
- Settings panel (voice, speed)
- Visual feedback

### 3. Integration
**File**: `frontend/app/simulation/session/page.tsx`

- TTS controls in header
- Auto-connect on mount
- Play audio for client responses
- Skip audio in expert mode

## Features

### Voice Options
- **Alloy**: Neutral voice
- **Echo**: Male voice
- **Fable**: British accent
- **Onyx**: Deep voice
- **Nova**: Female voice
- **Shimmer**: Soft voice

### Speed Control
- Range: 0.5x to 2.0x
- Default: 1.0x
- Adjustable via settings panel

### Connection States
- `disconnected`: Not connected
- `connecting`: Establishing connection
- `connected`: Ready to use
- `error`: Connection failed

## Usage

### Starting the Backend
```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:3001` with WebSocket on same port.

### Starting the Frontend
```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000`.

### Using TTS in Simulation

1. Navigate to simulation session page
2. TTS automatically connects (check status badge)
3. Toggle TTS on/off with button in header
4. Adjust voice/speed in settings
5. Send messages - AI responses play automatically

## Configuration

### Environment Variables

**Backend** (`.env`):
```env
OPENAI_API_KEY=sk-xxx
PORT=3001
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### CORS Origins
Edit `backend/index.ts` to add allowed origins:
```typescript
const corsOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  // Add more origins here
];
```

## Technical Details

### Audio Format
- **Format**: MP3
- **Model**: OpenAI `tts-1` (low latency)
- **Streaming**: 16KB chunks
- **Encoding**: Base64 over Socket.io

### Latency
- **Connection**: ~1-2 seconds
- **First audio**: ~500ms after request
- **Total**: ~500-700ms from AI response to audio start

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 15+
- Edge 80+

Requires Web Audio API support.

## Troubleshooting

### Backend Won't Start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill existing process
kill <PID>

# Restart
npm run dev
```

### TTS Not Connecting
1. Check backend is running: `curl http://localhost:3001/health`
2. Check TTS status in health response
3. Verify OPENAI_API_KEY is set
4. Check browser console for errors
5. Check CORS settings match frontend URL

### No Audio Playing
1. Verify TTS toggle is ON
2. Check connection status (should be green "Connected")
3. Ensure you're in client mode (not expert mode)
4. Check browser audio permissions
5. Try adjusting volume/speed in settings

### Audio Stuttering
- Increase chunk buffer size in `websocket-tts-client.ts`
- Check network connection quality
- Reduce concurrent TTS requests

## API Reference

### Backend Events

#### `generate-speech`
Request speech generation.

**Request**:
```typescript
{
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number; // 0.25 to 4.0
}
```

**Response**:
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `speech-start`
Audio generation started.

**Data**:
```typescript
{
  text: string;
  voice: string;
}
```

#### `audio-chunk`
Audio data chunk.

**Data**:
```typescript
{
  data: string; // Base64 encoded audio
  index: number;
}
```

#### `speech-end`
Audio generation completed.

**Data**:
```typescript
{
  totalBytes: number;
  duration: number;
}
```

#### `tts-error`
Error occurred.

**Data**:
```typescript
{
  message: string;
}
```

### Frontend API

#### `websocketTTS.connect()`
Connect to TTS service.

**Returns**: `Promise<void>`

#### `websocketTTS.speak(text, options?)`
Generate and play speech.

**Parameters**:
- `text`: String to speak
- `options`: Optional settings
  - `voice`: Voice to use
  - `speed`: Playback speed

**Returns**: `Promise<void>`

#### `websocketTTS.stop()`
Stop current playback.

#### `websocketTTS.disconnect()`
Disconnect from service.

#### `websocketTTS.onStateChange(callback)`
Register state change callback.

**Callback**: `(state: ConnectionState) => void`

#### `websocketTTS.onError(callback)`
Register error callback.

**Callback**: `(error: string) => void`

## Future Enhancements

### Potential Improvements
- [ ] Add bidirectional voice (user speaks → AI responds)
- [ ] Implement voice activity detection
- [ ] Add voice interruption capability
- [ ] Cache frequently used phrases
- [ ] Add offline mode with fallback voices
- [ ] Implement audio visualization
- [ ] Add subtitle/closed caption support
- [ ] Queue management for multiple messages
- [ ] Emotional tone adjustment based on context

### Performance Optimizations
- [ ] Use WebRTC Data Channels for lower latency
- [ ] Implement audio pre-buffering
- [ ] Add progressive audio loading
- [ ] Optimize chunk size based on network speed
- [ ] Implement audio compression

## License
This implementation is part of the AI Simulation Platform project.

## Support
For issues or questions, contact the development team or create an issue in the repository.
