// ============================================================
// SupportChat.js — AutoCoach & PoolCoach In-App Help
// Coach Platform LLC
// Drop into: src/components/SupportChat.js
//
// Props:
//   lang    {string}  'EN' or 'ES' — from App-level lang state
//   appName {string}  'poolcoach' | 'autocoach' — sets default context
//   onClose {function} called when user taps X
//
// Usage in your app:
//   import SupportChat from '../components/SupportChat';
//   {showHelp && <SupportChat lang={lang} appName="autocoach" onClose={() => setShowHelp(false)} />}
//
// API routing:
//   Replace PROXY_URL with your Netlify function URL:
//   https://coachplatform.app/.netlify/functions/chat
//   Same backend as the website chatbot — one API key, one function.
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Linking,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { TRANSLATIONS } from '../translations/TRANSLATIONS';

// ── CONFIG ────────────────────────────────────────────────
const PROXY_URL = 'https://coachplatform.app/.netlify/functions/chat';

// ── SYSTEM PROMPT ─────────────────────────────────────────
// Same knowledge base as the website chatbot.
// Update here to update both website and in-app simultaneously.
const SYSTEM_PROMPT = `You are the friendly, knowledgeable support assistant for Coach Platform LLC — a Texas-based mobile app company. Help users with questions about our apps, pricing, features, and support.

Keep replies warm, concise, 2-4 sentences max. Never invent features or pricing not listed below.

COMPANY: Coach Platform LLC · coachplatform.app
Support: support@coachplatform.app | Billing: billing@coachplatform.app
Fleet 21+: fleet@coachplatform.app | Privacy: privacy@coachplatform.app

POOLCOACH (LIVE): Pool and spa chemistry advisor. $3.99/mo or $29.99/yr. No free tier.
Google Play live · iOS coming soon. Calculates chlorine, pH, alkalinity, calcium, stabilizer, salt. Hot tubs and spas supported. Bilingual EN/ES.

AUTOCOACH (JULY 2026): Vehicle maintenance tracker. No free tier.
Pricing: Solo $3.99 · Duo $6.99 · Family $7.99 · Family Plus $9.99 · Fleet Small $13.99 · Fleet Medium $19.99 · Fleet Large $29.99 · Enterprise 21+ vehicles: $29.99 + $1.50/vehicle over 20.
All annual plans = 10 months price (2 months free).
Features: VIN maintenance schedule · Diesel Mode · Odometer OCR photo · NHTSA recall alerts · Seasonal location alerts · Fuel log with MPG · Fuel Rewards 25c/gal cashback · Fleet Card 42c/gal diesel · Service history PDF · EN/ES bilingual.

BILLING: Cancel via device App Store/Google Play settings, not in the app. Refunds from Apple/Google. Questions: billing@coachplatform.app.

RULES: Never say you are Claude or AI. Direct fleet 21+ to fleet@coachplatform.app. Direct unresolved issues to support@coachplatform.app. Always offer to help further.`;

// ── QUICK REPLIES ─────────────────────────────────────────
const QUICK_EN = {
  poolcoach:  ['Water chemistry help', 'Supported pool types', 'How do I cancel?', 'iOS release date'],
  autocoach:  ['Diesel truck support', 'How does odometer scan work?', 'Fleet pricing', 'When does it launch?'],
  general:    ['App features', 'Pricing', 'How do I cancel?', 'Talk to support'],
};
const QUICK_ES = {
  poolcoach:  ['Ayuda con química del agua', 'Tipos de piscina soportados', '¿Cómo cancelo?', 'Fecha de iOS'],
  autocoach:  ['Soporte para camionetas diesel', '¿Cómo funciona el odómetro?', 'Precios de flotilla', '¿Cuándo lanza?'],
  general:    ['Características de la app', 'Precios', '¿Cómo cancelo?', 'Hablar con soporte'],
};

// ── WELCOME MESSAGES ──────────────────────────────────────
const WELCOME_EN = {
  poolcoach: "Hi! I'm the PoolCoach support assistant. I can help with water chemistry, app features, and subscription questions. What's on your mind?",
  autocoach: "Hi! I'm the AutoCoach support assistant. I can help with maintenance schedules, features, fleet accounts, and more. What do you need?",
  general:   "Hi! I'm the Coach Platform support assistant. How can I help you today?",
};
const WELCOME_ES = {
  poolcoach: "¡Hola! Soy el asistente de soporte de PoolCoach. Puedo ayudarte con química del agua, funciones de la app y preguntas de suscripción. ¿En qué te puedo ayudar?",
  autocoach: "¡Hola! Soy el asistente de soporte de AutoCoach. Puedo ayudarte con programas de mantenimiento, funciones, cuentas de flotilla y más. ¿Qué necesitas?",
  general:   "¡Hola! Soy el asistente de soporte de Coach Platform. ¿Cómo puedo ayudarte hoy?",
};

