/**
 * src/core/screens/ai-insights/AIChatScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Decision Advisor chat — full-screen, MANAGER-ONLY.
 *
 * Features:
 *   - Persistent conversation (loads last session from backend)
 *   - Typing indicator with animated dots
 *   - Decision cards with expandable option comparison
 *   - Suggested follow-up chips below each AI message
 *   - Topic filter pills to browse quick questions
 *   - Urgency badges on AI messages
 */

import React, {
    useState, useEffect, useRef, useCallback
} from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    KeyboardAvoidingView, Platform, StyleSheet, Animated,
    ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Colors, Shadow } from '../../constants/theme';
import {
    aiInsightsMobileApi,
    type ChatMessage,
    type DecisionCard
} from '../../lib/aiInsightsMobileApi';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const uid = () => Math.random().toString(36).slice(2);

const URGENCY_COLOR: Record<string, string> = {
  critical: Colors.red,
  high: Colors.orange,
  medium: Colors.amber,
  low: Colors.blue,
};

const TOPIC_CONFIG: Record<string, { color: string; label: string }> = {
  credit:   { color: Colors.orange, label: 'Receivables' },
  stock:    { color: Colors.blue,   label: 'Stock' },
  churn:    { color: Colors.violet, label: 'Retention' },
  forecast: { color: Colors.green,  label: 'Forecast' },
  revenue:  { color: Colors.blue,   label: 'Revenue' },
  general:  { color: Colors.text3,  label: 'General' },
};

const QUICK_TOPICS: { key: string; label: string; icon: string; questions: string[] }[] = [
  {
    key: 'credit', label: 'Receivables', icon: 'cash-outline',
    questions: [
      'Who are my top overdue accounts right now?',
      'Should I suspend credit for any customer?',
      'What is my current DSO and how can I improve it?',
      'How much cash can I realistically collect this month?',
    ],
  },
  {
    key: 'churn', label: 'Retention', icon: 'people-outline',
    questions: [
      'Which customers are most likely to churn and why?',
      'How much revenue am I at risk of losing to churn?',
      'Which churned customers should I try to win back?',
    ],
  },
  {
    key: 'stock', label: 'Stock', icon: 'cube-outline',
    questions: [
      'Which products need an emergency reorder right now?',
      'How much should I order and when?',
      'Am I prepared for the upcoming peak season?',
    ],
  },
  {
    key: 'forecast', label: 'Forecast', icon: 'trending-up-outline',
    questions: [
      'What is my revenue outlook for the next 3 months?',
      'What is the main risk to my forecast?',
      'What should I do to hit my best-case scenario?',
    ],
  },
];

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'ai',
  content:
    "Hello. I have real-time access to your receivables, churn signals, stock levels, anomalies, and revenue forecast.\n\nAsk any business question — I'll give you a clear recommendation with exact figures.",
  time: now(),
  suggested_followups: [
    'What are my most critical business risks right now?',
    'Which customers should I contact today and why?',
    'Do I need to make any urgent stock decisions?',
  ],
  topic: 'general',
  urgency: 'low',
};

