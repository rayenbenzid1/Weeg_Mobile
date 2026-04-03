/**
 * src/core/hooks/useVoiceRecorder.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages voice recording, playback, and permissions for AI chat interaction.
 */

import { useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface VoiceRecorderState {
  recording: boolean;
  playing: boolean;
  duration: number;
  error: string | null;
}

export interface RecordedAudio {
  uri: string;
  fileName: string;
  mimeType: string;
}

export interface UseVoiceRecorderReturn {
  state: VoiceRecorderState;
  recordingDuration: number;
  playingPosition: number;
  playingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<RecordedAudio | null>;
  playAudio: (audioBase64: string, extension?: 'mp3' | 'm4a' | 'wav') => Promise<void>;
  stopPlaying: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<VoiceRecorderState>({
    recording: false,
    playing: false,
    duration: 0,
    error: null,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingDurationRef = useRef(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingPosition, setPlayingPosition] = useState(0);
  const [playingDuration, setPlayingDuration] = useState(0);

  // Initialize audio mode on mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (err) {
        setState(prev => ({ ...prev, error: 'Failed to initialize audio' }));
      }
    };

    initAudio();

    return () => {
      cleanup();
    };
  }, []);

  const startRecording = async (): Promise<void> => {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setState(prev => ({
          ...prev,
          error: 'Microphone permission denied',
        }));
        return;
      }

      // Stop any ongoing playback
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        setState(prev => ({ ...prev, playing: false }));
      }

      // Prepare recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        shouldDuckAndroid: true,
      });

      recordingDurationRef.current = 0;

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setState({ recording: true, playing: false, duration: 0, error: null });

      // Update duration every 100ms
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordTimerRef.current = setInterval(async () => {
        if (recordingRef.current) {
          const status = await recordingRef.current.getStatusAsync();
          if (status.isRecording) {
            recordingDurationRef.current = status.durationMillis || 0;
            setRecordingDuration(Math.round((status.durationMillis || 0) / 1000));
          }
        }
      }, 100);
    } catch (err) {
      setState(prev => ({
        ...prev,
        recording: false,
        error: `Recording failed: ${err}`,
      }));
    }
  };

  const stopRecording = async (): Promise<RecordedAudio | null> => {
    if (!recordingRef.current) {
      return null;
    }

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      const ext = (uri.split('.').pop() || 'm4a').toLowerCase();
      const mimeByExt: Record<string, string> = {
        m4a: 'audio/m4a',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        webm: 'audio/webm',
      };
      const mimeType = mimeByExt[ext] || 'audio/m4a';

      recordingRef.current = null;
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      setRecordingDuration(0);

      setState(prev => ({
        ...prev,
        recording: false,
        duration: recordingDurationRef.current,
      }));

      return {
        uri,
        fileName: `voice-${Date.now()}.${ext}`,
        mimeType,
      };
    } catch (err) {
      setState(prev => ({
        ...prev,
        recording: false,
        error: `Failed to save recording: ${err}`,
      }));
      return null;
    }
  };

  const playAudio = async (audioBase64: string, extension: 'mp3' | 'm4a' | 'wav' = 'mp3') => {
    try {
      // Stop any ongoing recording
      if (recordingRef.current) {
        await recordingRef.current.pauseAsync();
        recordingRef.current = null;
        setState(prev => ({ ...prev, recording: false }));
      }

      // Stop previous playback if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      // Write audio data to a temporary file
      const fileName = `${FileSystem.cacheDirectory}audio_${Date.now()}.${extension}`;

      await FileSystem.writeAsStringAsync(fileName, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Load and play the audio
      const sound = new Audio.Sound();
      soundRef.current = sound;

      // Subscribe to playback status updates
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded) {
          setPlayingPosition(status.positionMillis || 0);
          setPlayingDuration(status.durationMillis || 0);

          if (status.didJustFinish) {
            setState(prev => ({ ...prev, playing: false }));
            setPlayingPosition(0);
          }
        }
      });

      await sound.loadAsync({ uri: fileName });
      await sound.playAsync();

      setState(prev => ({ ...prev, playing: true }));

      // Clean up file after playback
      setTimeout(() => {
        try {
          FileSystem.deleteAsync(fileName, { idempotent: true });
        } catch (e) {
          // Ignore
        }
      }, 30000); // Delete after 30 seconds
    } catch (err) {
      const message = `Playback failed: ${String(err)}`;
      setState(prev => ({
        ...prev,
        error: message,
      }));
      throw new Error(message);
    }
  };

  const stopPlaying = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        soundRef.current = null;
      }
      setPlayingPosition(0);
      setState(prev => ({ ...prev, playing: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: `Failed to stop playback: ${err}`,
      }));
    }
  };

  const cleanup = async () => {
    try {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  };

  return {
    state,
    recordingDuration,
    playingPosition,
    playingDuration,
    startRecording,
    stopRecording,
    playAudio,
    stopPlaying,
    cleanup,
  };
}
