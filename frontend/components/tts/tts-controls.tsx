"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Settings, Circle, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { websocketTTS, type TTSVoice, type ConnectionState } from "@/lib/tts/websocket-tts-client";

interface TTSControlsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  connectionState: ConnectionState;
}

const VOICE_OPTIONS: { value: TTSVoice; label: string }[] = [
  { value: 'alloy', label: 'Alloy (Neutral)' },
  { value: 'echo', label: 'Echo (Male)' },
  { value: 'fable', label: 'Fable (British)' },
  { value: 'onyx', label: 'Onyx (Deep)' },
  { value: 'nova', label: 'Nova (Female)' },
  { value: 'shimmer', label: 'Shimmer (Soft)' },
];

export function TTSControls({ enabled, onEnabledChange, connectionState }: TTSControlsProps) {
  const [voice, setVoice] = useState<TTSVoice>('alloy');
  const [speed, setSpeed] = useState<number>(1.0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Update TTS client when settings change
  useEffect(() => {
    websocketTTS.setVoice(voice);
  }, [voice]);

  useEffect(() => {
    websocketTTS.setSpeed(speed);
  }, [speed]);

  // Get status badge color and icon
  const getStatusBadge = () => {
    switch (connectionState) {
      case 'connected':
        return {
          variant: 'default' as const,
          className: 'bg-green-500 hover:bg-green-600',
          icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
          text: 'Connected',
        };
      case 'connecting':
        return {
          variant: 'secondary' as const,
          className: 'bg-yellow-500 hover:bg-yellow-600',
          icon: <AlertCircle className="h-3 w-3 mr-1 animate-pulse" />,
          text: 'Connecting',
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-500 hover:bg-red-600',
          icon: <XCircle className="h-3 w-3 mr-1" />,
          text: 'Error',
        };
      case 'disconnected':
      default:
        return {
          variant: 'outline' as const,
          className: 'bg-gray-500 hover:bg-gray-600 text-white',
          icon: <Circle className="h-3 w-3 mr-1" />,
          text: 'Disconnected',
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="flex items-center gap-2">
      {/* Status Badge */}
      <Badge variant={statusBadge.variant} className={statusBadge.className}>
        {statusBadge.icon}
        {statusBadge.text}
      </Badge>

      {/* Enable/Disable Toggle */}
      <Button
        variant={enabled ? "default" : "outline"}
        size="sm"
        onClick={() => onEnabledChange(!enabled)}
        className={enabled ? "bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]" : ""}
        disabled={connectionState !== 'connected'}
      >
        {enabled ? (
          <>
            <Volume2 className="h-4 w-4 mr-1" />
            TTS On
          </>
        ) : (
          <>
            <VolumeX className="h-4 w-4 mr-1" />
            TTS Off
          </>
        )}
      </Button>

      {/* Settings Popover */}
      <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={connectionState !== 'connected'}>
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <h4 className="font-medium leading-none">TTS Settings</h4>

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label htmlFor="voice">Voice</Label>
              <Select value={voice} onValueChange={(value) => setVoice(value as TTSVoice)}>
                <SelectTrigger id="voice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Choose the voice for text-to-speech playback
              </p>
            </div>

            {/* Speed Control */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="speed">Speed</Label>
                <span className="text-sm text-gray-500">{speed.toFixed(1)}x</span>
              </div>
              <Slider
                id="speed"
                min={0.5}
                max={2.0}
                step={0.1}
                value={[speed]}
                onValueChange={(values) => setSpeed(values[0])}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Adjust playback speed (0.5x to 2.0x)
              </p>
            </div>

            {/* Connection Info */}
            <div className="pt-4 border-t space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium">{statusBadge.text}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Voice:</span>
                <span className="font-medium">
                  {VOICE_OPTIONS.find(v => v.value === voice)?.label}
                </span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