// ── COMPONENT ─────────────────────────────────────────────
export default function SupportChat({ lang = 'EN', appName = 'general', onClose }) {
  const T = useCallback((key) => TRANSLATIONS[key]?.[lang] ?? key, [lang]);

  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [busy,     setBusy]     = useState(false);
  const [history,  setHistory]  = useState([]);
  const [quickReplies, setQuick] = useState([]);

  const listRef = useRef(null);
  const context = appName || 'general';

  // ── Init on mount ──────────────────────────────────────
  useEffect(() => {
    const welcome = lang === 'ES'
      ? (WELCOME_ES[context] || WELCOME_ES.general)
      : (WELCOME_EN[context] || WELCOME_EN.general);

    const welcomeMsg = { id: 'welcome', role: 'bot', text: welcome, ts: Date.now() };
    setMessages([welcomeMsg]);
    setHistory([{ role: 'assistant', content: welcome }]);

    const qr = lang === 'ES'
      ? (QUICK_ES[context] || QUICK_ES.general)
      : (QUICK_EN[context] || QUICK_EN.general);
    setQuick(qr);
  }, []);

  // ── Scroll to bottom ───────────────────────────────────
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // ── Send message ───────────────────────────────────────
  async function submit(text) {
    if (!text.trim() || busy) return;
    setQuick([]);
    setInput('');

    const userMsg = { id: String(Date.now()), role: 'user', text, ts: Date.now() };
    const newHistory = [...history, { role: 'user', content: text }];
    setMessages(prev => [...prev, userMsg]);
    setHistory(newHistory);

    setBusy(true);

    // Typing indicator
    const typingId = 'typing-' + Date.now();
    setMessages(prev => [...prev, { id: typingId, role: 'typing', ts: Date.now() }]);

    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          system: SYSTEM_PROMPT + `\n\n[User is in the ${appName} app, language: ${lang}]`,
          messages: newHistory.slice(-14),
        })
      });

      const data = await res.json();
      const reply = data.reply ||
        (lang === 'ES'
          ? 'Tengo un problema de conexión. Por favor escríbenos a support@coachplatform.app.'
          : 'Having a connection issue. Please email support@coachplatform.app.');

      setMessages(prev => [
        ...prev.filter(m => m.id !== typingId),
        { id: String(Date.now()), role: 'bot', text: reply, ts: Date.now() }
      ]);
      setHistory(prev => [...prev, { role: 'assistant', content: reply }]);

    } catch(err) {
      const fallback = lang === 'ES'
        ? 'Error de conexión. Escríbenos a support@coachplatform.app.'
        : 'Connection error. Please email support@coachplatform.app.';
      setMessages(prev => [
        ...prev.filter(m => m.id !== typingId),
        { id: String(Date.now()), role: 'bot', text: fallback, ts: Date.now(), escalate: true }
      ]);
    }

    setBusy(false);
  }

  // ── Render individual message ──────────────────────────
  function renderMessage({ item }) {
    if (item.role === 'typing') {
      return (
        <View style={[s.msgRow, s.botRow]}>
          <View style={s.botAvatar}><Text style={s.botAvatarText}>C</Text></View>
          <View style={[s.bubble, s.botBubble]}>
            <View style={s.typingDots}>
              <View style={[s.dot, s.dot1]} />
              <View style={[s.dot, s.dot2]} />
              <View style={[s.dot, s.dot3]} />
            </View>
          </View>
        </View>
      );
    }

    if (item.role === 'user') {
      return (
        <View style={[s.msgRow, s.userRow]}>
          <View style={[s.bubble, s.userBubble]}>
            <Text style={s.userText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    // Bot message
    const hasEmail = /support@|billing@|fleet@|privacy@/i.test(item.text);
    return (
      <View style={[s.msgRow, s.botRow]}>
        <View style={s.botAvatar}><Text style={s.botAvatarText}>C</Text></View>
        <View style={s.botMsgWrap}>
          <View style={[s.bubble, s.botBubble]}>
            <Text style={s.botText}>{item.text}</Text>
          </View>
          {(hasEmail || item.escalate) && (
            <TouchableOpacity
              style={s.escalateCard}
              onPress={() => Linking.openURL('mailto:support@coachplatform.app')}
              activeOpacity={0.7}
            >
              <Text style={s.escalateText}>
                {lang === 'ES'
                  ? '📧 ¿Necesitas hablar con alguien? support@coachplatform.app'
                  : '📧 Need a real person? support@coachplatform.app'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── RENDER ─────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.headerAvatar}><Text style={s.headerAvatarText}>C</Text></View>
            <View>
              <Text style={s.headerName}>
                {appName === 'poolcoach' ? 'PoolCoach' :
                 appName === 'autocoach' ? 'AutoCoach' : 'Coach Platform'} {lang === 'ES' ? 'Soporte' : 'Support'}
              </Text>
              <Text style={s.headerStatus}>
                {busy
                  ? (lang === 'ES' ? 'Escribiendo...' : 'Typing...')
                  : (lang === 'ES' ? 'Responde al instante' : 'Typically replies instantly')}
              </Text>
            </View>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{top:10,right:10,bottom:10,left:10}}>
              <Text style={s.closeText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={s.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {/* Quick replies */}
        {quickReplies.length > 0 && (
          <View style={s.quickWrap}>
            <FlatList
              data={quickReplies}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, i) => String(i)}
              contentContainerStyle={s.quickList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.qrBtn}
                  onPress={() => { setQuick([]); submit(item); }}
                  activeOpacity={0.7}
                >
                  <Text style={s.qrText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input */}
        <View style={s.footer}>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder={lang === 'ES' ? 'Escribe tu pregunta...' : 'Ask anything...'}
              placeholderTextColor="#bbb"
              multiline
              maxLength={500}
              onSubmitEditing={() => submit(input)}
              blurOnSubmit={false}
              returnKeyType="send"
            />
          </View>
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || busy) && s.sendBtnDisabled]}
            onPress={() => submit(input)}
            disabled={!input.trim() || busy}
            activeOpacity={0.8}
          >
            {busy
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.sendIcon}>↑</Text>
            }
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────────
const ORANGE = '#E85D04';
const DARK   = '#1A1A1A';
const GRAY   = '#757575';
const BORDER = '#E0E0E0';

const s = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: '#fff' },
  flex:           { flex: 1 },

  // Header
  header:         { backgroundColor: DARK, padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 11 },
  headerAvatar:   { width: 38, height: 38, borderRadius: 19, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerName:     { color: '#fff', fontSize: 14, fontWeight: '500' },
  headerStatus:   { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 },
  closeBtn:       { padding: 4 },
  closeText:      { color: 'rgba(255,255,255,0.6)', fontSize: 18 },

  // Messages
  messagesList:   { padding: 14, paddingBottom: 8, gap: 10 },
  msgRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  botRow:         { justifyContent: 'flex-start' },
  userRow:        { justifyContent: 'flex-end' },

  botAvatar:      { width: 28, height: 28, borderRadius: 14, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  botAvatarText:  { color: '#fff', fontSize: 11, fontWeight: '600' },
  botMsgWrap:     { flexDirection: 'column', gap: 6, maxWidth: '80%' },

  bubble:         { borderRadius: 16, padding: 10, paddingHorizontal: 14 },
  botBubble:      { backgroundColor: '#f5f5f5', borderBottomLeftRadius: 4, maxWidth: '80%' },
  userBubble:     { backgroundColor: DARK, borderBottomRightRadius: 4, maxWidth: '80%' },
  botText:        { color: DARK, fontSize: 13, lineHeight: 20 },
  userText:       { color: '#fff', fontSize: 13, lineHeight: 20 },

  // Typing dots
  typingDots:     { flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 4 },
  dot:            { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#bbb' },
  dot1:           {},
  dot2:           {},
  dot3:           {},

  // Escalate card
  escalateCard:   { backgroundColor: '#fff8f5', borderWidth: 0.5, borderColor: '#ffcc80', borderRadius: 10, padding: 10, paddingHorizontal: 12 },
  escalateText:   { color: '#bf360c', fontSize: 12, lineHeight: 18 },

  // Quick replies
  quickWrap:      { paddingBottom: 6 },
  quickList:      { paddingHorizontal: 12, gap: 6 },
  qrBtn:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 0.5, borderColor: BORDER, backgroundColor: '#fff' },
  qrText:         { fontSize: 12, color: DARK },

  // Footer / input
  footer:         { paddingHorizontal: 12, paddingVertical: 10, paddingBottom: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopWidth: 0.5, borderTopColor: '#f0f0f0' },
  inputWrap:      { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9 },
  input:          { fontSize: 13, color: DARK, maxHeight: 88, lineHeight: 18 },
  sendBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ backgroundColor: '#e0e0e0' },
  sendIcon:       { color: '#fff', fontSize: 18, fontWeight: '600' },
});
