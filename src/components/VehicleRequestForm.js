// ============================================================
// VehicleRequestForm.js
// Coach Platform LLC — AutoCoach
// Drop into: src/components/VehicleRequestForm.js
//
// Shows when a user's vehicle is not found in the database.
// Submits request to autocoach@coachplatform.app via mailto
// and logs to AsyncStorage for tracking.
//
// Props:
//   lang         {string}   'EN' or 'ES'
//   prefilledYear {string}  optional — pre-fill from VIN decode
//   prefilledMake {string}  optional
//   prefilledModel{string}  optional
//   onClose      {function} called after successful submission
//
// Usage:
//   <VehicleRequestForm
//     lang={lang}
//     prefilledMake="BMW"
//     prefilledModel="X5"
//     prefilledYear="2017"
//     onClose={() => setShowRequest(false)}
//   />
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Linking, Platform,
  KeyboardAvoidingView, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── TRANSLATIONS ────────────────────────────────────────────
const T = {
  title:           { EN: "Don't see your vehicle?",          ES: "¿No ves tu vehículo?" },
  subtitle:        { EN: "Request it from our team. We review every request and prioritize by volume — vehicles with multiple requests are added first.", ES: "Solicítalo a nuestro equipo. Revisamos cada solicitud y priorizamos por volumen — los vehículos con más solicitudes se agregan primero." },
  year:            { EN: "Year",                              ES: "Año" },
  make:            { EN: "Make",                              ES: "Marca" },
  model:           { EN: "Model",                             ES: "Modelo" },
  engine:          { EN: "Engine (optional)",                 ES: "Motor (opcional)" },
  engine_ph:       { EN: "e.g. 3.5L V6, 2.0L Turbo",        ES: "p. ej. 3.5L V6, 2.0L Turbo" },
  email:           { EN: "Your email (optional)",             ES: "Tu correo electrónico (opcional)" },
  email_ph:        { EN: "We'll notify you when it's added", ES: "Te avisaremos cuando se agregue" },
  notes:           { EN: "Anything else? (optional)",         ES: "¿Algo más? (opcional)" },
  notes_ph:        { EN: "e.g. diesel, AWD, lifted, fleet vehicle", ES: "p. ej. diesel, tracción total, elevado, vehículo de flotilla" },
  year_ph:         { EN: "e.g. 2017",                        ES: "p. ej. 2017" },
  make_ph:         { EN: "e.g. Ford, Toyota, BMW",           ES: "p. ej. Ford, Toyota, BMW" },
  model_ph:        { EN: "e.g. F-150, Camry, 3 Series",     ES: "p. ej. F-150, Camry, Serie 3" },
  submit:          { EN: "Submit vehicle request",            ES: "Enviar solicitud de vehículo" },
  cancel:          { EN: "Cancel",                            ES: "Cancelar" },
  required:        { EN: "Year, make, and model are required.", ES: "El año, la marca y el modelo son obligatorios." },
  success_title:   { EN: "Request received",                  ES: "Solicitud recibida" },
  success_body:    { EN: "Thank you — we'll review your request and notify you when your vehicle is added to AutoCoach.", ES: "Gracias — revisaremos tu solicitud y te notificaremos cuando tu vehículo sea agregado a AutoCoach." },
  success_btn:     { EN: "Got it",                            ES: "Entendido" },
  note:            { EN: "Requests are reviewed weekly. Vehicles with the most requests are prioritized.", ES: "Las solicitudes se revisan semanalmente. Los vehículos con más solicitudes son priorizados." },
  already_title:   { EN: "Already requested",                 ES: "Ya solicitado" },
  already_body:    { EN: "You already submitted a request for this vehicle. We'll notify you when it's added.", ES: "Ya enviaste una solicitud para este vehículo. Te notificaremos cuando se agregue." },
};

function t(key, lang) {
  return T[key]?.[lang] ?? T[key]?.EN ?? key;
}

