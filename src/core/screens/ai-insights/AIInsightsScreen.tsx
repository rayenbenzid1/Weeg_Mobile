import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

const insightCards = [
  { icon: 'trending-up-outline', title: 'Sales Prediction', value: '+18%', desc: 'Expected growth next month based on seasonal patterns', color: Colors.success, bg: Colors.green50 },
  { icon: 'warning-outline', title: 'Churn Risk', value: '3 clients', desc: 'Customers with high risk of churning this quarter', color: Colors.danger, bg: Colors.red50 },
  { icon: 'cube-outline', title: 'Inventory Alert', value: '2 products', desc: 'Below minimum stock threshold, reorder recommended', color: Colors.warning, bg: Colors.yellow50 },
  { icon: 'bar-chart-outline', title: 'Top Opportunity', value: 'AirPods Pro', desc: 'High demand detected, increase stock by 40%', color: Colors.indigo600, bg: Colors.indigo50 },
];

const initialMessages = [
  { id: '1', role: 'ai' as const, text: "Hello! I'm your AI business assistant. I can help you analyze your data, provide insights, and answer questions about your business performance. How can I assist you today?", time: '10:30 AM' },
  { id: '2', role: 'manager' as const, text: "Can you explain why sales dropped in the North Branch last week?", time: '10:32 AM' },
  { id: '3', role: 'ai' as const, text: "Based on my analysis, the North Branch experienced a 15% sales decline last week due to three main factors:\n\n1) Inventory shortage of top-selling items (Laptops and AirPods)\n2) A competitor opened nearby with promotional pricing\n3) Reduced foot traffic due to local construction\n\nI recommend restocking priority items and implementing a targeted promotion to recover market share.", time: '10:32 AM' },
];

const quickQuestions = [
  'What are my top performing products?',
  'Which customers have high risk scores?',
  'Show me inventory optimization tips',
  'Predict next month sales',
];

const aiResponses = [
  'Based on your sales data, Laptop Dell XPS 15 and iPhone 15 Pro are your top performers with combined revenue of $485K this quarter.',
  'I\'ve identified 3 customers with risk scores above 80: Tech Solutions Inc (85), Global Trade Corp (91), and Mega Electronics (77). Consider reviewing their credit terms.',
  'For inventory optimization, I recommend: 1) Reorder Desk Office Chair immediately (5 units below minimum), 2) Reduce LG OLED TV stock by 20%, 3) Increase AirPods Pro stock by 40% ahead of seasonal demand.',
  'Based on seasonal patterns and current trends, I predict $4.2M in sales next month — approximately 9% growth. Key drivers: increased electronics demand and Q4 seasonality.',
];