const LOADING_PHRASES = [
  'Analyzing your data…',
  'Checking receivables & churn signals…',
  'Reviewing stock levels…',
  'Preparing your recommendation…',
];

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ phrase }: { phrase: string }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ),
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.msgRowAI}>
      <View style={styles.aiAvatar}>
        <Ionicons name="sparkles" size={13} color="#fff" />
      </View>
      <View style={[styles.aiBubble, { paddingVertical: 12, paddingHorizontal: 14 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {dots.map((dot, i) => (
              <Animated.View key={i} style={[styles.dotIndicator, { opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />
            ))}
          </View>
          <Text style={styles.typingPhrase}>{phrase}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Decision card ────────────────────────────────────────────────────────────

function DecisionCardView({ card, onSelectOption }: { card: DecisionCard; onSelectOption: (q: string) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <View style={styles.decCard}>
      {/* Header */}
      <LinearGradient colors={[Colors.blue, Colors.violet]} style={styles.decHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Ionicons name="bulb-outline" size={12} color="rgba(255,255,255,0.7)" />
          <Text style={styles.decHeaderLabel}>DECISION REQUIRED</Text>
        </View>
        <Text style={styles.decQuestion}>{card.question}</Text>
      </LinearGradient>

      {/* Recommendation */}
      <View style={styles.decRec}>
        <Ionicons name="checkmark-circle" size={14} color={Colors.green} style={{ marginTop: 1 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.decRecLabel}>Recommendation</Text>
          <Text style={styles.decRecText}>{card.recommendation}</Text>
          <Text style={styles.decRationale}>{card.rationale}</Text>
        </View>
      </View>

      {/* Options */}
      {card.options?.length > 0 && (
        <View style={styles.decOptions}>
          <Text style={styles.decSectionLabel}>Options</Text>
          {card.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.decOption, selected === i && styles.decOptionSelected]}
              onPress={() => { setSelected(i); onSelectOption(`Tell me more about: "${opt.label}"`); }}
            >
              <View style={styles.decOptionTop}>
                <View style={styles.decOptionLetter}>
                  <Text style={styles.decOptionLetterText}>{String.fromCharCode(65 + i)}</Text>
                </View>
                <Text style={[styles.decOptionName, selected === i && { color: Colors.blue }]}>{opt.label}</Text>
                {selected === i && <Ionicons name="checkmark-circle" size={14} color={Colors.blue} style={{ marginLeft: 'auto' }} />}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
                  <Ionicons name="thumbs-up-outline" size={11} color={Colors.green} style={{ marginTop: 1 }} />
                  <Text style={[styles.decPros, { flex: 1 }]}>{opt.pros}</Text>
                </View>
                <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
                  <Ionicons name="thumbs-down-outline" size={11} color={Colors.red} style={{ marginTop: 1 }} />
                  <Text style={[styles.decCons, { flex: 1 }]}>{opt.cons}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Footer */}
      {(card.owner || card.deadline) && (
        <View style={styles.decFooter}>
          {card.owner && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="person-outline" size={11} color={Colors.text3} />
              <Text style={styles.decFooterText}>{card.owner}</Text>
            </View>
          )}
          {card.deadline && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="time-outline" size={11} color={Colors.text3} />
              <Text style={styles.decFooterText}>{card.deadline}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, onFollowup, onPlayAudio, isPlaying, playingMessageId }: { message: ChatMessage; onFollowup: (q: string) => void; onPlayAudio?: (msgId: string) => void; isPlaying?: boolean; playingMessageId?: string | null }) {
  const isUser = message.role === 'user';

  const renderText = (text: string) =>
    text.split('\n').map((line, i, arr) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <Text key={i}>
          {parts.map((p, j) =>
            p.startsWith('**') && p.endsWith('**')
              ? <Text key={j} style={{ fontWeight: '700', color: isUser ? '#fff' : Colors.text }}>{p.slice(2, -2)}</Text>
              : p,
          )}
          {i < arr.length - 1 ? '\n' : null}
        </Text>
      );
    });

  if (isUser) {
    return (
      <View style={styles.msgRowUser}>
        <LinearGradient colors={[Colors.blue, Colors.violet]} style={styles.userBubble} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.userText}>{renderText(message.content)}</Text>
        </LinearGradient>
        <Text style={styles.msgTime}>{message.time}</Text>
      </View>
    );
  }

  const topic = message.topic;
  const urgency = message.urgency;
  const topicCfg = topic ? TOPIC_CONFIG[topic] : null;
  const urgencyColor = urgency && urgency !== 'low' ? URGENCY_COLOR[urgency] : null;
  const isCurrentlyPlaying = isPlaying && playingMessageId === message.id;

  return (
    <View style={styles.msgRowAI}>
      <LinearGradient colors={[Colors.blue, Colors.violet]} style={styles.aiAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name="sparkles" size={13} color="#fff" />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        {/* Badges + Audio button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          {(topicCfg && topic !== 'general') || urgencyColor ? (
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>
              {topicCfg && topic !== 'general' && (
                <View style={[styles.topicBadge, { backgroundColor: topicCfg.color + '18', borderColor: topicCfg.color + '30' }]}>
                  <Text style={[styles.topicBadgeText, { color: topicCfg.color }]}>{topicCfg.label}</Text>
                </View>
              )}
              {urgencyColor && (
                <View style={[styles.topicBadge, { backgroundColor: urgencyColor + '18', borderColor: urgencyColor + '30', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                  <View style={[styles.urgencyDot, { backgroundColor: urgencyColor }]} />
                  <Text style={[styles.topicBadgeText, { color: urgencyColor }]}>{urgency}</Text>
                </View>
              )}
              {message.fallback && (
                <View style={[styles.topicBadge, { backgroundColor: Colors.amber + '15', borderColor: Colors.amber + '30' }]}>
                  <Text style={[styles.topicBadgeText, { color: Colors.amber }]}>offline</Text>
                </View>
              )}
            </View>
          ) : null}
          {/* Play audio button */}
          {onPlayAudio && (
            <TouchableOpacity
              style={[styles.audioBtn, isCurrentlyPlaying && styles.audioBtnPlaying]}
              onPress={() => onPlayAudio(message.id)}
            >
              <Ionicons name={isCurrentlyPlaying ? 'stop-circle' : 'volume-high'} size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Bubble — text only, decision card is separate below */}
        <View style={styles.aiBubble}>
          <Text style={styles.aiText}>{renderText(message.content)}</Text>
        </View>

        {/* Decision card rendered OUTSIDE the bubble as its own block */}
        {message.decision_card && (
          <DecisionCardView card={message.decision_card} onSelectOption={onFollowup} />
        )}

        {/* Follow-ups */}
        {message.suggested_followups && message.suggested_followups.length > 0 && (
          <View style={{ marginTop: 8, gap: 4 }}>
            <Text style={styles.followupLabel}>Continue</Text>
            {message.suggested_followups.map((q, i) => (
              <TouchableOpacity key={i} style={styles.followupBtn} onPress={() => onFollowup(q)}>
                <Ionicons name="arrow-forward-outline" size={11} color={Colors.blue} style={{ flexShrink: 0, marginTop: 1 }} />
                <Text style={styles.followupText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.msgTime, { alignSelf: 'flex-start', marginTop: 4 }]}>{message.time}</Text>
      </View>
    </View>
  );
}

// ─── Topic quick-question panel ───────────────────────────────────────────────

function TopicPanel({ onSend, onClose }: { onSend: (q: string) => void; onClose: () => void }) {
  const [activeTopic, setActiveTopic] = useState(QUICK_TOPICS[0].key);
  const topicData = QUICK_TOPICS.find(t => t.key === activeTopic)!;

  return (
    <View style={styles.topicPanel}>
      <View style={styles.topicPanelHeader}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {QUICK_TOPICS.map(t => {
            const color = TOPIC_CONFIG[t.key]?.color ?? Colors.blue;
            const active = activeTopic === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.topicPill, active && { backgroundColor: color + '18', borderColor: color + '40' }]}
                onPress={() => setActiveTopic(t.key)}
              >
                <Ionicons name={t.icon as any} size={12} color={active ? color : Colors.text3} />
                <Text style={[styles.topicPillText, active && { color, fontWeight: '700' }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity onPress={onClose} style={{ marginLeft: 8 }}>
          <Ionicons name="close" size={18} color={Colors.text3} />
        </TouchableOpacity>
      </View>
      <View style={{ gap: 6 }}>
        {topicData.questions.map((q, i) => {
          const color = TOPIC_CONFIG[topicData.key]?.color ?? Colors.blue;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.quickQ, { borderColor: color + '25' }]}
              onPress={() => { onSend(q); onClose(); }}
            >
              <Ionicons name="chevron-forward" size={11} color={color} />
              <Text style={styles.quickQText}>{q}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main chat screen ─────────────────────────────────────────────────────────

export function AIChatScreen({ navigation }: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);
  const [showTopicPanel, setShowTopicPanel] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);

  const listRef = useRef<FlatList>(null);
  const phraseRef = useRef(0);
  const voiceRecorder = useVoiceRecorder();
  const currentAudioRef = useRef<NodeJS.Timeout | null>(null);

  // Cycle loading phrases
  useEffect(() => {
    if (!sending) return;
    const t = setInterval(() => {
      phraseRef.current = (phraseRef.current + 1) % LOADING_PHRASES.length;
      setLoadingPhrase(LOADING_PHRASES[phraseRef.current]);
    }, 2000);
    return () => clearInterval(t);
  }, [sending]);

  // Load most recent conversation
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await aiInsightsMobileApi.conversations();
        const latest = res.conversations?.[0];
        if (!latest) return;
        const hist = await aiInsightsMobileApi.conversationMessages(latest.id);
        const mapped: ChatMessage[] = (hist.messages ?? []).map((m: any) => ({
          id: m.id,
          role: m.role === 'assistant' ? 'ai' : 'user',
          content: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          decision_needed: m.metadata?.decision_needed,
          decision_card: m.metadata?.decision_card ?? null,
          suggested_followups: m.metadata?.suggested_followups,
          urgency: m.metadata?.urgency,
          topic: m.metadata?.topic,
          fallback: m.metadata?.fallback,
        }));
        if (mounted) {
          setConversationId(latest.id);
          if (mapped.length > 0) setMessages(mapped);
        }
      } catch { /* keep initial message */ }
      finally { if (mounted) setLoadingHistory(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: trimmed, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setShowTopicPanel(false);

    // Build history for API
    const apiHistory = [...messages, userMsg]
      .filter(m => !m.loading)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

    try {
      const res = await aiInsightsMobileApi.chat({
        messages: apiHistory,
        ...(conversationId ? { conversation_id: conversationId } : {}),
      });
      if (res.conversation_id) setConversationId(res.conversation_id);
      setMessages(prev => [...prev, {
        id: uid(), role: 'ai', content: res.answer, time: now(),
        decision_needed: res.decision_needed, decision_card: res.decision_card,
        suggested_followups: res.suggested_followups, urgency: res.urgency,
        topic: res.topic, fallback: res.fallback,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: uid(), role: 'ai',
        content: "I'm temporarily unavailable. Please check your dashboard panels for the latest data.",
        time: now(), error: true,
        suggested_followups: ['What are my top business risks?', 'Which customers need urgent attention?', 'What is my revenue outlook?'],
      }]);
    } finally {
      setSending(false);
    }
  }, [messages, sending, conversationId]);

  const handleClear = () => {
    Alert.alert('New conversation', 'Start a fresh conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start new', onPress: () => { setMessages([INITIAL_MESSAGE]); setConversationId(null); } },
    ]);
  };

  // Handle voice recording
  const handleMicPress = async () => {
    if (voiceRecorder.state.recording) {
      // Stop recording and transcribe
      const audioFile = await voiceRecorder.stopRecording();
      if (audioFile) {
        setTranscribing(true);
        try {
          const result = await aiInsightsMobileApi.transcribeAudio(audioFile);
          if (result.transcription) {
            send(result.transcription);
          }
        } catch (err) {
          Alert.alert('Transcription Error', `Failed to transcribe audio: ${err}`);
        } finally {
          try {
            await FileSystem.deleteAsync(audioFile.uri, { idempotent: true });
          } catch {
            // Ignore cleanup failures for temp recording files.
          }
          setTranscribing(false);
        }
      }
    } else {
      // Start recording
      await voiceRecorder.startRecording();
    }
  };

  // Handle audio playback for AI responses
  const handlePlayAudio = async (msgId: string) => {
    if (playingMessageId === msgId) {
      // Stop current playback
      await voiceRecorder.stopPlaying();
      setPlayingMessageId(null);
      if (currentAudioRef.current) {
        clearTimeout(currentAudioRef.current);
        currentAudioRef.current = null;
      }
    } else {
      // Find message and play its audio
      const message = messages.find(m => m.id === msgId);
      if (!message) return;

      setPlayingMessageId(msgId);
      try {
        const audioPayload = await aiInsightsMobileApi.speakText(message.content.substring(0, 4096), 'nova');
        const ext = audioPayload.mime_type.includes('mpeg') ? 'mp3' : 'm4a';
        await voiceRecorder.playAudio(audioPayload.audio_base64, ext);

        // Auto-stop after expected duration (approximate)
        if (currentAudioRef.current) clearTimeout(currentAudioRef.current);
        currentAudioRef.current = setTimeout(() => {
          setPlayingMessageId(null);
        }, Math.min(message.content.length * 30, 60000)); // Rough estimate
      } catch (err) {
        Alert.alert('Error', `Failed to play audio: ${err}`);
        setPlayingMessageId(null);
      }
    }
  };

  const allItems = [...messages, ...(sending ? [{ id: '__typing__', role: 'typing' as any, content: '', time: '' }] : [])];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: Colors.bg }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Ionicons name="sparkles" size={15} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Decision Advisor</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerSub}>Live business context</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <Ionicons name="refresh-outline" size={18} color={Colors.text3} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loadingHistory ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.blue} />
          <Text style={{ fontSize: 13, color: Colors.text3, marginTop: 10 }}>Loading conversation…</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={allItems}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            if (item.role === 'typing') return <TypingIndicator phrase={loadingPhrase} />;
            return <MessageBubble 
              message={item as ChatMessage} 
              onFollowup={send}
              onPlayAudio={handlePlayAudio}
              isPlaying={voiceRecorder.state.playing}
              playingMessageId={playingMessageId}
            />;
          }}
        />
      )}

      {/* Topic quick-question panel (slides up) */}
      {showTopicPanel && (
        <TopicPanel onSend={send} onClose={() => setShowTopicPanel(false)} />
      )}

      {/* Input area */}
      <View style={styles.inputArea}>
        <TouchableOpacity
          style={[styles.iconBtn, showTopicPanel && { backgroundColor: Colors.blue + '15' }]}
          onPress={() => setShowTopicPanel(v => !v)}
        >
          <Ionicons name="apps-outline" size={20} color={showTopicPanel ? Colors.blue : Colors.text3} />
        </TouchableOpacity>
        
        {/* Microphone button */}
        <TouchableOpacity
          style={[
            styles.iconBtn,
            (voiceRecorder.state.recording || transcribing) && { backgroundColor: Colors.red + '20' }
          ]}
          onPress={handleMicPress}
          disabled={sending || transcribing}
        >
          {transcribing ? (
            <ActivityIndicator size="small" color={Colors.red} />
          ) : (
            <Ionicons 
              name={voiceRecorder.state.recording ? 'stop-circle' : 'mic-outline'} 
              size={20} 
              color={voiceRecorder.state.recording ? Colors.red : Colors.text3} 
            />
          )}
        </TouchableOpacity>

        {/* Recording duration display */}
        {voiceRecorder.state.recording && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.red }} />
            <Text style={{ fontSize: 12, color: Colors.red, fontWeight: '600' }}>
              {voiceRecorder.recordingDuration}s
            </Text>
          </View>
        )}
        
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask a business question…"
          placeholderTextColor={Colors.text3}
          multiline
          maxLength={500}
          returnKeyType="default"
          editable={!voiceRecorder.state.recording && !transcribing}
          onSubmitEditing={() => { if (!input.trim()) return; }}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={16} color="#fff" />
          }
        </TouchableOpacity>
      </View>
      <Text style={styles.inputHint}>
        {voiceRecorder.state.recording 
          ? 'Tap microphone to stop and transcribe' 
          : 'Enter to add a new line · Tap send to submit'}
      </Text>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 40,  paddingBottom: 14,backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, ...Shadow.sm },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: { width: 36, height: 36, borderRadius: 11, backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 15, fontWeight: '700', color: Colors.text },
  headerSub:    { fontSize: 11, color: Colors.text3 },
  onlineDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  clearBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: Colors.border },

  // Messages
  messageList: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },

  msgRowUser: { alignItems: 'flex-end', marginBottom: 12 },
  userBubble: { borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 16, paddingVertical: 11, maxWidth: '80%' },
  userText:   { fontSize: 13.5, color: '#fff', lineHeight: 20 },

  msgRowAI: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start', maxWidth: '95%' },
  aiAvatar: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  aiBubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  aiText:   { fontSize: 13.5, color: Colors.text, lineHeight: 20 },

  msgTime: { fontSize: 10, color: Colors.text3, marginTop: 4 },

  // Topic badges
  topicBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  topicBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  urgencyDot:     { width: 5, height: 5, borderRadius: 3 },

  // Follow-ups
  followupLabel: { fontSize: 10, fontWeight: '700', color: Colors.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  followupBtn:   { flexDirection: 'row', gap: 6, alignItems: 'flex-start', backgroundColor: Colors.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.border },
  followupText:  { fontSize: 12.5, color: Colors.text, flex: 1, lineHeight: 18 },

  // Decision card
  decCard:         { marginTop: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.blue + '25' },
  decHeader:       { padding: 14 },
  decHeaderLabel:  { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.7)' },
  decQuestion:     { fontSize: 13.5, fontWeight: '700', color: '#fff', lineHeight: 20 },
  decRec:          { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: Colors.green + '08', borderBottomWidth: 0.5, borderBottomColor: Colors.green + '20' },
  decRecLabel:     { fontSize: 10, fontWeight: '700', color: Colors.green, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  decRecText:      { fontSize: 13, fontWeight: '600', color: Colors.text },
  decRationale:    { fontSize: 11.5, color: Colors.text2, fontStyle: 'italic', marginTop: 3 },
  decOptions:      { padding: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  decSectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  decOption:       { borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  decOptionSelected:  { borderColor: Colors.blue, backgroundColor: Colors.blue + '06' },
  decOptionTop:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  decOptionLetter: { width: 22, height: 22, borderRadius: 7, backgroundColor: Colors.blue + '18', alignItems: 'center', justifyContent: 'center' },
  decOptionLetterText: { fontSize: 11, fontWeight: '800', color: Colors.blue },
  decOptionName:   { fontSize: 13, fontWeight: '700', color: Colors.text, flex: 1 },
  decPros:         { fontSize: 11, color: Colors.green },
  decCons:         { fontSize: 11, color: Colors.red },
  decFooter:       { flexDirection: 'row', gap: 16, padding: 12, backgroundColor: Colors.bg },
  decFooterText:   { fontSize: 11.5, color: Colors.text3 },

  // Typing indicator
  dotIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.blue },
  typingPhrase: { fontSize: 12, color: Colors.text3 },

  // Topic panel
  topicPanel:       { backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, padding: 14, gap: 10 },
  topicPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  topicPill:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg },
  topicPillText:    { fontSize: 12, fontWeight: '600', color: Colors.text3 },
  quickQ:           { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.surface, borderRadius: 10, padding: 11, borderWidth: 1 },
  quickQText:       { fontSize: 12.5, color: Colors.text, flex: 1, lineHeight: 18 },

  // Input
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  iconBtn:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  input:     { flex: 1, backgroundColor: Colors.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13.5, color: Colors.text, borderWidth: 1, borderColor: Colors.border, maxHeight: 110, lineHeight: 20 },
  sendBtn:   { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.bg },
  inputHint: { fontSize: 10, color: Colors.text3, textAlign: 'center', paddingBottom: 6, backgroundColor: Colors.surface },

  // Voice controls
  audioBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  audioBtnPlaying: { backgroundColor: Colors.red },
});