// ── COMPONENT ───────────────────────────────────────────────
export default function VehicleRequestForm({
  lang = 'EN',
  prefilledYear = '',
  prefilledMake = '',
  prefilledModel = '',
  onClose,
}) {
  const [year,    setYear]    = useState(prefilledYear);
  const [make,    setMake]    = useState(prefilledMake);
  const [model,   setModel]   = useState(prefilledModel);
  const [engine,  setEngine]  = useState('');
  const [email,   setEmail]   = useState('');
  const [notes,   setNotes]   = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Submit handler ────────────────────────────────────────
  async function handleSubmit() {
    if (!year.trim() || !make.trim() || !model.trim()) {
      Alert.alert('', t('required', lang));
      return;
    }

    setLoading(true);

    const vehicleKey = `${year.trim()}_${make.trim().toLowerCase()}_${model.trim().toLowerCase()}`;

    // Check if already requested
    try {
      const existing = await AsyncStorage.getItem(`vehicle_request_${vehicleKey}`);
      if (existing) {
        Alert.alert(t('already_title', lang), t('already_body', lang));
        setLoading(false);
        return;
      }
    } catch (e) { /* continue */ }

    // Build email
    const subject = encodeURIComponent(
      `AutoCoach Vehicle Request — ${year} ${make} ${model}`
    );
    const body = encodeURIComponent(
      `Vehicle Request\n\n` +
      `Year: ${year}\n` +
      `Make: ${make}\n` +
      `Model: ${model}\n` +
      `Engine: ${engine || 'Not specified'}\n` +
      `User email: ${email || 'Not provided'}\n` +
      `Notes: ${notes || 'None'}\n\n` +
      `Submitted via AutoCoach app\n` +
      `Language: ${lang}`
    );

    const mailURL = `mailto:autocoach@coachplatform.app?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailURL);
      if (canOpen) {
        await Linking.openURL(mailURL);
      }
      // Save locally regardless of email client availability
      await AsyncStorage.setItem(`vehicle_request_${vehicleKey}`, JSON.stringify({
        year, make, model, engine, email, notes,
        submittedAt: new Date().toISOString(),
        lang,
      }));
      setSubmitted(true);
    } catch (err) {
      console.error('Vehicle request error:', err);
      // Still mark as submitted — save the request locally
      try {
        await AsyncStorage.setItem(`vehicle_request_${vehicleKey}`, JSON.stringify({
          year, make, model, engine, email, notes,
          submittedAt: new Date().toISOString(),
          lang,
        }));
      } catch (e) { /* silent */ }
      setSubmitted(true);
    }

    setLoading(false);
  }

  // ── Success state ─────────────────────────────────────────
  if (submitted) {
    return (
      <View style={s.successWrap}>
        <Text style={s.successIcon}>✅</Text>
        <Text style={s.successTitle}>{t('success_title', lang)}</Text>
        <Text style={s.successBody}>{t('success_body', lang)}</Text>
        <TouchableOpacity
          style={s.successBtn}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={s.successBtnText}>{t('success_btn', lang)}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Form ──────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.flex}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={s.title}>{t('title', lang)}</Text>
        <Text style={s.subtitle}>{t('subtitle', lang)}</Text>

        {/* Year + Make row */}
        <View style={s.row}>
          <View style={s.halfField}>
            <Text style={s.label}>{t('year', lang)}</Text>
            <TextInput
              style={s.input}
              value={year}
              onChangeText={setYear}
              placeholder={t('year_ph', lang)}
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="next"
            />
          </View>
          <View style={s.halfField}>
            <Text style={s.label}>{t('make', lang)}</Text>
            <TextInput
              style={s.input}
              value={make}
              onChangeText={setMake}
              placeholder={t('make_ph', lang)}
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Model + Engine row */}
        <View style={s.row}>
          <View style={s.halfField}>
            <Text style={s.label}>{t('model', lang)}</Text>
            <TextInput
              style={s.input}
              value={model}
              onChangeText={setModel}
              placeholder={t('model_ph', lang)}
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
          <View style={s.halfField}>
            <Text style={s.label}>{t('engine', lang)}</Text>
            <TextInput
              style={s.input}
              value={engine}
              onChangeText={setEngine}
              placeholder={t('engine_ph', lang)}
              placeholderTextColor={COLORS.textMuted}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Email */}
        <Text style={s.label}>{t('email', lang)}</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          placeholder={t('email_ph', lang)}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        {/* Notes */}
        <Text style={s.label}>{t('notes', lang)}</Text>
        <TextInput
          style={[s.input, s.textarea]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('notes_ph', lang)}
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          returnKeyType="done"
        />

        {/* Note */}
        <Text style={s.note}>{t('note', lang)}</Text>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, loading && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={s.submitBtnText}>
            {loading ? '...' : t('submit', lang)}
          </Text>
        </TouchableOpacity>

        {/* Cancel */}
        {onClose && (
          <TouchableOpacity
            style={s.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={s.cancelBtnText}>{t('cancel', lang)}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── COLORS ───────────────────────────────────────────────────
const COLORS = {
  primary:    '#1A2744',
  accent:     '#E85D04',
  bodyBg:     '#F2F2F7',
  cardBg:     '#FFFFFF',
  border:     '#E5E5EA',
  textPrimary:'#1C1C1E',
  textNavy:   '#1A2744',
  textMuted:  '#8E8E93',
};

// ── STYLES ───────────────────────────────────────────────────
const s = StyleSheet.create({
  flex:             { flex: 1 },
  scroll:           { flex: 1, backgroundColor: COLORS.bodyBg },
  scrollContent:    { padding: 20, paddingBottom: 40 },

  title:            { fontSize: 20, fontWeight: '600', color: COLORS.textNavy, marginBottom: 8 },
  subtitle:         { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: 20 },

  row:              { flexDirection: 'row', gap: 10, marginBottom: 0 },
  halfField:        { flex: 1 },

  label:            { fontSize: 12, fontWeight: '500', color: COLORS.textMuted, marginBottom: 5, marginTop: 12, letterSpacing: 0.3 },

  input:            {
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  textarea:         { height: 72, paddingTop: 10 },

  note:             {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 14,
    marginBottom: 20,
    lineHeight: 16,
    fontStyle: 'italic',
  },

  submitBtn:        {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitBtnDisabled:{ backgroundColor: COLORS.border },
  submitBtnText:    { color: '#fff', fontSize: 15, fontWeight: '600' },

  cancelBtn:        {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  cancelBtnText:    { color: COLORS.textMuted, fontSize: 14 },

  // Success state
  successWrap:      {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon:      { fontSize: 48, marginBottom: 16 },
  successTitle:     { fontSize: 20, fontWeight: '600', color: COLORS.textNavy, marginBottom: 10, textAlign: 'center' },
  successBody:      { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  successBtn:       {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 40,
  },
  successBtnText:   { color: '#fff', fontSize: 15, fontWeight: '500' },
});
