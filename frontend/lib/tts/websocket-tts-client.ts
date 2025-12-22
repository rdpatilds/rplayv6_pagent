/**
 * WebSocket TTS Client
 * Handles real-time text-to-speech playback using Socket.io and Web Audio API
 */

import { io, Socket } from 'socket.io-client';

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface TTSOptions {
  voice?: TTSVoice;
  speed?: number;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface AudioQueueItem {
  buffer: ArrayBuffer;
  index: number;
}

class WebSocketTTSClient {
  private socket: Socket | null = null;
  private audioContext: AudioContext | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private serverUrl: string;
  private audioQueue: AudioQueueItem[] = [];
  private isPlaying: boolean = false;
  private currentOptions: TTSOptions = {
    voice: 'alloy',
    speed: 1.0,
  };
  private onStateChangeCallbacks: ((state: ConnectionState) => void)[] = [];
  private onErrorCallbacks: ((error: string) => void)[] = [];
  private onSpeechStartCallbacks: (() => void)[] = [];
  private onSpeechEndCallbacks: (() => void)[] = [];

  constructor(serverUrl?: string) {
    this.serverUrl = serverUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  /**
   * Connect to the TTS service
   */
  public async connect(): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      console.log('[TTS Client] Already connected or connecting');
      return;
    }

    this.setState('connecting');

    try {
      // Initialize Audio Context
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume audio context if suspended (autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Initialize Socket.io connection
      console.log('[TTS Client] Connecting to:', this.serverUrl);

      // Wait for connection with a Promise
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          // If socket is connected but we didn't get tts-connected, that's okay
          if (this.socket?.connected) {
            console.log('[TTS Client] Socket connected (timeout fallback)');
            this.setState('connected');
            resolve();
          } else {
            console.error('[TTS Client] Connection timeout - socket state:', this.socket?.connected);
            reject(new Error('Connection timeout'));
          }
        }, 10000);

        // Create socket with event handlers
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        // Setup persistent event handlers first
        this.setupSocketHandlers();

        // Listen for socket connection
        this.socket.once('connect', () => {
          console.log('[TTS Client] Socket connected, waiting for tts-connected event');
          // Give a short time for tts-connected, but resolve if it doesn't come
          setTimeout(() => {
            if (this.socket?.connected && this.connectionState !== 'connected') {
              console.log('[TTS Client] Connected via connect event (no tts-connected needed)');
              clearTimeout(timeout);
              this.setState('connected');
              resolve();
            }
          }, 500);
        });

        // Listen for tts-connected event (preferred)
        this.socket.once('tts-connected', (data) => {
          console.log('[TTS Client] Received tts-connected event:', data);
          clearTimeout(timeout);
          this.setState('connected');
          console.log('[TTS Client] Connected to TTS service');
          resolve();
        });

        // Listen for connection errors
        this.socket.once('connect_error', (error) => {
          console.error('[TTS Client] Socket connection error:', error);
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error) {
      console.error('[TTS Client] Connection error:', error);
      this.setState('error');
      this.triggerErrorCallbacks(error instanceof Error ? error.message : 'Connection failed');
      throw error;
    }
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[TTS Client] Socket connected');
      // Update state to connected when socket connects
      this.setState('connected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[TTS Client] Connection error:', error);
      this.setState('error');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[TTS Client] Socket disconnected:', reason);
      this.setState('disconnected');
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[TTS Client] Socket reconnected after', attemptNumber, 'attempts');
      this.setState('connected');
    });

    this.socket.on('speech-start', (data) => {
      console.log('[TTS Client] Speech started:', data.voice);
      this.triggerSpeechStartCallbacks();
    });

    this.socket.on('audio-chunk', async (data) => {
      try {
        // Decode base64 audio data
        const binaryString = atob(data.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Add to queue
        this.audioQueue.push({
          buffer: bytes.buffer,
          index: data.index,
        });

        // Start playback if not already playing
        if (!this.isPlaying) {
          this.playQueue();
        }
      } catch (error) {
        console.error('[TTS Client] Error processing audio chunk:', error);
      }
    });

    this.socket.on('speech-end', (data) => {
      console.log('[TTS Client] Speech ended:', data.totalBytes, 'bytes');
    });

    this.socket.on('tts-error', (data) => {
      console.error('[TTS Client] TTS error:', data.message);
      this.triggerErrorCallbacks(data.message);
    });

    this.socket.on('disconnect', () => {
      console.log('[TTS Client] Disconnected from server');
      this.setState('disconnected');
    });

    this.socket.on('reconnect', () => {
      console.log('[TTS Client] Reconnected to server');
      this.setState('connected');
    });
  }

  /**
   * Play queued audio chunks
   */
  private async playQueue(): Promise<void> {
    if (!this.audioContext || this.audioQueue.length === 0) {
      return;
    }

    this.isPlaying = true;

    while (this.audioQueue.length > 0) {
      const item = this.audioQueue.shift();
      if (!item) continue;

      try {
        // Concatenate all available chunks for smoother playback
        const chunks = [item];
        while (this.audioQueue.length > 0 && chunks.length < 5) {
          const nextChunk = this.audioQueue.shift();
          if (nextChunk) chunks.push(nextChunk);
        }

        // Combine chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.buffer.byteLength, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(new Uint8Array(chunk.buffer), offset);
          offset += chunk.buffer.byteLength;
        }

        // Decode and play
        await this.playAudioBuffer(combined.buffer);
      } catch (error) {
        console.error('[TTS Client] Error playing audio:', error);
      }
    }

    this.isPlaying = false;
    this.triggerSpeechEndCallbacks();
  }

  /**
   * Play a single audio buffer
   */
  private async playAudioBuffer(arrayBuffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    // Resume context if needed
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return new Promise((resolve, reject) => {
      this.audioContext!.decodeAudioData(
        arrayBuffer,
        (audioBuffer) => {
          const source = this.audioContext!.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(this.audioContext!.destination);
          source.onended = () => resolve();
          source.start(0);
        },
        (error) => reject(error)
      );
    });
  }

  /**
   * Generate and play speech
   */
  public async speak(text: string, options?: TTSOptions): Promise<void> {
    if (!this.socket || this.connectionState !== 'connected') {
      throw new Error('Not connected to TTS service');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required');
    }

    // Update options
    if (options) {
      this.currentOptions = { ...this.currentOptions, ...options };
    }

    // Clear any existing queue
    this.stop();

    // Request speech generation
    return new Promise((resolve, reject) => {
      this.socket!.emit(
        'generate-speech',
        {
          text: text.trim(),
          voice: this.currentOptions.voice,
          speed: this.currentOptions.speed,
        },
        (response: { success: boolean; error?: string }) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Speech generation failed'));
          }
        }
      );
    });
  }

  /**
   * Stop current playback
   */
  public stop(): void {
    this.audioQueue = [];
    this.isPlaying = false;

    if (this.socket) {
      this.socket.emit('stop-speech');
    }
  }

  /**
   * Disconnect from the service
   */
  public disconnect(): void {
    this.stop();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.setState('disconnected');
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Set connection state and trigger callbacks
   */
  private setState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.onStateChangeCallbacks.forEach(cb => cb(state));
    }
  }

  /**
   * Register state change callback
   */
  public onStateChange(callback: (state: ConnectionState) => void): void {
    this.onStateChangeCallbacks.push(callback);
  }

  /**
   * Register error callback
   */
  public onError(callback: (error: string) => void): void {
    this.onErrorCallbacks.push(callback);
  }

  /**
   * Register speech start callback
   */
  public onSpeechStart(callback: () => void): void {
    this.onSpeechStartCallbacks.push(callback);
  }

  /**
   * Register speech end callback
   */
  public onSpeechEnd(callback: () => void): void {
    this.onSpeechEndCallbacks.push(callback);
  }

  /**
   * Trigger error callbacks
   */
  private triggerErrorCallbacks(error: string): void {
    this.onErrorCallbacks.forEach(cb => cb(error));
  }

  /**
   * Trigger speech start callbacks
   */
  private triggerSpeechStartCallbacks(): void {
    this.onSpeechStartCallbacks.forEach(cb => cb());
  }

  /**
   * Trigger speech end callbacks
   */
  private triggerSpeechEndCallbacks(): void {
    this.onSpeechEndCallbacks.forEach(cb => cb());
  }

  /**
   * Set voice
   */
  public setVoice(voice: TTSVoice): void {
    this.currentOptions.voice = voice;
  }

  /**
   * Set speed
   */
  public setSpeed(speed: number): void {
    this.currentOptions.speed = Math.max(0.25, Math.min(4.0, speed));
  }

  /**
   * Get current options
   */
  public getOptions(): TTSOptions {
    return { ...this.currentOptions };
  }
}

// Create singleton instance
export const websocketTTS = new WebSocketTTSClient();

// Export the class for testing
export { WebSocketTTSClient };
