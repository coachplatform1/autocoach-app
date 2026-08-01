import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, Platform, ScrollView,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS } from './src/translations/TRANSLATIONS';
import { COLORS } from './src/constants/colors';
import { decodeVIN, getMaintenanceSchedule } from './src/data/vehicleDatabase';

export default function App() {
  const [lang, setLang]                   = useState('EN');
  const [vehicles, setVehicles]           = useState([]);
  const [activeTab, setActiveTab]         = useState('garage');
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [isPro, setIsPro]                 = useState(false);
  const [vehicleLimit, setVehicleLimit]   = useState(0);

  const T = (key) => TRANSLATIONS[key]?.[lang] ?? key;

  // ── Load saved data ──────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('autocoach_lang').then(saved => {
      if (saved) setLang(saved);
    });
    AsyncStorage.getItem('autocoach_vehicles').then(saved => {
      if (saved) setVehicles(JSON.parse(saved));
    });
  }, []);

  // ── Save vehicles ────────────────────────────
  function saveVehicles(updated) {
    setVehicles(updated);
    AsyncStorage.setItem('autocoach_vehicles', JSON.stringify(updated));
  }

  // ── Toggle language ──────────────────────────
  function toggleLang() {
    const newLang = lang === 'EN' ? 'ES' : 'EN';
    setLang(newLang);
    AsyncStorage.setItem('autocoach_lang', newLang);
  }

  // ── Add vehicle ──────────────────────────────
  function addVehicle(vehicle) {
    const updated = [...vehicles, vehicle];
    saveVehicles(updated);
    setActiveVehicle(vehicle);
    setActiveTab('garage');
  }

  // ─────────────────────────────────────────────
  // SCREEN ROUTER
  // ─────────────────────────────────────────────
  function renderScreen() {
    switch (activeTab) {
      case 'garage':     return <GarageScreen />;
      case 'schedule':   return <PlaceholderScreen label={T('nav_schedule')} />;
      case 'shop':       return <PlaceholderScreen label={T('nav_shop')} />;
      case 'history':    return <PlaceholderScreen label={T('nav_history')} />;
      case 'fuel':       return <PlaceholderScreen label={T('nav_fuel')} />;
      case 'addVehicle': return <AddVehicleScreen />;
      default:           return <GarageScreen />;
    }
  }

  // ─────────────────────────────────────────────
  // GARAGE SCREEN
  // ─────────────────────────────────────────────
  function GarageScreen() {
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>

        {/* Quick Stats */}
        <View style={s.statRow}>
          <View style={s.statCard}>
            <Text style={s.statVal}>{vehicles.length}</Text>
            <Text style={s.statLabel}>{T('garage_stat_vehicles')}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statVal}>0</Text>
            <Text style={s.statLabel}>{T('garage_stat_due')}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statVal}>$0</Text>
            <Text style={s.statLabel}>{T('garage_stat_saved')}</Text>
          </View>
        </View>

        {/* Empty state */}
        {vehicles.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>🚗</Text>
            <Text style={s.emptyTitle}>{T('garage_no_vehicles_title')}</Text>
            <Text style={s.emptyBody}>{T('garage_no_vehicles_body')}</Text>
            <TouchableOpacity
              style={s.addVehicleBtn}
              onPress={() => setActiveTab('addVehicle')}
            >
              <Text style={s.addVehicleBtnText}>+ {T('garage_add_vehicle')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map((vehicle, index) => (
            <TouchableOpacity
              key={index}
              style={s.vehicleCard}
              onPress={() => {
                setActiveVehicle(vehicle);
                setActiveTab('schedule');
              }}
            >
              <View style={s.vehicleCardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={s.vehicleName}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </Text>
                  <Text style={s.vehicleSub}>
                    {vehicle.engine} · {vehicle.mileage
                      ? Number(vehicle.mileage).toLocaleString() + ' mi'
                      : '—'}
                  </Text>
                </View>
                <View style={s.badgeOk}>
                  <Text style={s.badgeOkText}>{T('garage_all_current')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Add vehicle button when vehicles exist */}
        {vehicles.length > 0 && (
          <TouchableOpacity
            style={s.addVehicleBtnSecondary}
            onPress={() => setActiveTab('addVehicle')}
          >
            <Text style={s.addVehicleBtnSecondaryText}>
              + {T('garage_add_vehicle')}
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // ADD VEHICLE SCREEN
  // ─────────────────────────────────────────────
  function AddVehicleScreen() {
    const [mode, setMode]           = useState('vin'); // 'vin' or 'manual'
    const [vin, setVin]             = useState('');
    const [vinLoading, setVinLoading] = useState(false);
    const [vinResult, setVinResult] = useState(null);
    const [year, setYear]           = useState('');
    const [make, setMake]           = useState('');
    const [model, setModel]         = useState('');
    const [engine, setEngine]       = useState('');
    const [mileage, setMileage]     = useState('');
    const [nickname, setNickname]   = useState('');

    async function lookupVIN() {
      if (vin.length < 17) {
        Alert.alert('', T('add_vehicle_vin_invalid'));
        return;
      }
      setVinLoading(true);
      try {
        const result = await decodeVIN(vin);
        if (result && result.isValid) {
          setVinResult(result);
          setYear(result.year);
          setMake(result.make);
          setModel(result.model);
          setEngine(result.engine);
          setMode('manual'); // switch to confirm/edit mode
        } else {
          Alert.alert('', T('add_vehicle_vin_invalid'));
        }
      } catch (e) {
        Alert.alert('', T('error_network'));
      }
      setVinLoading(false);
    }

    function handleAdd() {
      if (!year || !make || !model) {
        Alert.alert('', T('required'));
        return;
      }
      const vehicle = {
        vin: vin || null,
        year, make, model, engine,
        mileage: mileage ? parseInt(mileage.replace(/,/g, '')) : null,
        nickname: nickname || null,
        addedAt: new Date().toISOString(),
      };
      addVehicle(vehicle);
    }

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>

          {/* Back button */}
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => setActiveTab('garage')}
          >
            <Text style={s.backBtnText}>← {T('btn_back')}</Text>
          </TouchableOpacity>

          <Text style={s.screenTitle}>{T('add_vehicle_title')}</Text>

          {/* Mode toggle */}
          <View style={s.modeToggle}>
            <TouchableOpacity
              style={[s.modeBtn, mode === 'vin' && s.modeBtnActive]}
              onPress={() => setMode('vin')}
            >
              <Text style={[s.modeBtnText, mode === 'vin' && s.modeBtnTextActive]}>
                VIN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modeBtn, mode === 'manual' && s.modeBtnActive]}
              onPress={() => setMode('manual')}
            >
              <Text style={[s.modeBtnText, mode === 'manual' && s.modeBtnTextActive]}>
                {T('add_vehicle_or').replace('—', '').replace('or', '').trim() || 'Manual'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* VIN entry */}
          {mode === 'vin' && (
            <View style={s.card}>
              <Text style={s.fieldLabel}>{T('add_vehicle_vin_label')}</Text>
              <TextInput
                style={s.input}
                value={vin}
                onChangeText={t => setVin(t.toUpperCase())}
                placeholder={T('add_vehicle_vin_placeholder')}
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
                maxLength={17}
              />
              <TouchableOpacity
                style={[s.primaryBtn, vinLoading && { opacity: 0.6 }]}
                onPress={lookupVIN}
                disabled={vinLoading}
              >
                {vinLoading
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={s.primaryBtnText}>{T('add_vehicle_vin_label').split('(')[0].trim()}</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('manual')} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ color: COLORS.accent, fontSize: 13 }}>{T('add_vehicle_or')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Manual / confirm entry */}
          {mode === 'manual' && (
            <View style={s.card}>
              {vinResult && (
                <View style={s.vinVerifiedBadge}>
                  <Text style={s.vinVerifiedText}>✓ {T('add_vehicle_vin_verified')}</Text>
                </View>
              )}

              <View style={s.fieldRow}>
                <View style={s.fieldHalf}>
                  <Text style={s.fieldLabel}>{T('add_vehicle_year')}</Text>
                  <TextInput
                    style={s.input}
                    value={year}
                    onChangeText={setYear}
                    placeholder="2018"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
                <View style={s.fieldHalf}>
                  <Text style={s.fieldLabel}>{T('add_vehicle_make')}</Text>
                  <TextInput
                    style={s.input}
                    value={make}
                    onChangeText={setMake}
                    placeholder="Ford"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={s.fieldRow}>
                <View style={s.fieldHalf}>
                  <Text style={s.fieldLabel}>{T('add_vehicle_model')}</Text>
                  <TextInput
                    style={s.input}
                    value={model}
                    onChangeText={setModel}
                    placeholder="F-250"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="words"
                  />
                </View>
                <View style={s.fieldHalf}>
                  <Text style={s.fieldLabel}>{T('add_vehicle_engine')}</Text>
                  <TextInput
                    style={s.input}
                    value={engine}
                    onChangeText={setEngine}
                    placeholder="6.7L"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>

              <Text style={s.fieldLabel}>{T('add_vehicle_odometer_label')}</Text>
              <TextInput
                style={s.input}
                value={mileage}
                onChangeText={setMileage}
                placeholder="94,210"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
              />

              <Text style={s.fieldLabel}>{T('add_vehicle_nickname_label')}</Text>
              <TextInput
                style={s.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder={T('add_vehicle_nickname_placeholder')}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          )}

          {/* Add button */}
          {mode === 'manual' && (
            <TouchableOpacity style={s.primaryBtn} onPress={handleAdd}>
              <Text style={s.primaryBtnText}>{T('add_vehicle_cta')}</Text>
            </TouchableOpacity>
          )}

          {/* Don't see your vehicle */}
          <TouchableOpacity
            style={s.requestVehicleBtn}
            onPress={() => Alert.alert(
              T('add_vehicle_title'),
              lang === 'EN'
                ? "Don't see your vehicle? Email us at autocoach@coachplatform.app and we'll add it."
                : "¿No ves tu vehículo? Escríbenos a autocoach@coachplatform.app y lo agregaremos."
            )}
          >
            <Text style={s.requestVehicleBtnText}>
              {lang === 'EN' ? "Don't see your vehicle? Request it →" : "¿No ves tu vehículo? Solicítalo →"}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────
  // PLACEHOLDER SCREEN
  // ─────────────────────────────────────────────
  function PlaceholderScreen({ label }) {
    return (
      <View style={s.placeholder}>
        <Text style={s.placeholderIcon}>🔧</Text>
        <Text style={s.placeholderText}>{label}</Text>
        <Text style={s.placeholderSub}>AutoCoach — Coming soon</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>{T('appName')}</Text>
          <Text style={s.headerSub}>
            {vehicles.length} {T('garage_stat_vehicles')}
          </Text>
        </View>
        <TouchableOpacity style={s.langBtn} onPress={toggleLang}>
          <Text style={s.langBtnText}>
            {lang === 'EN' ? 'EN | ES' : 'ES | EN'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <View style={s.screenWrap}>
        {renderScreen()}
      </View>

      {/* Bottom Navigation */}
      <View style={s.bottomNav}>
        {[
          { key: 'garage',   label: T('nav_garage'),   icon: '🏠' },
          { key: 'schedule', label: T('nav_schedule'),  icon: '📅' },
          { key: 'shop',     label: T('nav_shop'),      icon: '🛒' },
          { key: 'history',  label: T('nav_history'),   icon: '📋' },
          { key: 'fuel',     label: T('nav_fuel'),      icon: '⛽' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={s.navItem}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.navIcon, activeTab === tab.key && s.navIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[s.navLabel, activeTab === tab.key && s.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: COLORS.primary },
  screenWrap:     { flex: 1, backgroundColor: COLORS.bodyBg },
  screen:         { flex: 1, backgroundColor: COLORS.bodyBg },
  screenContent:  { padding: 14, paddingBottom: 40 },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle:    { color: COLORS.white, fontSize: 20, fontWeight: '600' },
  headerSub:      { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 1 },
  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  langBtnText:    { color: COLORS.white, fontSize: 11, fontWeight: '600' },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  navItem:        { flex: 1, alignItems: 'center', gap: 3 },
  navIcon:        { fontSize: 22, opacity: 0.4 },
  navIconActive:  { opacity: 1 },
  navLabel:       { fontSize: 10, color: COLORS.navInactive },
  navLabelActive: { color: COLORS.accentDark, fontWeight: '600' },

  // Placeholder
  placeholder:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bodyBg },
  placeholderIcon:  { fontSize: 48, marginBottom: 12 },
  placeholderText:  { fontSize: 24, fontWeight: '600', color: COLORS.primary, marginBottom: 6 },
  placeholderSub:   { fontSize: 14, color: COLORS.textMuted },

  // Stats
  statRow:    { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard:   { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border, padding: 10, alignItems: 'center' },
  statVal:    { fontSize: 20, fontWeight: '600', color: COLORS.accent },
  statLabel:  { fontSize: 10, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },

  // Empty state
  emptyWrap:  { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon:  { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textNavy, marginBottom: 8, textAlign: 'center' },
  emptyBody:  { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 28 },

  // Buttons
  addVehicleBtn:          { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 32 },
  addVehicleBtnText:      { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  addVehicleBtnSecondary: { borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  addVehicleBtnSecondaryText: { color: COLORS.textMuted, fontSize: 14 },
  primaryBtn:     { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },

  // Vehicle cards
  vehicleCard:       { backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  vehicleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vehicleName:       { fontSize: 15, fontWeight: '600', color: COLORS.textNavy },
  vehicleSub:        { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  badgeOk:           { backgroundColor: COLORS.okBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeOkText:       { fontSize: 11, color: COLORS.okText, fontWeight: '500' },

  // Add Vehicle screen
  backBtn:        { marginBottom: 16 },
  backBtnText:    { color: COLORS.accent, fontSize: 14, fontWeight: '500' },
  screenTitle:    { fontSize: 22, fontWeight: '700', color: COLORS.textNavy, marginBottom: 18 },
  modeToggle:     { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 16 },
  modeBtn:        { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.bodyBg },
  modeBtnActive:  { backgroundColor: COLORS.primary },
  modeBtnText:    { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  modeBtnTextActive: { color: COLORS.white },
  card:           { backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 16, marginBottom: 14 },
  fieldRow:       { flexDirection: 'row', gap: 10 },
  fieldHalf:      { flex: 1 },
  fieldLabel:     { fontSize: 12, fontWeight: '500', color: COLORS.textMuted, marginBottom: 5, marginTop: 12 },
  input: {
    backgroundColor: COLORS.bodyBg,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  vinVerifiedBadge:  { backgroundColor: COLORS.okBg, borderRadius: 8, padding: 8, marginBottom: 4, alignItems: 'center' },
  vinVerifiedText:   { color: COLORS.okText, fontSize: 13, fontWeight: '600' },
  requestVehicleBtn: { marginTop: 20, alignItems: 'center', paddingVertical: 14 },
  requestVehicleBtnText: { color: COLORS.accent, fontSize: 13, fontWeight: '500' },
});
