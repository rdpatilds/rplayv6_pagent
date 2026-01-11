/**
 * WebSocket TTS Service
 * Handles real-time text-to-speech streaming using Socket.io and OpenAI TTS API
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface TTSRequest {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number;
}

interface ConnectionInfo {
  socket: Socket;
  isStreaming: boolean;
  connectedAt: Date;
}

export class WebSocketTTSService {
  private io: SocketIOServer;
  private connections: Map<string, ConnectionInfo> = new Map();
  private apiKey: string;

  constructor(httpServer: HTTPServer, apiKey: string, corsOrigins: string[]) {
    this.apiKey = apiKey;

    // Initialize Socket.io with CORS configuration
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigins,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    console.log('[TTS Service] WebSocket TTS service initialized');
    console.log('[TTS Service] Socket.io listening on:', corsOrigins);
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    console.log('[TTS Service] Setting up event handlers');

    this.io.on('connection', (socket: Socket) => {
      console.log(`[TTS Service] Client connected: ${socket.id}`);

      // Store connection info
      this.connections.set(socket.id, {
        socket,
        isStreaming: false,
        connectedAt: new Date(),
      });

      // Handle speech generation request
      socket.on('generate-speech', async (data: TTSRequest, callback) => {
        try {
          await this.handleSpeechGeneration(socket, data);
          if (callback) callback({ success: true });
        } catch (error) {
          console.error('[TTS Service] Error generating speech:', error);
          socket.emit('tts-error', {
            message: error instanceof Error ? error.message : 'Failed to generate speech',
          });
          if (callback) callback({ success: false, error: 'Failed to generate speech' });
        }
      });

      // Handle stop speech request
      socket.on('stop-speech', () => {
        const conn = this.connections.get(socket.id);
        if (conn) {
          conn.isStreaming = false;
          console.log(`[TTS Service] Speech stopped for client: ${socket.id}`);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`[TTS Service] Client disconnected: ${socket.id}`);
        this.connections.delete(socket.id);
      });

      // Send connection confirmation
      console.log(`[TTS Service] Sending tts-connected event to ${socket.id}`);
      socket.emit('tts-connected', {
        message: 'TTS service ready',
        socketId: socket.id,
      });
      console.log(`[TTS Service] tts-connected event sent to ${socket.id}`);
    });
  }

  /**
   * Handle speech generation request
   */
  private async handleSpeechGeneration(socket: Socket, data: TTSRequest): Promise<void> {
    const conn = this.connections.get(socket.id);
    if (!conn) {
      throw new Error('Connection not found');
    }

    // Prevent concurrent streaming for the same client
    if (conn.isStreaming) {
      console.log(`[TTS Service] Client ${socket.id} is already streaming, ignoring request`);
      return;
    }

    // Validate input
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('Text is required');
    }

    if (data.text.length > 4000) {
      throw new Error('Text is too long (max 4000 characters)');
    }

    conn.isStreaming = true;

    try {
      console.log(`[TTS Service] Generating speech for client ${socket.id}: "${data.text.substring(0, 50)}..."`);

      // Emit start event
      socket.emit('speech-start', {
        text: data.text,
        voice: data.voice || 'alloy',
      });

      // Call OpenAI TTS API
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1', // Use tts-1 for lower latency, tts-1-hd for higher quality
          input: data.text,
          voice: data.voice || 'alloy',
          speed: data.speed || 1.0,
          response_format: 'mp3',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI TTS API error: ${response.status} - ${errorText}`);
      }

      // Stream the audio data
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let totalBytes = 0;
      const chunkSize = 16384; // 16KB chunks for optimal streaming

      while (true) {
        // Check if client stopped or disconnected
        if (!conn.isStreaming || !this.connections.has(socket.id)) {
          console.log(`[TTS Service] Streaming interrupted for client ${socket.id}`);
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        totalBytes += value.length;

        // Emit audio chunk
        socket.emit('audio-chunk', {
          data: Buffer.from(value).toString('base64'),
          index: Math.floor(totalBytes / chunkSize),
        });

        // Small delay to prevent overwhelming the client
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // Emit end event
      socket.emit('speech-end', {
        totalBytes,
        duration: totalBytes / 16000, // Approximate duration
      });

      console.log(`[TTS Service] Speech generation completed for client ${socket.id} (${totalBytes} bytes)`);

    } catch (error) {
      console.error('[TTS Service] Error in speech generation:', error);
      socket.emit('tts-error', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      conn.isStreaming = false;
    }
  }

  /**
   * Get service statistics
   */
  public getStats() {
    return {
      activeConnections: this.connections.size,
      connections: Array.from(this.connections.entries()).map(([id, conn]) => ({
        socketId: id,
        isStreaming: conn.isStreaming,
        connectedAt: conn.connectedAt,
      })),
    };
  }

  /**
   * Shutdown the service
   */
  public shutdown(): void {
    console.log('[TTS Service] Shutting down...');
    this.connections.clear();
    this.io.close();
  }
}
