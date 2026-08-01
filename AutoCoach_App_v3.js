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
import { decodeVIN, getMaintenanceSchedule, calculateDueServices } from './src/data/vehicleDatabase';

export default function App() {
  const [lang, setLang]                   = useState('EN');
  const [vehicles, setVehicles]           = useState([]);
  const [activeTab, setActiveTab]         = useState('garage');
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [serviceHistory, setServiceHistory] = useState({});
  const [isPro, setIsPro]                 = useState(false);
  const [vehicleLimit, setVehicleLimit]   = useState(0);

  const T = (key) => TRANSLATIONS[key]?.[lang] ?? key;

  // ── Load saved data ──────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('autocoach_lang').then(s => { if (s) setLang(s); });
    AsyncStorage.getItem('autocoach_vehicles').then(s => { if (s) setVehicles(JSON.parse(s)); });
    AsyncStorage.getItem('autocoach_service_history').then(s => { if (s) setServiceHistory(JSON.parse(s)); });
  }, []);

  function saveVehicles(updated) {
    setVehicles(updated);
    AsyncStorage.setItem('autocoach_vehicles', JSON.stringify(updated));
  }

  function toggleLang() {
    const n = lang === 'EN' ? 'ES' : 'EN';
    setLang(n);
    AsyncStorage.setItem('autocoach_lang', n);
  }

  function addVehicle(vehicle) {
    const updated = [...vehicles, vehicle];
    saveVehicles(updated);
    setActiveVehicle(vehicle);
    setActiveTab('garage');
  }

  // ── Log a service ────────────────────────────
  function logService(vehicleKey, serviceId, mileage) {
    const updated = {
      ...serviceHistory,
      [vehicleKey]: {
        ...(serviceHistory[vehicleKey] || {}),
        [serviceId]: {
          lastMileage: mileage,
          lastDate: new Date().toISOString(),
        }
      }
    };
    setServiceHistory(updated);
    AsyncStorage.setItem('autocoach_service_history', JSON.stringify(updated));
  }

  // ─────────────────────────────────────────────
  // SCREEN ROUTER
  // ─────────────────────────────────────────────
  function renderScreen() {
    switch (activeTab) {
      case 'garage':     return <GarageScreen />;
      case 'schedule':   return <ScheduleScreen />;
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
    // Count overdue services across all vehicles
    let totalDue = 0;
    vehicles.forEach(v => {
      const schedule = getMaintenanceSchedule(v.make, v.model, v.engine);
      if (schedule && v.mileage) {
        const vKey = `${v.year}_${v.make}_${v.model}`;
        const due = calculateDueServices(schedule.services, Number(v.mileage), serviceHistory[vKey] || {});
        totalDue += due.filter(s => s.status === 'overdue' || s.status === 'due_soon').length;
      }
    });

    return (
      <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>

        <View style={s.statRow}>
          <View style={s.statCard}>
            <Text style={s.statVal}>{vehicles.length}</Text>
            <Text style={s.statLabel}>{T('garage_stat_vehicles')}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statVal, totalDue > 0 && { color: COLORS.accentDark }]}>{totalDue}</Text>
            <Text style={s.statLabel}>{T('garage_stat_due')}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statVal}>$0</Text>
            <Text style={s.statLabel}>{T('garage_stat_saved')}</Text>
          </View>
        </View>

        {vehicles.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>🚗</Text>
            <Text style={s.emptyTitle}>{T('garage_no_vehicles_title')}</Text>
            <Text style={s.emptyBody}>{T('garage_no_vehicles_body')}</Text>
            <TouchableOpacity style={s.addVehicleBtn} onPress={() => setActiveTab('addVehicle')}>
              <Text style={s.addVehicleBtnText}>+ {T('garage_add_vehicle')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map((vehicle, index) => {
            const schedule = getMaintenanceSchedule(vehicle.make, vehicle.model, vehicle.engine);
            const vKey = `${vehicle.year}_${vehicle.make}_${vehicle.model}`;
            let overdueCount = 0;
            let soonCount = 0;
            if (schedule && vehicle.mileage) {
              const due = calculateDueServices(schedule.services, Number(vehicle.mileage), serviceHistory[vKey] || {});
              overdueCount = due.filter(s => s.status === 'overdue').length;
              soonCount = due.filter(s => s.status === 'due_soon').length;
            }
            return (
              <TouchableOpacity
                key={index}
                style={s.vehicleCard}
                onPress={() => { setActiveVehicle(vehicle); setActiveTab('schedule'); }}
              >
                <View style={s.vehicleCardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={s.vehicleName}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </Text>
                    <Text style={s.vehicleSub}>
                      {vehicle.engine}{vehicle.mileage ? ' · ' + Number(vehicle.mileage).toLocaleString() + ' mi' : ''}
                    </Text>
                  </View>
                  {overdueCount > 0 ? (
                    <View style={s.badgeOd}>
                      <Text style={s.badgeOdText}>{overdueCount} {T('svc_status_overdue')}</Text>
                    </View>
                  ) : soonCount > 0 ? (
                    <View style={s.badgeSoon}>
                      <Text style={s.badgeSoonText}>{soonCount} {T('svc_status_due_soon')}</Text>
                    </View>
                  ) : (
                    <View style={s.badgeOk}>
                      <Text style={s.badgeOkText}>{T('garage_all_current')}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {vehicles.length > 0 && (
          <TouchableOpacity style={s.addVehicleBtnSecondary} onPress={() => setActiveTab('addVehicle')}>
            <Text style={s.addVehicleBtnSecondaryText}>+ {T('garage_add_vehicle')}</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // MAINTENANCE SCHEDULE SCREEN
  // ─────────────────────────────────────────────
  function ScheduleScreen() {
    if (!activeVehicle) {
      return (
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>📅</Text>
          <Text style={s.emptyTitle}>{T('garage_no_vehicles_title')}</Text>
          <TouchableOpacity style={s.addVehicleBtn} onPress={() => setActiveTab('addVehicle')}>
            <Text style={s.addVehicleBtnText}>+ {T('garage_add_vehicle')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const vKey = `${activeVehicle.year}_${activeVehicle.make}_${activeVehicle.model}`;
    const schedule = getMaintenanceSchedule(activeVehicle.make, activeVehicle.model, activeVehicle.engine);
    const currentMileage = activeVehicle.mileage ? Number(activeVehicle.mileage) : 0;

    let services = [];
    if (schedule) {
      services = calculateDueServices(
        schedule.services,
        currentMileage,
        serviceHistory[vKey] || {}
      );
    }

    const overdue  = services.filter(s => s.status === 'overdue');
    const soon     = services.filter(s => s.status === 'due_soon');
    const ok       = services.filter(s => s.status === 'ok');

    function ServiceRow({ svc }) {
      const isOd   = svc.status === 'overdue';
      const isSoon = svc.status === 'due_soon';
      const name   = lang === 'ES' ? svc.nameES : svc.nameEN;
      const milesText = svc.milesUntilDue !== null
        ? isOd
          ? `${Math.abs(svc.milesUntilDue).toLocaleString()} mi ${T('svc_overdue_suffix')}`
          : `${T('svc_due_in')} ${svc.milesUntilDue.toLocaleString()} mi`
        : T('svc_time_based');

      return (
        <View style={s.serviceRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.serviceName}>{name}</Text>
            <Text style={s.serviceDue}>{milesText}</Text>
            {svc.spec ? <Text style={s.serviceSpec}>{svc.spec}</Text> : null}
          </View>
          <View style={isOd ? s.badgeOd : isSoon ? s.badgeSoon : s.badgeOk}>
            <Text style={isOd ? s.badgeOdText : isSoon ? s.badgeSoonText : s.badgeOkText}>
              {isOd ? T('svc_status_overdue') : isSoon ? T('svc_status_due_soon') : T('svc_status_ok')}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>

        {/* Vehicle selector header */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.vehicleChipRow}>
          {vehicles.map((v, i) => (
            <TouchableOpacity
              key={i}
              style={[s.vehicleChip, activeVehicle === v && s.vehicleChipActive]}
              onPress={() => setActiveVehicle(v)}
            >
              <Text style={[s.vehicleChipText, activeVehicle === v && s.vehicleChipTextActive]}>
                {v.year} {v.make} {v.model}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Vehicle info */}
        <View style={s.scheduleHeader}>
          <Text style={s.scheduleVehicleName}>
            {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
          </Text>
          <Text style={s.scheduleVehicleSub}>
            {activeVehicle.engine}
            {currentMileage ? ' · ' + currentMileage.toLocaleString() + ' mi' : ''}
          </Text>
          {schedule?.oilSpec && (
            <Text style={s.oilSpec}>
              {lang === 'EN' ? 'Oil:' : 'Aceite:'} {schedule.oilSpec} · {schedule.oilQty}
            </Text>
          )}
        </View>

        {/* No schedule found */}
        {!schedule && (
          <View style={s.card}>
            <Text style={s.cardNote}>
              {lang === 'EN'
                ? `No schedule found for ${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}. Try editing the vehicle details or request this vehicle be added.`
                : `No se encontró programa para ${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}. Edita los detalles del vehículo o solicita que se agregue.`
              }
            </Text>
          </View>
        )}

        {/* Overdue services */}
        {overdue.length > 0 && (
          <View style={s.serviceSection}>
            <Text style={s.serviceSectionTitle}>
              🔴 {T('svc_status_overdue')} ({overdue.length})
            </Text>
            <View style={s.card}>
              {overdue.map((svc, i) => <ServiceRow key={i} svc={svc} />)}
            </View>
          </View>
        )}

        {/* Due soon services */}
        {soon.length > 0 && (
          <View style={s.serviceSection}>
            <Text style={s.serviceSectionTitle}>
              🟡 {T('svc_status_due_soon')} ({soon.length})
            </Text>
            <View style={s.card}>
              {soon.map((svc, i) => <ServiceRow key={i} svc={svc} />)}
            </View>
          </View>
        )}

        {/* OK services */}
        {ok.length > 0 && (
          <View style={s.serviceSection}>
            <Text style={s.serviceSectionTitle}>
              🟢 {T('svc_status_ok')} ({ok.length})
            </Text>
            <View style={s.card}>
              {ok.map((svc, i) => <ServiceRow key={i} svc={svc} />)}
            </View>
          </View>
        )}

        {/* Notes */}
        {schedule?.notes && (
          <View style={[s.card, { backgroundColor: COLORS.recallBg, borderColor: COLORS.recallBorder }]}>
            <Text style={{ fontSize: 13, color: COLORS.accentDark, lineHeight: 18 }}>
              ⚠ {schedule.notes}
            </Text>
          </View>
        )}

      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // ADD VEHICLE SCREEN
  // ─────────────────────────────────────────────
  function AddVehicleScreen() {
    const [mode, setMode]             = useState('vin');
    const [vin, setVin]               = useState('');
    const [vinLoading, setVinLoading] = useState(false);
    const [vinResult, setVinResult]   = useState(null);
    const [year, setYear]             = useState('');
    const [make, setMake]             = useState('');
    const [model, setModel]           = useState('');
    const [engine, setEngine]         = useState('');
    const [mileage, setMileage]       = useState('');
    const [nickname, setNickname]     = useState('');

    async function lookupVIN() {
      if (vin.length < 17) { Alert.alert('', T('add_vehicle_vin_invalid')); return; }
      setVinLoading(true);
      try {
        const result = await decodeVIN(vin);
        if (result && result.isValid) {
          setVinResult(result);
          setYear(result.year);
          setMake(result.make);
          setModel(result.model);
          setEngine(result.engine);
          setMode('manual');
        } else {
          Alert.alert('', T('add_vehicle_vin_invalid'));
        }
      } catch (e) {
        Alert.alert('', T('error_network'));
      }
      setVinLoading(false);
    }

    function handleAdd() {
      if (!year || !make || !model) { Alert.alert('', T('required')); return; }
      addVehicle({
        vin: vin || null,
        year, make, model, engine,
        mileage: mileage ? parseInt(mileage.replace(/,/g, '')) : null,
        nickname: nickname || null,
        addedAt: new Date().toISOString(),
      });
    }

    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>

          <TouchableOpacity style={s.backBtn} onPress={() => setActiveTab('garage')}>
            <Text style={s.backBtnText}>← {T('btn_back')}</Text>
          </TouchableOpacity>
          <Text style={s.screenTitle}>{T('add_vehicle_title')}</Text>

          <View style={s.modeToggle}>
            <TouchableOpacity style={[s.modeBtn, mode === 'vin' && s.modeBtnActive]} onPress={() => setMode('vin')}>
              <Text style={[s.modeBtnText, mode === 'vin' && s.modeBtnTextActive]}>VIN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.modeBtn, mode === 'manual' && s.modeBtnActive]} onPress={() => setMode('manual')}>
              <Text style={[s.modeBtnText, mode === 'manual' && s.modeBtnTextActive]}>
                {lang === 'EN' ? 'Manual' : 'Manual'}
              </Text>
            </TouchableOpacity>
          </View>

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
                  : <Text style={s.primaryBtnText}>{lang === 'EN' ? 'Decode VIN' : 'Decodificar VIN'}</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('manual')} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ color: COLORS.accent, fontSize: 13 }}>{T('add_vehicle_or')}</Text>
              </TouchableOpacity>
            </View>
          )}

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
                  <TextInput style={s.input} value={year} onChangeText={setYear} placeholder="2018" placeholderTextColor={COLORS.textMuted} keyboardType="number-pad" maxLength={4} />
                </View>
                <View style={s.fieldHalf}>
                  <Text style={s.fieldLabel}>{T('add_vehicle_make')}</Text>
                  <TextInput style={s.input} value={make} onChangeText={setMake} placeholder="Ford" placeholderTextColor={COLORS.textMuted} autoCapitalize="words" />
                </View>
              </View>
              <View style={s.fieldRow}>
                <View style={s.fieldHalf}>
                  <Text style={s.fieldLabel}>{T('add_vehicle_model')}</Text>
                  <TextInput style={s.input} value={model} onChangeText={setModel} placeholder="F-250" placeholderTextColor={COLORS.textMuted} autoCapitalize="words" />
                </View>
                <View style={s.fieldHalf}>
                  <Text style={s.fieldLabel}>{T('add_vehicle_engine')}</Text>
                  <TextInput style={s.input} value={engine} onChangeText={setEngine} placeholder="6.7L" placeholderTextColor={COLORS.textMuted} />
                </View>
              </View>
              <Text style={s.fieldLabel}>{T('add_vehicle_odometer_label')}</Text>
              <TextInput style={s.input} value={mileage} onChangeText={setMileage} placeholder="94,210" placeholderTextColor={COLORS.textMuted} keyboardType="number-pad" />
              <Text style={s.fieldLabel}>{T('add_vehicle_nickname_label')}</Text>
              <TextInput style={s.input} value={nickname} onChangeText={setNickname} placeholder={T('add_vehicle_nickname_placeholder')} placeholderTextColor={COLORS.textMuted} />
            </View>
          )}

          {mode === 'manual' && (
            <TouchableOpacity style={s.primaryBtn} onPress={handleAdd}>
              <Text style={s.primaryBtnText}>{T('add_vehicle_cta')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={s.requestVehicleBtn}
            onPress={() => Alert.alert(
              lang === 'EN' ? "Don't see your vehicle?" : "¿No ves tu vehículo?",
              lang === 'EN'
                ? "Email us at autocoach@coachplatform.app and we'll add it."
                : "Escríbenos a autocoach@coachplatform.app y lo agregaremos."
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

      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>{T('appName')}</Text>
          <Text style={s.headerSub}>{vehicles.length} {T('garage_stat_vehicles')}</Text>
        </View>
        <TouchableOpacity style={s.langBtn} onPress={toggleLang}>
          <Text style={s.langBtnText}>{lang === 'EN' ? 'EN | ES' : 'ES | EN'}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.screenWrap}>{renderScreen()}</View>

      <View style={s.bottomNav}>
        {[
          { key: 'garage',   label: T('nav_garage'),   icon: '🏠' },
          { key: 'schedule', label: T('nav_schedule'),  icon: '📅' },
          { key: 'shop',     label: T('nav_shop'),      icon: '🛒' },
          { key: 'history',  label: T('nav_history'),   icon: '📋' },
          { key: 'fuel',     label: T('nav_fuel'),      icon: '⛽' },
        ].map(tab => (
          <TouchableOpacity key={tab.key} style={s.navItem} onPress={() => setActiveTab(tab.key)}>
            <Text style={[s.navIcon, activeTab === tab.key && s.navIconActive]}>{tab.icon}</Text>
            <Text style={[s.navLabel, activeTab === tab.key && s.navLabelActive]}>{tab.label}</Text>
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
  safeArea:      { flex: 1, backgroundColor: COLORS.primary },
  screenWrap:    { flex: 1, backgroundColor: COLORS.bodyBg },
  screen:        { flex: 1, backgroundColor: COLORS.bodyBg },
  screenContent: { padding: 14, paddingBottom: 40 },

  header: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '600' },
  headerSub:   { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 1 },
  langBtn:     { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  langBtnText: { color: COLORS.white, fontSize: 11, fontWeight: '600' },

  bottomNav:      { flexDirection: 'row', backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 8 },
  navItem:        { flex: 1, alignItems: 'center', gap: 3 },
  navIcon:        { fontSize: 22, opacity: 0.4 },
  navIconActive:  { opacity: 1 },
  navLabel:       { fontSize: 10, color: COLORS.navInactive },
  navLabelActive: { color: COLORS.accentDark, fontWeight: '600' },

  placeholder:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bodyBg },
  placeholderIcon: { fontSize: 48, marginBottom: 12 },
  placeholderText: { fontSize: 24, fontWeight: '600', color: COLORS.primary, marginBottom: 6 },
  placeholderSub:  { fontSize: 14, color: COLORS.textMuted },

  statRow:   { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard:  { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border, padding: 10, alignItems: 'center' },
  statVal:   { fontSize: 20, fontWeight: '600', color: COLORS.accent },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },

  emptyWrap:  { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon:  { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textNavy, marginBottom: 8, textAlign: 'center' },
  emptyBody:  { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 28 },

  addVehicleBtn:              { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 32 },
  addVehicleBtnText:          { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  addVehicleBtnSecondary:     { borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  addVehicleBtnSecondaryText: { color: COLORS.textMuted, fontSize: 14 },
  primaryBtn:     { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  primaryBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },

  vehicleCard:       { backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  vehicleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vehicleName:       { fontSize: 15, fontWeight: '600', color: COLORS.textNavy },
  vehicleSub:        { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  badgeOd:       { backgroundColor: COLORS.overdueBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeOdText:   { fontSize: 11, color: COLORS.overdueText, fontWeight: '500' },
  badgeSoon:     { backgroundColor: COLORS.soonBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeSoonText: { fontSize: 11, color: COLORS.soonText, fontWeight: '500' },
  badgeOk:       { backgroundColor: COLORS.okBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeOkText:   { fontSize: 11, color: COLORS.okText, fontWeight: '500' },

  // Schedule screen
  vehicleChipRow:      { flexDirection: 'row', marginBottom: 14 },
  vehicleChip:         { backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 0.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  vehicleChipActive:   { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  vehicleChipText:     { fontSize: 12, color: COLORS.textMuted },
  vehicleChipTextActive: { color: COLORS.white, fontWeight: '600' },

  scheduleHeader:     { backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 14, marginBottom: 14 },
  scheduleVehicleName:{ fontSize: 17, fontWeight: '700', color: COLORS.textNavy },
  scheduleVehicleSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  oilSpec:            { fontSize: 12, color: COLORS.accent, marginTop: 6, fontWeight: '500' },

  serviceSection:      { marginBottom: 14 },
  serviceSectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textNavy, marginBottom: 8 },

  card:        { backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 14, marginBottom: 14 },
  cardNote:    { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },

  serviceRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  serviceName: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  serviceDue:  { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  serviceSpec: { fontSize: 11, color: COLORS.accent, marginTop: 2 },

  // Add vehicle screen
  backBtn:      { marginBottom: 16 },
  backBtnText:  { color: COLORS.accent, fontSize: 14, fontWeight: '500' },
  screenTitle:  { fontSize: 22, fontWeight: '700', color: COLORS.textNavy, marginBottom: 18 },
  modeToggle:   { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 16 },
  modeBtn:      { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.bodyBg },
  modeBtnActive:{ backgroundColor: COLORS.primary },
  modeBtnText:  { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  modeBtnTextActive: { color: COLORS.white },

  fieldRow:   { flexDirection: 'row', gap: 10 },
  fieldHalf:  { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted, marginBottom: 5, marginTop: 12 },
  input: { backgroundColor: COLORS.bodyBg, borderRadius: 8, borderWidth: 0.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary },

  vinVerifiedBadge:  { backgroundColor: COLORS.okBg, borderRadius: 8, padding: 8, marginBottom: 4, alignItems: 'center' },
  vinVerifiedText:   { color: COLORS.okText, fontSize: 13, fontWeight: '600' },
  requestVehicleBtn: { marginTop: 20, alignItems: 'center', paddingVertical: 14 },
  requestVehicleBtnText: { color: COLORS.accent, fontSize: 13, fontWeight: '500' },
});