export function AIInsightsScreen() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  let responseIndex = 0;

  const sendMessage = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    const newMsg = { id: Date.now().toString(), role: 'manager' as const, text: msg, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const resp = { id: (Date.now() + 1).toString(), role: 'ai' as const, text: aiResponses[responseIndex % aiResponses.length], time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) };
      responseIndex++;
      setMessages(prev => [...prev, resp]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.container}>

        {/* Page Header */}
        <View style={styles.header}>
          <LinearGradient colors={[Colors.indigo600, Colors.violet600]} style={styles.headerIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="sparkles" size={22} color="white" />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>AI Insights</Text>
            <Text style={styles.headerSubtitle}>Intelligent business analysis</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Insight Cards */}
          <View style={styles.insightSection}>
            <Text style={styles.sectionTitle}>Key Predictions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {insightCards.map((card, i) => (
                <View key={i} style={[styles.insightCard, { backgroundColor: card.bg }, Shadow.sm]}>
                  <View style={[styles.insightIcon, { backgroundColor: card.color + '20' }]}>
                    <Ionicons name={card.icon as any} size={22} color={card.color} />
                  </View>
                  <Text style={[styles.insightValue, { color: card.color }]}>{card.value}</Text>
                  <Text style={styles.insightTitle}>{card.title}</Text>
                  <Text style={styles.insightDesc}>{card.desc}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Quick Questions */}
          <View style={styles.quickSection}>
            <Text style={styles.sectionTitle}>Quick Questions</Text>
            <View style={styles.quickGrid}>
              {quickQuestions.map((q, i) => (
                <TouchableOpacity key={i} onPress={() => sendMessage(q)} style={[styles.quickBtn, Shadow.sm]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.indigo600} />
                  <Text style={styles.quickBtnText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Chat */}
          <View style={styles.chatSection}>
            <Text style={styles.sectionTitle}>AI Business Chat</Text>
            <View style={[styles.chatContainer, Shadow.md]}>
              {messages.map(msg => (
                <View key={msg.id} style={[styles.msgRow, msg.role === 'manager' && styles.msgRowRight]}>
                  {msg.role === 'ai' && (
                    <LinearGradient colors={[Colors.indigo600, Colors.violet600]} style={styles.aiAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Ionicons name="sparkles" size={12} color="white" />
                    </LinearGradient>
                  )}
                  <View style={[styles.msgBubble, msg.role === 'ai' ? styles.aiBubble : styles.managerBubble]}>
                    <Text style={[styles.msgText, msg.role === 'manager' && styles.msgTextWhite]}>{msg.text}</Text>
                    <Text style={[styles.msgTime, msg.role === 'manager' && styles.msgTimeWhite]}>{msg.time}</Text>
                  </View>
                </View>
              ))}
              {isTyping && (
                <View style={styles.msgRow}>
                  <LinearGradient colors={[Colors.indigo600, Colors.violet600]} style={styles.aiAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="sparkles" size={12} color="white" />
                  </LinearGradient>
                  <View style={styles.aiBubble}>
                    <Text style={styles.typingText}>AI is analyzing...</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

        </ScrollView>

        {/* Chat Input */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.chatInput}
            placeholder="Ask AI about your business..."
            placeholderTextColor={Colors.gray400}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity onPress={() => sendMessage()} disabled={!input.trim()}>
            <LinearGradient
              colors={input.trim() ? [Colors.indigo600, Colors.violet600] : [Colors.gray200, Colors.gray300]}
              style={styles.sendBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="send" size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.base, paddingTop: 20, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  headerIcon: { width: 44, height: 44, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.foreground },
  headerSubtitle: { fontSize: 12, color: Colors.gray500, marginTop: 1 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.foreground, marginBottom: 14 },

  insightSection: { padding: Spacing.base, paddingBottom: 0 },
  insightCard: { width: 170, borderRadius: BorderRadius.xl, padding: 16, marginRight: 12, borderWidth: 1, borderColor: Colors.gray100 },
  insightIcon: { width: 40, height: 40, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  insightValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  insightTitle: { fontSize: 13, fontWeight: '700', color: Colors.foreground, marginBottom: 4 },
  insightDesc: { fontSize: 11, color: Colors.gray500, lineHeight: 16 },

  quickSection: { padding: Spacing.base, paddingBottom: 0 },
  quickGrid: { gap: 8 },
  quickBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: 14, borderWidth: 1, borderColor: Colors.indigo100 },
  quickBtnText: { fontSize: 13, color: Colors.indigo600, fontWeight: '500', flex: 1 },

  chatSection: { padding: Spacing.base },
  chatContainer: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 16, borderWidth: 1, borderColor: Colors.gray100 },

  msgRow: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-end' },
  msgRowRight: { flexDirection: 'row-reverse' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgBubble: { flex: 1, maxWidth: '80%', borderRadius: BorderRadius.xl, padding: 12 },
  aiBubble: { backgroundColor: Colors.gray50, borderWidth: 1, borderColor: Colors.gray100, borderBottomLeftRadius: 4 },
  managerBubble: { backgroundColor: Colors.indigo600, borderBottomRightRadius: 4 },
  msgText: { fontSize: 13, color: Colors.foreground, lineHeight: 20 },
  msgTextWhite: { color: Colors.white },
  msgTime: { fontSize: 10, color: Colors.gray400, marginTop: 4, textAlign: 'right' },
  msgTimeWhite: { color: 'rgba(255,255,255,0.7)' },
  typingText: { fontSize: 13, color: Colors.gray400, fontStyle: 'italic' },

  inputArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: Spacing.base, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  chatInput: { flex: 1, backgroundColor: Colors.gray50, borderRadius: BorderRadius.xl, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: Colors.foreground, borderWidth: 1, borderColor: Colors.gray200, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
