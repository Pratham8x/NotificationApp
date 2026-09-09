import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  AudioContext,
  AudioManager,
  AudioRecorder,
} from 'react-native-audio-api';
import { Buffer } from 'buffer';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

const INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;

AudioManager.setAudioSessionOptions({
  iosCategory: 'playAndRecord',
  iosMode: 'default',
  iosOptions: [],
});

function pcm16Base64(floatSamples) {
  const bytes = Buffer.alloc(floatSamples.length * 2);
  for (let index = 0; index < floatSamples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, floatSamples[index]));
    bytes.writeInt16LE(
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      index * 2,
    );
  }
  return bytes.toString('base64');
}

function pcm16ToFloat32(base64) {
  const bytes = Buffer.from(base64, 'base64');
  const samples = new Float32Array(Math.floor(bytes.length / 2));
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = bytes.readInt16LE(index * 2) / 0x8000;
  }
  return samples;
}

const VoiceChatScreen = ({ navigation }) => {
  const recorderRef = useRef(new AudioRecorder());
  const audioContextRef = useRef(new AudioContext());
  const socketRef = useRef(null);
  const streamingRef = useRef(false);
  const recordingRef = useRef(false);
  const audioSessionRef = useRef(false);
  const playbackSourcesRef = useRef(new Set());
  const playbackEndRef = useRef(0);
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  const stopPlayback = () => {
    const context = audioContextRef.current;
    playbackSourcesRef.current.forEach(source =>
      source.stop(context.currentTime),
    );
    playbackSourcesRef.current.clear();
    playbackEndRef.current = context.currentTime;
  };

  const playAudioChunk = base64 => {
    const context = audioContextRef.current;
    const samples = pcm16ToFloat32(base64);
    if (!samples.length) return;
    const buffer = context.createBuffer(1, samples.length, OUTPUT_RATE);
    buffer.getChannelData(0).set(samples);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const startAt = Math.max(context.currentTime, playbackEndRef.current);
    source.start(startAt);
    playbackEndRef.current = startAt + samples.length / OUTPUT_RATE;
    playbackSourcesRef.current.add(source);
  };

  const closeSession = async () => {
    streamingRef.current = false;
    recorderRef.current.clearOnAudioReady();
    if (recordingRef.current) {
      await recorderRef.current.stop();
      recordingRef.current = false;
    }
    if (audioSessionRef.current) {
      await AudioManager.setAudioSessionActivity(false);
      audioSessionRef.current = false;
    }
    stopPlayback();
    socketRef.current?.close();
    socketRef.current = null;
  };

  const startConversation = async () => {
    if (state !== 'idle') return;
    setState('connecting');
    setError('');
    try {
      const { data } = await api.post('/ai/live-token');
      if (!data.success || !data.token)
        throw new Error('Invalid voice credential');

      const socket = new WebSocket(
        `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(
          data.token,
        )}`,
      );
      socketRef.current = socket;
      await new Promise((resolve, reject) => {
        socket.onopen = resolve;
        socket.onerror = () =>
          reject(new Error('Could not connect to Gemini Live'));
      });

      socket.send(
        JSON.stringify({
          setup: {
            model: `models/${data.model || 'gemini-3.1-flash-live-preview'}`,
            responseModalities: ['AUDIO'],
            realtimeInputConfig: { automaticActivityDetection: {} },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        }),
      );

      const permission = await AudioManager.requestRecordingPermissions();
      if (permission !== 'Granted')
        throw new Error('Microphone permission is required for voice chat.');
      await AudioManager.setAudioSessionActivity(true);
      audioSessionRef.current = true;
      await audioContextRef.current.resume();

      recorderRef.current.onAudioReady(
        {
          sampleRate: INPUT_RATE,
          bufferLength: INPUT_RATE * 0.1,
          channelCount: 1,
        },
        ({ buffer }) => {
          if (socket.readyState !== WebSocket.OPEN || !streamingRef.current)
            return;
          const samples = buffer.getChannelData(0);
          let peak = 0;
          for (let index = 0; index < samples.length; index += 1)
            peak = Math.max(peak, Math.abs(samples[index]));
          if (peak > 0.08) {
            stopPlayback();
            setState('listening');
          }
          socket.send(
            JSON.stringify({
              realtimeInput: {
                audio: {
                  data: pcm16Base64(samples),
                  mimeType: `audio/pcm;rate=${INPUT_RATE}`,
                },
              },
            }),
          );
        },
      );

      socket.onmessage = event => {
        const response = JSON.parse(event.data);
        // Future searchKnowledge tool calls can be handled here and posted to an authenticated backend route.
        const serverContent = response.serverContent;
        if (serverContent?.interrupted) stopPlayback();
        if (serverContent?.turnComplete && streamingRef.current)
          setState('listening');
        serverContent?.modelTurn?.parts?.forEach(part => {
          const audio = part.inlineData;
          if (audio?.data) {
            setState('speaking');
            playAudioChunk(audio.data);
          }
        });
      };
      socket.onclose = () => {
        if (streamingRef.current) {
          streamingRef.current = false;
          setState('idle');
        }
      };
      socket.onerror = () => setError('Gemini Live connection failed.');
      const recording = await recorderRef.current.start();
      if (recording.status === 'error')
        throw new Error(recording.message || 'Could not start microphone.');
      recordingRef.current = true;
      streamingRef.current = true;
      setState('listening');
    } catch (startError) {
      await closeSession();
      setState('idle');
      setError(
        startError.response?.data?.message ||
          startError.message ||
          'Could not start voice conversation.',
      );
    }
  };

  const endConversation = async () => {
    await closeSession();
    setState('idle');
  };

  useEffect(
    () => () => {
      closeSession();
    },
    [],
  );

  const active = state !== 'idle';
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            endConversation();
            navigation.goBack();
          }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={25} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Chirpy Voice</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.content}>
        <View style={[styles.wave, active && styles.waveActive]}>
          <Ionicons
            name={state === 'speaking' ? 'volume-high' : 'mic'}
            size={64}
            color="#2563EB"
          />
        </View>
        <Text style={styles.heading}>Real-time conversation</Text>
        <Text style={styles.status}>
          {state === 'connecting'
            ? 'Connecting…'
            : state === 'speaking'
            ? 'Chirpy is speaking'
            : state === 'listening'
            ? 'Listening…'
            : 'Tap start to talk'}
        </Text>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {!active ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={startConversation}
            accessibilityRole="button"
            accessibilityLabel="Start voice conversation"
          >
            <Ionicons name="call" size={22} color="#FFFFFF" />
            <Text style={styles.buttonText}>Start conversation</Text>
          </TouchableOpacity>
        ) : state === 'connecting' ? (
          <ActivityIndicator color="#2563EB" />
        ) : (
          <TouchableOpacity
            style={styles.endButton}
            onPress={endConversation}
            accessibilityRole="button"
            accessibilityLabel="End voice conversation"
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
            <Text style={styles.buttonText}>End conversation</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFF' },
  header: {
    height: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CBD5E1',
  },
  title: {
    flex: 1,
    marginLeft: 18,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSpacer: { width: 25 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  wave: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
  },
  waveActive: { backgroundColor: '#BFDBFE' },
  heading: { marginTop: 28, fontSize: 22, fontWeight: '800', color: '#0F172A' },
  status: { marginTop: 8, fontSize: 15, color: '#64748B' },
  error: {
    marginTop: 18,
    padding: 12,
    color: '#B91C1C',
    backgroundColor: '#FEE2E2',
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 34,
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 28,
    backgroundColor: '#2563EB',
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 34,
    paddingHorizontal: 26,
    paddingVertical: 15,
    borderRadius: 28,
    backgroundColor: '#DC2626',
  },
  buttonText: {
    marginLeft: 9,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default VoiceChatScreen;
