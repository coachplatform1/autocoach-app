import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Platform, ScrollView,
  TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Modal, FlatList, Share, Linking, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS } from './src/translations/TRANSLATIONS';
import { COLORS } from './src/constants/colors';
import { VEHICLE_LIMITS } from './src/constants/products';
import { useRevenueCat } from './src/hooks/useRevenueCat';
import { SOW_TRANSLATIONS } from './src/translations/SowTranslations';
import SupportChat from './src/components/SupportChat';
import ScannerCamera from './src/components/ScannerCamera';
import {
  decodeVIN,
  getMaintenanceSchedule,
  calculateDueServices,
  getAllMakes,
  getModelsForMake,
  getEnginesForMakeModel,
  getYearsForMakeModel,
} from './src/data/vehicleDatabase';
import { AFFILIATE } from './src/constants/affiliates';

import FleetPricingCalculator from './src/components/FleetPricingCalculator';

// expo-camera integrated during production build

// ─────────────────────────────────────────────
// SHOP DATA — maps vehicleDatabase service ids to affiliate partners
// (real partner list from src/constants/affiliates.js)
// ─────────────────────────────────────────────
const AFFILIATE_LABELS = {
  ADVANCE_AUTO:   'Advance Auto Parts',
  AUTOZONE:       'AutoZone',
  AMAZON:         'Amazon',
  TIRE_RACK:      'Tire Rack',
  SIMPLE_TIRE:    'SimpleTire',
  MAVIS:          'Mavis Tires',
  VALVOLINE:      'Valvoline',
  SAFELITE:       'Safelite',
  EDMUNDS:        'Edmunds',
  AAA:            'AAA',
  CHEMICAL_GUYS:  'Chemical Guys',
  FINDITPARTS:    'FindItParts',
  AUTONATION:     'AutoNation Parts',
  BATTERY_TENDER: 'Battery Tender',
  EASTWOOD:       'Eastwood',
  UPSIDE:         'Upside',
  ATOB:           'AtoB',
  REPAIRPAL:      'RepairPal',
};

// Maps each vehicleDatabase service `id` to the best-fit affiliate partner(s).
// Falls back to DEFAULT_SHOP_ENTRY for any service id not listed here
// (keeps this future-proof as new services get added to the DB).
const SERVICE_SHOP_MAP = {
  oil_filter:         { icon: '🛢️', primary: 'ADVANCE_AUTO', alternates: ['AUTOZONE', 'AMAZON'] },
  tire_rotation:      { icon: '🛞', primary: 'TIRE_RACK',     alternates: ['SIMPLE_TIRE', 'MAVIS'] },
  air_filter_cabin:   { icon: '🌬️', primary: 'ADVANCE_AUTO', alternates: ['AUTOZONE', 'AMAZON'] },
  air_filter_engine:  { icon: '🌬️', primary: 'ADVANCE_AUTO', alternates: ['AUTOZONE', 'AMAZON'] },
  brake_inspection:   { icon: '🛑', primary: 'ADVANCE_AUTO', alternates: ['AUTOZONE', 'AUTONATION'] },
  spark_plugs:        { icon: '🔥', primary: 'ADVANCE_AUTO', alternates: ['AUTOZONE', 'AMAZON'] },
  transmission:       { icon: '⚙️', primary: 'AUTONATION',   alternates: ['FINDITPARTS'] },
  coolant:            { icon: '❄️', primary: 'ADVANCE_AUTO', alternates: ['AUTOZONE'] },
  brake_fluid:        { icon: '🧯', primary: 'ADVANCE_AUTO', alternates: ['AUTOZONE'] },
  battery:            { icon: '🔋', primary: 'BATTERY_TENDER', alternates: ['ADVANCE_AUTO', 'AUTOZONE'] },
  serpentine_belt:    { icon: '➰', primary: 'ADVANCE_AUTO', alternates: ['AUTOZONE'] },
  wiper_blades:       { icon: '🌧️', primary: 'SAFELITE',    alternates: ['ADVANCE_AUTO', 'AMAZON'] },
  fuel_filter_diesel: { icon: '⛽', primary: 'AUTONATION',   alternates: ['FINDITPARTS'] },
  def_fluid:          { icon: '💧', primary: 'ADVANCE_AUTO', alternates: ['AUTOZONE', 'AMAZON'] },
  glow_plugs:         { icon: '🔥', primary: 'AUTONATION',   alternates: ['FINDITPARTS'] },
  egr_cleaning:       { icon: '🧰', primary: 'AUTONATION',   alternates: ['FINDITPARTS'] },
  dpf_cleaning:       { icon: '🧰', primary: 'AUTONATION',   alternates: ['FINDITPARTS'] },
  turbo_inspection:   { icon: '🧰', primary: 'AUTONATION',   alternates: ['FINDITPARTS'] },
  hybrid_battery:     { icon: '🔋', primary: 'AUTONATION',   alternates: ['FINDITPARTS'] },
  hybrid_brake:       { icon: '🛑', primary: 'ADVANCE_AUTO', alternates: ['AUTOZONE'] },
};
const DEFAULT_SHOP_ENTRY = { icon: '🔧', primary: 'ADVANCE_AUTO', alternates: ['AUTOZONE', 'AMAZON'] };

// Google Play / App Store reviewers can't complete a real purchase or use a
// "free trial" to access subscription-gated content — this code lets a
// reviewer unlock full Pro access without paying, per each store's app
// review requirements. Disclosed directly in the store listing's
// restricted-content declaration, not a security secret.
const REVIEWER_UNLOCK_CODE = 'AUTOCOACH-REVIEW-2026';

// Backend OCR extraction proxy (netlify/functions/ocr.js) — see that file's
// header comment for the four modes it supports.
const OCR_ENDPOINT = 'https://coachplatform.app/.netlify/functions/ocr';

// Official NHTSA recalls-by-vehicle endpoint. Free, no API key required.
// Docs: https://www.nhtsa.gov/nhtsa-datasets-and-apis
// Called directly from the app (no backend proxy needed — this is public
// government data, unlike the OCR endpoint which hides an API key).
const NHTSA_RECALLS_ENDPOINT = 'https://api.nhtsa.gov/recalls/recallsByVehicle';

// Returns null on network/fetch failure (distinct from [] = successfully
// checked, zero open recalls) so the UI can tell "couldn't check" apart
// from "checked, all clear."
async function fetchRecalls(make, model, year) {
  try {
    const url = `${NHTSA_RECALLS_ENDPOINT}?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(year)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NHTSA API returned ${res.status}`);
    const json = await res.json();
    const results = json.results || json.Results || [];
    return results.map(r => ({
      campaignNumber: r.NHTSACampaignNumber || r.nhtsaCampaignNumber || r.CampaignNumber || '',
      component:      r.Component || r.component || '',
      summary:        r.Summary || r.summary || '',
      consequence:    r.Consequence || r.consequence || '',
      remedy:         r.Remedy || r.remedy || '',
      reportDate:     r.ReportReceivedDate || r.reportReceivedDate || '',
      manufacturer:   r.Manufacturer || r.manufacturer || '',
    }));
  } catch (err) {
    console.error('NHTSA recalls fetch failed:', err);
    return null;
  }
}

// ─────────────────────────────────────────────
// SCROLL PICKER COMPONENT
// ─────────────────────────────────────────────
function ScrollPicker({ items, selectedValue, onSelect, label, placeholder, lang }) {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={sp.trigger}
        onPress={() => items.length > 0 && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={selectedValue ? sp.triggerValue : sp.triggerPlaceholder}>
          {selectedValue || placeholder}
        </Text>
        <Text style={sp.triggerArrow}>›</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={sp.backdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
        <View style={sp.sheet}>
          <View style={sp.sheetHeader}>
            <Text style={sp.sheetTitle}>{label}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={sp.sheetDone}>{lang === 'ES' ? 'Listo' : 'Done'}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item, i) => String(i)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[sp.item, item === selectedValue && sp.itemSelected]}
                onPress={() => { onSelect(item); setModalVisible(false); }}
              >
                <Text style={[sp.itemText, item === selectedValue && sp.itemTextSelected]}>{item}</Text>
                {item === selectedValue && <Text style={sp.itemCheck}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const sp = StyleSheet.create({
  trigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bodyBg, borderRadius: 8, borderWidth: 0.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 2 },
  triggerValue:       { fontSize: 15, color: COLORS.textPrimary, flex: 1 },
  triggerPlaceholder: { fontSize: 15, color: COLORS.textMuted, flex: 1 },
  triggerArrow:       { fontSize: 18, color: COLORS.textMuted },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%', paddingBottom: Platform.OS === 'ios' ? 30 : 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  sheetTitle:    { fontSize: 16, fontWeight: '600', color: COLORS.textNavy },
  sheetDone:     { fontSize: 16, fontWeight: '600', color: COLORS.accent },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  itemSelected:     { backgroundColor: COLORS.okBg },
  itemText:         { fontSize: 15, color: COLORS.textPrimary },
  itemTextSelected: { color: COLORS.primary, fontWeight: '600' },
  itemCheck:        { fontSize: 16, color: COLORS.okText, fontWeight: '700' },
});

// ─────────────────────────────────────────────
// ONBOARDING + DISCLAIMER GATE
// Standalone component (outside App) — receives `lang` as an explicit
// prop per project convention. Runs once on first launch:
//   1) 5-screen welcome carousel (Skip / Next)
//   2) Legal disclaimer the user must agree to before using the app
// ─────────────────────────────────────────────
const ONBOARDING_STEPS = [
  { icon: '🚗', titleKey: 'onboarding_welcome_title', bodyKey: 'onboarding_welcome_subtitle' },
  { icon: '📋', titleKey: 'onboarding_step1_title',   bodyKey: 'onboarding_step1_body' },
  { icon: '📸', titleKey: 'onboarding_step2_title',   bodyKey: 'onboarding_step2_body' },
  { icon: '⏰', titleKey: 'onboarding_step3_title',   bodyKey: 'onboarding_step3_body' },
  { icon: '📈', titleKey: 'onboarding_step4_title',   bodyKey: 'onboarding_step4_body' },
];

function OnboardingFlow({ lang, toggleLang, onboardingDone, onFinishOnboarding, onAgreeDisclaimer }) {
  const T = (key) => TRANSLATIONS[key]?.[lang] ?? key;
  const [phase, setPhase] = useState(onboardingDone ? 'disclaimer' : 'carousel');
  const [step, setStep]   = useState(0);

  const isLastStep = step === ONBOARDING_STEPS.length - 1;
  const current = ONBOARDING_STEPS[step];

  function handleNext() {
    if (isLastStep) {
      onFinishOnboarding();
      setPhase('disclaimer');
    } else {
      setStep(step + 1);
    }
  }

  function handleSkip() {
    onFinishOnboarding();
    setPhase('disclaimer');
  }

  return (
    <SafeAreaView style={ob.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />

      <View style={ob.topRow}>
        <TouchableOpacity style={ob.langBtn} onPress={toggleLang}>
          <Text style={ob.langBtnText}>{lang === 'EN' ? 'EN | ES' : 'ES | EN'}</Text>
        </TouchableOpacity>
        {phase === 'carousel' && !isLastStep && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={ob.skipText}>{T('onboarding_skip')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {phase === 'carousel' ? (
        <View style={ob.carouselBody}>
          <Text style={ob.icon}>{current.icon}</Text>
          <Text style={ob.title}>{T(current.titleKey)}</Text>
          <Text style={ob.body}>{T(current.bodyKey)}</Text>

          <View style={ob.dotsRow}>
            {ONBOARDING_STEPS.map((_, i) => (
              <View key={i} style={[ob.dot, i === step && ob.dotActive]} />
            ))}
          </View>

          <TouchableOpacity style={ob.primaryBtn} onPress={handleNext}>
            <Text style={ob.primaryBtnText}>
              {isLastStep ? T('onboarding_get_started') : T('onboarding_next')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={ob.disclaimerBody} contentContainerStyle={ob.disclaimerContent}>
          <Text style={ob.disclaimerIcon}>⚠️</Text>
          <Text style={ob.title}>{T('onboarding_disclaimer_title')}</Text>
          <Text style={ob.disclaimerText}>{T('onboarding_disclaimer_body')}</Text>

          <TouchableOpacity style={ob.primaryBtn} onPress={onAgreeDisclaimer}>
            <Text style={ob.primaryBtnText}>{T('onboarding_disclaimer_agree')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const ob = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: COLORS.primary },
  topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  langBtn:     { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  langBtnText: { color: COLORS.white, fontSize: 11, fontWeight: '600' },
  skipText:    { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },

  carouselBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  icon:         { fontSize: 64, marginBottom: 24 },
  title:        { fontSize: 22, fontWeight: '700', color: COLORS.white, textAlign: 'center', marginBottom: 14 },
  body:         { fontSize: 15, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 22, marginBottom: 36 },

  dotsRow:   { flexDirection: 'row', gap: 8, marginBottom: 36 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: COLORS.accent, width: 22 },

  primaryBtn:     { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 15, paddingHorizontal: 48, alignItems: 'center', alignSelf: 'stretch' },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },

  disclaimerBody:    { flex: 1 },
  disclaimerContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  disclaimerIcon:    { fontSize: 48, marginBottom: 20 },
  disclaimerText:    { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 21, marginBottom: 36 },
});



// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [lang, setLang]                       = useState('EN');
  const [vehicles, setVehicles]               = useState([]);
  const [activeTab, setActiveTab]             = useState('garage');
  const [activeVehicle, setActiveVehicle]     = useState(null);
  const [serviceHistory, setServiceHistory]   = useState({});
  const [selectedService, setSelectedService] = useState(null);
  const [fuelLog, setFuelLog]                 = useState([]);
  
  const T = (key) => TRANSLATIONS[key]?.[lang] ?? key;
  const { isPro, vehicleLimit, purchaseProduct, restorePurchases } = useRevenueCat(T);
  
  const [cameraPermission, setCameraPermission] = useState(null);
  const [checkingGate, setCheckingGate]       = useState(true);
  const [onboardingDone, setOnboardingDone]   = useState(false);
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(false);
  const [currentTier, setCurrentTier]         = useState(null);
  const [units, setUnits]                     = useState('miles');
  const [mileageInterval, setMileageInterval] = useState(1000);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const reviewCodeInputRef = useRef('');
  const [documents, setDocuments]             = useState([]);
  const [recallsCache, setRecallsCache]       = useState({}); // vKey -> array | null (undefined = not yet loaded)
  const [recallsLoading, setRecallsLoading]   = useState({}); // vKey -> bool

  useEffect(() => {
    AsyncStorage.getItem('autocoach_lang').then(s => { if (s) setLang(s); });
    AsyncStorage.getItem('autocoach_vehicles').then(s => { if (s) setVehicles(JSON.parse(s)); });
    AsyncStorage.getItem('autocoach_service_history').then(s => { if (s) setServiceHistory(JSON.parse(s)); });
    AsyncStorage.getItem('autocoach_fuel_log').then(s => { if (s) setFuelLog(JSON.parse(s)); });
    AsyncStorage.getItem('autocoach_documents').then(s => { if (s) setDocuments(JSON.parse(s)); });
    AsyncStorage.getItem('autocoach_subscribed_tier').then(s => { if (s) setCurrentTier(s); });
    // Settings preferences
    AsyncStorage.getItem('autocoach_units').then(s => { if (s) setUnits(s); });
    AsyncStorage.getItem('autocoach_mileage_interval').then(s => { if (s) setMileageInterval(parseInt(s, 10) || 1000); });
    AsyncStorage.getItem('autocoach_notifications_enabled').then(s => { if (s !== null) setNotificationsEnabled(s === 'true'); });
    AsyncStorage.getItem('autocoach_location_enabled').then(s => { if (s === 'true') setLocationEnabled(true); });
  }, []);

  // First-launch gate: onboarding carousel + legal disclaimer must both
  // be completed once before the main tabs are shown (mirrors PoolCoach).
  // Hardened: wrapped in try/catch/finally + a hard timeout so a storage
  // read failure (or a hang) can NEVER leave the app stuck on the spinner —
  // worst case it just falls through and shows onboarding.
  useEffect(() => {
    let settled = false;

    function finish(obFlag, daFlag) {
      if (settled) return;
      settled = true;
      setOnboardingDone(obFlag === 'true');
      setDisclaimerAgreed(daFlag === 'true');
      setCheckingGate(false);
    }

    const safetyTimer = setTimeout(() => {
      console.warn('Onboarding gate check timed out — defaulting to first-launch flow.');
      finish(null, null);
    }, 4000);

    (async () => {
      try {
        const [obFlag, daFlag] = await Promise.all([
          AsyncStorage.getItem('autocoach_onboarding_complete'),
          AsyncStorage.getItem('autocoach_disclaimer_agreed'),
        ]);
        clearTimeout(safetyTimer);
        finish(obFlag, daFlag);
      } catch (err) {
        console.error('Onboarding gate check failed:', err);
        clearTimeout(safetyTimer);
        // Fail safe: treat as first launch rather than hanging forever.
        finish(null, null);
      }
    })();

    return () => clearTimeout(safetyTimer);
  }, []);

  function completeOnboarding() {
    setOnboardingDone(true);
    AsyncStorage.setItem('autocoach_onboarding_complete', 'true').catch(err =>
      console.error('Could not save onboarding flag:', err)
    );
  }

  function agreeToDisclaimer() {
    setDisclaimerAgreed(true);
    AsyncStorage.setItem('autocoach_disclaimer_agreed', 'true').catch(err =>
      console.error('Could not save disclaimer flag:', err)
    );
  }

  function saveVehicles(updated) {
    setVehicles(updated);
    AsyncStorage.setItem('autocoach_vehicles', JSON.stringify(updated));
  }

  function toggleLang() {
    const n = lang === 'EN' ? 'ES' : 'EN';
    setLang(n);
    AsyncStorage.setItem('autocoach_lang', n);
  }

  function saveDocuments(updated) {
    setDocuments(updated);
    AsyncStorage.setItem('autocoach_documents', JSON.stringify(updated)).catch(() => {});
  }

  // Cached per vehicle (year+make+model) so switching between vehicle
  // chips doesn't re-hit NHTSA's API every time — only fetches once per
  // vehicle per app session.
  async function loadRecallsForVehicle(vehicle) {
    if (!vehicle) return;
    const vKey = `${vehicle.year}_${vehicle.make}_${vehicle.model}`;
    if (recallsCache[vKey] !== undefined) return;
    setRecallsLoading(prev => ({ ...prev, [vKey]: true }));
    const results = await fetchRecalls(vehicle.make, vehicle.model, vehicle.year);
    setRecallsCache(prev => ({ ...prev, [vKey]: results }));
    setRecallsLoading(prev => ({ ...prev, [vKey]: false }));
  }

  // Calls the ocr.js Netlify function with a base64 photo and returns the
  // extracted, mode-specific JSON (see ocr.js header for the four modes).
  // Ankit wires the actual camera capture (expo-camera) that produces the
  // base64 image this function consumes — the extraction + auto-fill logic
  // built around every call site here is ready for him to hook a real
  // photo into, rather than the placeholder camera screens shown today.
  async function callOCR(base64Image, mode, mimeType = 'image/jpeg') {
    try {
      const res = await fetch(OCR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, mimeType, mode }),
      });
      const json = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error || 'OCR extraction failed');
      }
      return json.data;
    } catch (err) {
      console.error('OCR call failed:', err);
      Alert.alert(
        '',
        lang === 'EN'
          ? "Couldn't read that photo. Please enter the details manually."
          : 'No se pudo leer la foto. Por favor ingresa los datos manualmente.'
      );
      return null;
    }
  }

  function addVehicle(vehicle) {
    const updated = [...vehicles, vehicle];
    saveVehicles(updated);
    setActiveVehicle(vehicle);
    setActiveTab('garage');
  }

  // Gated entry point for "+ Add Vehicle" — AutoCoach has no free tier,
  // so anyone without an active subscription (or who's hit their tier's
  // vehicle limit) gets routed to the paywall instead of the add-vehicle form.
  function handleAddVehiclePress() {
    if (vehicles.length >= vehicleLimit) {
      setActiveTab('paywall');
    } else {
      setActiveTab('addVehicle');
    }
  }

  // 'autocoach_solo_monthly' / 'autocoach_solo_annual' -> 'autocoach_solo'
  function tierKeyFromProductId(rcId) {
    return rcId.replace(/_monthly$|_annual$/, '');
  }

  // RevenueCat real purchase handling
  async function handleSubscribe(rcId, price) {
    const success = await purchaseProduct(rcId);
    if (success) {
      setActiveTab('garage');
      Alert.alert(
        SOW_TRANSLATIONS[lang]?.purchase_success_title || SOW_TRANSLATIONS.EN.purchase_success_title,
        SOW_TRANSLATIONS[lang]?.purchase_success_msg || SOW_TRANSLATIONS.EN.purchase_success_msg
      );
    }
  }

  function handleEnterpriseContact() {
    // FleetPricingCalculator already opens a mailto: to fleet@coachplatform.app
    // with the vehicle count pre-filled — nothing else needed here for now.
  }

  async function handleRestorePurchases() {
    const success = await restorePurchases();
    if (success) {
      Alert.alert(
        SOW_TRANSLATIONS[lang]?.restore_success_title || SOW_TRANSLATIONS.EN.restore_success_title,
        SOW_TRANSLATIONS[lang]?.restore_success_msg || SOW_TRANSLATIONS.EN.restore_success_msg
      );
    }
  }

  // ── SETTINGS HANDLERS ─────────────────────────
  function setUnitsAndSave(next) {
    setUnits(next);
    AsyncStorage.setItem('autocoach_units', next).catch(() => {});
  }

  function setMileageIntervalAndSave(next) {
    setMileageInterval(next);
    AsyncStorage.setItem('autocoach_mileage_interval', String(next)).catch(() => {});
  }

  function toggleNotifications(next) {
    setNotificationsEnabled(next);
    AsyncStorage.setItem('autocoach_notifications_enabled', String(next)).catch(() => {});
  }

  async function requestLocationAccess() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationEnabled(granted);
      AsyncStorage.setItem('autocoach_location_enabled', String(granted)).catch(() => {});
      if (!granted) {
        Alert.alert(
          '',
          lang === 'EN'
            ? 'Location access was denied. You can enable it later from your phone settings.'
            : 'Se denegó el acceso a la ubicación. Puedes habilitarlo más tarde desde la configuración de tu teléfono.'
        );
      }
    } catch (err) {
      console.error('Location permission error:', err);
    }
  }

  function handleResetApp() {
    Alert.alert(
      lang === 'EN' ? 'Reset AutoCoach?' : '¿Restablecer AutoCoach?',
      lang === 'EN'
        ? 'This clears every vehicle, service record, fuel log, and subscription status stored on this device. This cannot be undone.'
        : 'Esto borra todos los vehículos, registros de servicio, historial de combustible y estado de suscripción almacenados en este dispositivo. Esto no se puede deshacer.',
      [
        { text: lang === 'EN' ? 'Cancel' : 'Cancelar', style: 'cancel' },
        {
          text: lang === 'EN' ? 'Reset' : 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'autocoach_lang', 'autocoach_vehicles', 'autocoach_service_history',
                'autocoach_fuel_log', 'autocoach_is_pro', 'autocoach_vehicle_limit',
                'autocoach_subscribed_tier', 'autocoach_onboarding_complete',
                'autocoach_disclaimer_agreed', 'autocoach_units', 'autocoach_mileage_interval',
                'autocoach_notifications_enabled', 'autocoach_location_enabled',
              ]);
            } catch (err) {
              console.error('Reset failed:', err);
            }
            setVehicles([]); setActiveVehicle(null); setServiceHistory({}); setFuelLog([]);
            setCurrentTier(null);
            setUnits('miles'); setMileageInterval(1000);
            setNotificationsEnabled(true); setLocationEnabled(false);
            setOnboardingDone(false); setDisclaimerAgreed(false);
            setActiveTab('garage');
          },
        },
      ]
    );
  }

  // ── STORE-REVIEWER BYPASS ─────────────────────
  // Removed for production. Reviewers should use Sandbox accounts.
  function handleReviewCodeSubmit() {
    Alert.alert(
      '',
      SOW_TRANSLATIONS[lang]?.reviewer_invalid_code || SOW_TRANSLATIONS.EN.reviewer_invalid_code
    );
  }

  function openAffiliateLink(affiliateKey) {
    const url = AFFILIATE[affiliateKey];
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Alert.alert('', lang === 'EN' ? 'Could not open link.' : 'No se pudo abrir el enlace.');
    });
  }

  // ─────────────────────────────────────────────
  // SCREEN ROUTER
  // ─────────────────────────────────────────────
  function renderScreen() {
    switch (activeTab) {
      case 'garage':        return <GarageScreen />;
      case 'schedule':      return <ScheduleScreen />;
      case 'shop':          return <ShopScreen />;
      case 'paywall':       return PaywallScreen();
      case 'settings':      return <SettingsScreen />;
      case 'documents':     return <DocumentsScreen />;
      case 'accidentChecklist': return <AccidentChecklistScreen />;
      case 'history':       return <HistoryScreen />;
      case 'fuel':          return <FuelScreen />;
      case 'addVehicle':    return <AddVehicleScreen />;
      case 'serviceDetail': return <ServiceDetailScreen />;
      default:              return <GarageScreen />;
    }
  }

  // ─────────────────────────────────────────────
  // GARAGE SCREEN
  // ─────────────────────────────────────────────
  function GarageScreen() {
    let totalDue = 0;
    vehicles.forEach(v => {
      const schedule = getMaintenanceSchedule(v.make, v.model, v.engine);
      if (schedule && v.mileage) {
        const vKey = `${v.year}_${v.make}_${v.model}`;
        const due = calculateDueServices(schedule.services, Number(v.mileage), serviceHistory[vKey] || {}, mileageInterval);
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
            <TouchableOpacity style={s.addVehicleBtn} onPress={handleAddVehiclePress}>
              <Text style={s.addVehicleBtnText}>+ {T('garage_add_vehicle')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map((vehicle, index) => {
            const schedule = getMaintenanceSchedule(vehicle.make, vehicle.model, vehicle.engine);
            const vKey = `${vehicle.year}_${vehicle.make}_${vehicle.model}`;
            let overdueCount = 0, soonCount = 0;
            if (schedule && vehicle.mileage) {
              const due = calculateDueServices(schedule.services, Number(vehicle.mileage), serviceHistory[vKey] || {}, mileageInterval);
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
                    <Text style={s.vehicleName}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
                    <Text style={s.vehicleSub}>
                      {vehicle.engine}{vehicle.mileage ? ' · ' + Number(vehicle.mileage).toLocaleString() + ' mi' : ''}
                    </Text>
                  </View>
                  {overdueCount > 0 ? (
                    <View style={s.badgeOd}><Text style={s.badgeOdText}>{overdueCount} {T('svc_status_overdue')}</Text></View>
                  ) : soonCount > 0 ? (
                    <View style={s.badgeSoon}><Text style={s.badgeSoonText}>{soonCount} {T('svc_status_due_soon')}</Text></View>
                  ) : (
                    <View style={s.badgeOk}><Text style={s.badgeOkText}>{T('garage_all_current')}</Text></View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {vehicles.length > 0 && (
          <TouchableOpacity style={s.addVehicleBtnSecondary} onPress={handleAddVehiclePress}>
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
    useEffect(() => {
      if (activeVehicle) loadRecallsForVehicle(activeVehicle);
    }, [activeVehicle]);

    if (!activeVehicle) {
      return (
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>📅</Text>
          <Text style={s.emptyTitle}>{T('garage_no_vehicles_title')}</Text>
          <TouchableOpacity style={s.addVehicleBtn} onPress={handleAddVehiclePress}>
            <Text style={s.addVehicleBtnText}>+ {T('garage_add_vehicle')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const vKey = `${activeVehicle.year}_${activeVehicle.make}_${activeVehicle.model}`;
    const schedule = getMaintenanceSchedule(activeVehicle.make, activeVehicle.model, activeVehicle.engine);
    const currentMileage = activeVehicle.mileage ? Number(activeVehicle.mileage) : 0;
    const recalls = recallsCache[vKey];
    const recallsAreLoading = !!recallsLoading[vKey];

    let services = [];
    if (schedule) {
      services = calculateDueServices(schedule.services, currentMileage, serviceHistory[vKey] || {}, mileageInterval);
    }

    const overdue = services.filter(s => s.status === 'overdue');
    const soon    = services.filter(s => s.status === 'due_soon');
    const ok      = services.filter(s => s.status === 'ok');

    function ServiceRow({ svc }) {
      const isOd   = svc.status === 'overdue';
      const isSoon = svc.status === 'due_soon';
      const name   = lang === 'ES' ? svc.nameES : svc.nameEN;
      const currentMil = activeVehicle?.mileage ? Number(activeVehicle.mileage) : 0;
      const nextDueMileage = currentMil + (svc.milesUntilDue || 0);
      const milesText = svc.milesUntilDue !== null
        ? isOd
          ? `${Math.abs(Math.round(svc.milesUntilDue)).toLocaleString()} ${T('svc_overdue_suffix')}`
          : `${T('svc_due_in')} ${Math.round(svc.milesUntilDue).toLocaleString()} mi — next at ${Math.round(nextDueMileage).toLocaleString()} mi`
        : T('svc_time_based');

      return (
        <TouchableOpacity
          style={s.serviceRow}
          onPress={() => { setSelectedService(svc); setActiveTab('serviceDetail'); }}
          activeOpacity={0.7}
        >
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
        </TouchableOpacity>
      );
    }

    function RecallCard({ recall }) {
      const [expanded, setExpanded] = useState(false);
      const summary = recall.summary || '';
      const truncated = summary.length > 110 ? summary.slice(0, 110) + '…' : summary;
      return (
        <TouchableOpacity
          style={[s.card, { borderColor: COLORS.overdueText, borderWidth: 1 }]}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.overdueText, marginBottom: 4 }}>
            {recall.component || (lang === 'EN' ? 'Recall' : 'Retiro')}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 17 }}>
            {expanded ? summary : truncated}
          </Text>
          {expanded && (
            <>
              {recall.consequence ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.textNavy }}>
                    {lang === 'EN' ? 'Consequence' : 'Consecuencia'}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 17 }}>{recall.consequence}</Text>
                </View>
              ) : null}
              {recall.remedy ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.textNavy }}>
                    {lang === 'EN' ? 'Remedy' : 'Solución'}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 17 }}>{recall.remedy}</Text>
                </View>
              ) : null}
              {recall.campaignNumber ? (
                <Text style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 8 }}>
                  NHTSA #{recall.campaignNumber}
                </Text>
              ) : null}
            </>
          )}
          <Text style={{ fontSize: 11, color: COLORS.accent, fontWeight: '600', marginTop: 8 }}>
            {expanded
              ? (lang === 'EN' ? 'Show less ▲' : 'Ver menos ▲')
              : (lang === 'EN' ? 'Tap for details ▼' : 'Toca para detalles ▼')}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>
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

        <View style={s.scheduleHeader}>
          <Text style={s.scheduleVehicleName}>{activeVehicle.year} {activeVehicle.make} {activeVehicle.model}</Text>
          <Text style={s.scheduleVehicleSub}>
            {activeVehicle.engine}{currentMileage ? ' · ' + currentMileage.toLocaleString() + ' mi' : ''}
          </Text>
          {schedule?.oilSpec && (
            <View style={{ marginTop: 8 }}>
              <Text style={s.oilSpec}>🛢 {lang === 'EN' ? 'Oil:' : 'Aceite:'} {schedule.oilSpec}</Text>
              <Text style={s.oilSpec}>📦 {lang === 'EN' ? 'Capacity:' : 'Capacidad:'} {schedule.oilQty}</Text>
              <Text style={s.oilSpec}>🔩 {lang === 'EN' ? 'Filter:' : 'Filtro:'} {schedule.filterPN}</Text>
            </View>
          )}
          {!schedule && (
            <Text style={{ fontSize: 12, color: COLORS.accentDark, marginTop: 6 }}>
              {lang === 'EN' ? 'Vehicle not found in database — check make/model spelling' : 'Vehículo no encontrado — verifica la marca/modelo'}
            </Text>
          )}
        </View>

        {/* Live NHTSA safety recalls — separate from the vehicleDatabase
            notes field above, which is static manufacturer guidance, not
            a real-time recall check. */}
        {recallsAreLoading && (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 16 }]}>
            <ActivityIndicator color={COLORS.accent} size="small" />
            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>
              {lang === 'EN' ? 'Checking for open recalls...' : 'Verificando retiros abiertos...'}
            </Text>
          </View>
        )}
        {recalls === null && !recallsAreLoading && (
          <View style={[s.card, { paddingVertical: 12 }]}>
            <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center' }}>
              {lang === 'EN' ? 'Could not check for recalls — check your connection.' : 'No se pudo verificar retiros — revisa tu conexión.'}
            </Text>
          </View>
        )}
        {recalls && recalls.length > 0 && (
          <View style={s.serviceSection}>
            <Text style={[s.serviceSectionTitle, { color: COLORS.overdueText }]}>
              🚨 {lang === 'EN' ? 'Open Safety Recalls' : 'Retiros de Seguridad Abiertos'} ({recalls.length})
            </Text>
            {recalls.map((r, i) => <RecallCard key={i} recall={r} />)}
          </View>
        )}
        {recalls && recalls.length === 0 && (
          <View style={[s.card, { backgroundColor: COLORS.okBg, borderColor: COLORS.okText, alignItems: 'center', paddingVertical: 14 }]}>
            <Text style={{ fontSize: 13, color: COLORS.okText, fontWeight: '600' }}>
              ✓ {lang === 'EN' ? 'No open recalls for this vehicle' : 'Sin retiros abiertos para este vehículo'}
            </Text>
          </View>
        )}

        {overdue.length > 0 && (
          <View style={s.serviceSection}>
            <Text style={s.serviceSectionTitle}>🔴 {T('svc_status_overdue')} ({overdue.length})</Text>
            <View style={s.card}>{overdue.map((svc, i) => <ServiceRow key={i} svc={svc} />)}</View>
          </View>
        )}
        {soon.length > 0 && (
          <View style={s.serviceSection}>
            <Text style={s.serviceSectionTitle}>🟡 {T('svc_status_due_soon')} ({soon.length})</Text>
            <View style={s.card}>{soon.map((svc, i) => <ServiceRow key={i} svc={svc} />)}</View>
          </View>
        )}
        {ok.length > 0 && (
          <View style={s.serviceSection}>
            <Text style={s.serviceSectionTitle}>🟢 {T('svc_status_ok')} ({ok.length})</Text>
            <View style={s.card}>{ok.map((svc, i) => <ServiceRow key={i} svc={svc} />)}</View>
          </View>
        )}
        {schedule?.notes && (
          <View style={[s.card, { backgroundColor: COLORS.recallBg, borderColor: COLORS.recallBorder }]}>
            <Text style={{ fontSize: 13, color: COLORS.accentDark, lineHeight: 18 }}>⚠ {schedule.notes}</Text>
          </View>
        )}

        {/* Quick Actions — fills the space below the service list with
            real shortcuts for this vehicle instead of empty scroll area. */}
        <Text style={s.serviceSectionTitle}>{lang === 'EN' ? 'Quick Actions' : 'Acciones Rápidas'}</Text>
        <View style={s.quickActionsGrid}>
          <TouchableOpacity style={s.quickActionCard} onPress={() => setActiveTab('shop')}>
            <Text style={s.quickActionIcon}>🛒</Text>
            <Text style={s.quickActionLabel}>{lang === 'EN' ? 'Shop Parts' : 'Comprar Piezas'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickActionCard} onPress={() => setActiveTab('fuel')}>
            <Text style={s.quickActionIcon}>⛽</Text>
            <Text style={s.quickActionLabel}>{lang === 'EN' ? 'Log Fuel' : 'Registrar Combustible'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickActionCard} onPress={() => setActiveTab('documents')}>
            <Text style={s.quickActionIcon}>📁</Text>
            <Text style={s.quickActionLabel}>{lang === 'EN' ? 'Documents' : 'Documentos'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickActionCard} onPress={() => setActiveTab('accidentChecklist')}>
            <Text style={s.quickActionIcon}>🚨</Text>
            <Text style={s.quickActionLabel}>{lang === 'EN' ? 'Accident Checklist' : 'Lista de Accidente'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.brandFooter}>
          <Text style={s.brandFooterIcon}>🚗</Text>
          <Text style={s.brandFooterText}>AutoCoach</Text>
          <Text style={s.brandFooterSub}>{lang === 'EN' ? 'Track it. Trust it.' : 'Rastréalo. Confía en él.'}</Text>
        </View>
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // SERVICE DETAIL SCREEN
  // ─────────────────────────────────────────────
  function ServiceDetailScreen() {
    const [mileageInput, setMileageInput] = useState(
      activeVehicle?.mileage ? String(activeVehicle.mileage) : ''
    );

    if (!selectedService || !activeVehicle) return <PlaceholderScreen label="Service Detail" />;

    const svc    = selectedService;
    const name   = lang === 'ES' ? svc.nameES : svc.nameEN;
    const isOd   = svc.status === 'overdue';
    const isSoon = svc.status === 'due_soon';
    const vKey   = `${activeVehicle.year}_${activeVehicle.make}_${activeVehicle.model}`;

    function handleLogService() {
      const miles = parseInt(mileageInput.replace(/,/g, ''));
      if (!miles || miles < 1) {
        Alert.alert('', lang === 'EN' ? 'Please enter the mileage when this service was done.' : 'Por favor ingresa el kilometraje cuando se realizó el servicio.');
        return;
      }
      const updated = {
        ...serviceHistory,
        [vKey]: {
          ...(serviceHistory[vKey] || {}),
          [svc.id]: { lastMileage: miles, lastDate: new Date().toISOString() }
        }
      };
      setServiceHistory(updated);
      AsyncStorage.setItem('autocoach_service_history', JSON.stringify(updated));
      Alert.alert(
        lang === 'EN' ? 'Service logged ✓' : 'Servicio registrado ✓',
        lang === 'EN'
          ? `${name} logged at ${miles.toLocaleString()} mi.`
          : `${name} registrado a ${miles.toLocaleString()} mi.`,
        [{ text: lang === 'EN' ? 'Done' : 'Listo', onPress: () => setActiveTab('schedule') }]
      );
    }

    return (
      <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>
        <TouchableOpacity style={s.backBtn} onPress={() => setActiveTab('schedule')}>
          <Text style={s.backBtnText}>← {T('btn_back')}</Text>
        </TouchableOpacity>

        <View style={[s.detailBadgeWrap, isOd ? { backgroundColor: COLORS.overdueBg } : isSoon ? { backgroundColor: COLORS.soonBg } : { backgroundColor: COLORS.okBg }]}>
          <Text style={[s.detailBadgeText, isOd ? { color: COLORS.overdueText } : isSoon ? { color: COLORS.soonText } : { color: COLORS.okText }]}>
            {isOd ? T('svc_status_overdue') : isSoon ? T('svc_status_due_soon') : T('svc_status_ok')}
          </Text>
        </View>

        <Text style={s.detailTitle}>{name}</Text>
        <Text style={s.detailVehicle}>{activeVehicle.year} {activeVehicle.make} {activeVehicle.model}</Text>

        <View style={s.card}>
          <Text style={s.sectionLabel}>{lang === 'EN' ? 'Specifications' : 'Especificaciones'}</Text>
          {svc.spec && <View style={s.specRow}><Text style={s.specLabel}>{lang === 'EN' ? 'Spec' : 'Especificación'}</Text><Text style={s.specValue}>{svc.spec}</Text></View>}
          {svc.qty && <View style={s.specRow}><Text style={s.specLabel}>{lang === 'EN' ? 'Quantity' : 'Cantidad'}</Text><Text style={s.specValue}>{svc.qty}</Text></View>}
          <View style={s.specRow}>
            <Text style={s.specLabel}>{lang === 'EN' ? 'Interval' : 'Intervalo'}</Text>
            <Text style={s.specValue}>
              {svc.interval_miles ? `Every ${svc.interval_miles.toLocaleString()} mi` : ''}
              {svc.interval_miles && svc.interval_months ? ' / ' : ''}
              {svc.interval_months ? `${svc.interval_months} months` : ''}
            </Text>
          </View>
          {svc.milesUntilDue !== null && (
            <View style={s.specRow}>
              <Text style={s.specLabel}>{lang === 'EN' ? 'Status' : 'Estado'}</Text>
              <Text style={[s.specValue, isOd && { color: COLORS.overdueText }]}>
                {isOd
                  ? `${Math.abs(Math.round(svc.milesUntilDue)).toLocaleString()} mi overdue`
                  : `Due in ${Math.round(svc.milesUntilDue).toLocaleString()} mi — next at ${(Number(activeVehicle.mileage) + Math.round(svc.milesUntilDue)).toLocaleString()} mi`
                }
              </Text>
            </View>
          )}
          {svc.lastMileage > 0 && (
            <View style={s.specRow}>
              <Text style={s.specLabel}>{T('svc_logged_at')}</Text>
              <Text style={s.specValue}>{svc.lastMileage.toLocaleString()} mi</Text>
            </View>
          )}
        </View>

        {svc.notes && (
          <View style={[s.card, { backgroundColor: COLORS.recallBg, borderColor: COLORS.recallBorder }]}>
            <Text style={{ fontSize: 13, color: COLORS.accentDark, lineHeight: 18 }}>⚠ {svc.notes}</Text>
          </View>
        )}

        <View style={s.card}>
          <Text style={s.sectionLabel}>{T('svc_log_done')}</Text>
          <Text style={s.fieldLabel}>{lang === 'EN' ? 'Mileage when completed' : 'Kilometraje cuando se completó'}</Text>
          <TextInput
            style={s.input}
            value={mileageInput}
            onChangeText={setMileageInput}
            placeholder={lang === 'EN' ? 'Enter mileage...' : 'Ingresa el kilometraje...'}
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={s.primaryBtn} onPress={handleLogService}>
            <Text style={s.primaryBtnText}>{T('svc_log_done')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // HISTORY SCREEN
  // ─────────────────────────────────────────────
  function HistoryScreen() {
    const [filterVehicle, setFilterVehicle] = useState(activeVehicle);
    const [exporting, setExporting]         = useState(false);

    // Build flat list of all logged services
    function buildHistoryList(vehicle) {
      if (!vehicle) return [];
      const vKey = `${vehicle.year}_${vehicle.make}_${vehicle.model}`;
      const history = serviceHistory[vKey] || {};
      const schedule = getMaintenanceSchedule(vehicle.make, vehicle.model, vehicle.engine);
      if (!schedule) return [];

      const entries = [];
      Object.entries(history).forEach(([serviceId, record]) => {
        const svc = schedule.services.find(s => s.id === serviceId);
        if (svc) {
          entries.push({
            serviceId,
            name:      lang === 'ES' ? svc.nameES : svc.nameEN,
            nameEN:    svc.nameEN,
            mileage:   record.lastMileage,
            date:      record.lastDate,
            spec:      svc.spec,
            vehicle,
          });
        }
      });

      // Sort by mileage descending (most recent first)
      return entries.sort((a, b) => b.mileage - a.mileage);
    }

    // Also include fuel stops in history
    function buildFuelHistory(vehicle) {
      if (!vehicle) return [];
      const vKey = `${vehicle.year}_${vehicle.make}_${vehicle.model}`;
      return fuelLog
        .filter(e => e.vehicleKey === vKey)
        .map(e => ({
          serviceId: 'fuel_stop',
          name:      lang === 'EN' ? 'Fuel stop' : 'Parada de combustible',
          nameEN:    'Fuel stop',
          mileage:   e.mileage,
          date:      e.date,
          dateDisplay: e.dateDisplay,
          spec:      e.gallons ? `${e.gallons} gal${e.pricePerGal ? ` @ $${e.pricePerGal.toFixed(2)}/gal` : ''}` : null,
          vehicle,
          isFuel:    true,
        }));
    }

    const serviceEntries = buildHistoryList(filterVehicle);
    const fuelEntries    = buildFuelHistory(filterVehicle);
    const allEntries     = [...serviceEntries, ...fuelEntries].sort((a, b) => b.mileage - a.mileage);
    const totalServices  = serviceEntries.length;

    // Export as text summary (Share sheet)
    async function handleExport() {
      if (!filterVehicle) return;
      setExporting(true);

      const vehicle = filterVehicle;
      const lines = [
        `AUTOCOACH SERVICE HISTORY`,
        `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        vehicle.engine ? `Engine: ${vehicle.engine}` : '',
        vehicle.mileage ? `Current mileage: ${Number(vehicle.mileage).toLocaleString()} mi` : '',
        `Exported: ${new Date().toLocaleString()}`,
        `Generated by AutoCoach — coachplatform.app`,
        '',
        '═══════════════════════════════════',
        'SERVICE RECORDS',
        '═══════════════════════════════════',
        '',
      ];

      serviceEntries.forEach(e => {
        lines.push(`• ${e.nameEN}`);
        lines.push(`  Mileage: ${e.mileage.toLocaleString()} mi`);
        lines.push(`  Date: ${new Date(e.date).toLocaleDateString()}`);
        if (e.spec) lines.push(`  Spec: ${e.spec}`);
        lines.push('');
      });

      if (fuelEntries.length > 0) {
        lines.push('═══════════════════════════════════');
        lines.push('FUEL LOG');
        lines.push('═══════════════════════════════════');
        lines.push('');
        fuelEntries.forEach(e => {
          lines.push(`• Fuel stop — ${e.mileage.toLocaleString()} mi`);
          if (e.spec) lines.push(`  ${e.spec}`);
          lines.push(`  Date: ${e.dateDisplay || new Date(e.date).toLocaleString()}`);
          lines.push('');
        });
      }

      lines.push('═══════════════════════════════════');
      lines.push(`Total services logged: ${totalServices}`);
      lines.push(`Total fuel stops: ${fuelEntries.length}`);
      lines.push('');
      lines.push('AutoCoach by Coach Platform LLC');
      lines.push('coachplatform.app');

      try {
        await Share.share({
          title: `${vehicle.year} ${vehicle.make} ${vehicle.model} — Service History`,
          message: lines.filter(Boolean).join('\n'),
        });
      } catch (e) {
        Alert.alert('', lang === 'EN' ? 'Could not share service history.' : 'No se pudo compartir el historial.');
      }
      setExporting(false);
    }

    return (
      <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>

        {/* Vehicle chips */}
        {vehicles.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.vehicleChipRow}>
            {vehicles.map((v, i) => (
              <TouchableOpacity
                key={i}
                style={[s.vehicleChip, filterVehicle === v && s.vehicleChipActive]}
                onPress={() => setFilterVehicle(v)}
              >
                <Text style={[s.vehicleChipText, filterVehicle === v && s.vehicleChipTextActive]}>
                  {v.year} {v.make} {v.model}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Stats */}
        <View style={s.statRow}>
          <View style={s.statCard}>
            <Text style={s.statVal}>{totalServices}</Text>
            <Text style={s.statLabel}>{lang === 'EN' ? 'Services' : 'Servicios'}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statVal}>{fuelEntries.length}</Text>
            <Text style={s.statLabel}>{lang === 'EN' ? 'Fuel stops' : 'Paradas'}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statVal}>{allEntries.length}</Text>
            <Text style={s.statLabel}>{lang === 'EN' ? 'Total records' : 'Total registros'}</Text>
          </View>
        </View>

        {/* Export button */}
        {allEntries.length > 0 && (
          <TouchableOpacity
            style={[s.exportBtn, exporting && { opacity: 0.6 }]}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={s.exportBtnText}>
                  📤 {lang === 'EN' ? 'Export service history' : 'Exportar historial'}
                </Text>
            }
          </TouchableOpacity>
        )}

        {/* History list */}
        {allEntries.length === 0 ? (
          <View style={[s.emptyWrap, { paddingVertical: 40 }]}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>
              {lang === 'EN' ? 'No service history yet' : 'Sin historial de servicios aún'}
            </Text>
            <Text style={s.emptyBody}>
              {lang === 'EN'
                ? 'Log services from the Schedule tab to build your maintenance record.'
                : 'Registra servicios desde la pestaña Horario para construir tu historial.'}
            </Text>
          </View>
        ) : (
          <View style={s.card}>
            {allEntries.map((entry, i) => (
              <View key={i} style={s.serviceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.serviceName}>
                    {entry.isFuel ? '⛽' : '🔧'} {entry.name}
                  </Text>
                  <Text style={s.serviceDue}>
                    {entry.mileage.toLocaleString()} mi
                    {' · '}
                    {entry.dateDisplay || new Date(entry.date).toLocaleDateString()}
                  </Text>
                  {entry.spec && <Text style={s.serviceSpec}>{entry.spec}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Edmunds resale value banner */}
        {allEntries.length >= 3 && (
          <TouchableOpacity style={s.edmundsBanner} onPress={() => openAffiliateLink('EDMUNDS')}>
            <Text style={s.edmundsBannerTitle}>
              📈 {lang === 'EN' ? 'Know your vehicle\'s value' : 'Conoce el valor de tu vehículo'}
            </Text>
            <Text style={s.edmundsBannerBody}>
              {lang === 'EN'
                ? 'A documented service history increases resale value. See what your vehicle is worth on Edmunds.'
                : 'Un historial documentado aumenta el valor de reventa. Consulta el valor en Edmunds.'}
            </Text>
            <Text style={s.edmundsBannerCta}>{lang === 'EN' ? 'Get estimate →' : 'Obtener estimado →'}</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // FUEL SCREEN
  // ─────────────────────────────────────────────
  function FuelScreen() {
    const [showAddForm, setShowAddForm]     = useState(false);
    const [mileage, setMileage]             = useState('');
    const [gallons, setGallons]             = useState('');
    const [pricePerGal, setPricePerGal]     = useState('');
    const [showCamera, setShowCamera]       = useState(false);
    const [odometerPhoto, setOdometerPhoto] = useState(null);
    const [showReceiptCamera, setShowReceiptCamera] = useState(false);
    const [receiptScanning, setReceiptScanning]     = useState(false);
    const [scannedDateTime, setScannedDateTime]     = useState(null);

    const activeVehicleKey = activeVehicle
      ? `${activeVehicle.year}_${activeVehicle.make}_${activeVehicle.model}`
      : null;
    const vehicleFuelLog = fuelLog.filter(e => e.vehicleKey === activeVehicleKey);

    function calcMPG(entries) {
      if (entries.length < 2) return null;
      const sorted = [...entries].sort((a, b) => a.mileage - b.mileage);
      const miles = sorted[sorted.length - 1].mileage - sorted[0].mileage;
      const gallonsTotal = sorted.slice(1).reduce((sum, e) => sum + e.gallons, 0);
      if (gallonsTotal === 0) return null;
      return (miles / gallonsTotal).toFixed(1);
    }

    const mpg = calcMPG(vehicleFuelLog);
    const totalSpent = vehicleFuelLog.reduce((sum, e) => sum + (e.totalCost || 0), 0);

    function handleAddFuelStop() {
      if (!mileage || !gallons) {
        Alert.alert('', lang === 'EN' ? 'Mileage and gallons are required.' : 'El kilometraje y los galones son obligatorios.');
        return;
      }
      if (!activeVehicle) {
        Alert.alert('', lang === 'EN' ? 'Please add a vehicle first.' : 'Por favor agrega un vehículo primero.');
        return;
      }
      const miles = parseFloat(mileage.replace(/,/g, ''));
      const gals  = parseFloat(gallons);
      const price = parseFloat(pricePerGal) || 0;
      const total = price > 0 ? gals * price : 0;

      // Use the receipt's own date/time if this entry came from a scan;
      // otherwise stamp it with the current date/time as usual.
      const effectiveDate = scannedDateTime || new Date();

      const entry = {
        vehicleKey:    activeVehicleKey,
        mileage:       miles,
        gallons:       gals,
        pricePerGal:   price,
        totalCost:     total,
        date:          effectiveDate.toISOString(),
        dateDisplay:   effectiveDate.toLocaleString(),
        fromScan:      !!scannedDateTime,
        odometerPhoto: odometerPhoto || null,
      };

      const updated = [entry, ...fuelLog];
      setFuelLog(updated);
      AsyncStorage.setItem('autocoach_fuel_log', JSON.stringify(updated));
      setMileage(''); setGallons(''); setPricePerGal('');
      setOdometerPhoto(null); setShowAddForm(false); setScannedDateTime(null);

      Alert.alert(
        lang === 'EN' ? 'Fuel stop logged ✓' : 'Parada registrada ✓',
        lang === 'EN'
          ? `${gals} gal at ${miles.toLocaleString()} mi${price ? ` — $${total.toFixed(2)}` : ''}`
          : `${gals} gal a ${miles.toLocaleString()} mi${price ? ` — $${total.toFixed(2)}` : ''}`
      );
    }

    // Parses OCR's "YYYY-MM-DD" + "HH:MM" (24hr) into a real Date object.
    // Falls back gracefully: date-only uses midnight; totally invalid/missing
    // input returns null (caller then falls back to "now" at save time).
    function parseReceiptDateTime(dateStr, timeStr) {
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
      const [y, m, d] = dateStr.split('-').map(Number);
      let hh = 0, mm = 0;
      if (timeStr && /^\d{1,2}:\d{2}$/.test(timeStr)) {
        [hh, mm] = timeStr.split(':').map(Number);
      }
      const dt = new Date(y, m - 1, d, hh, mm);
      return isNaN(dt.getTime()) ? null : dt;
    }

    // Called once Ankit's real camera capture produces a base64 photo of a
    // fuel receipt — auto-fills gallons, price/gal, AND the entry's actual
    // date/time (rather than stamping "now") from the extraction.
    async function handleReceiptPhotoResult(base64Image) {
      setReceiptScanning(true);
      const result = await callOCR(base64Image, 'fuel_receipt');
      setReceiptScanning(false);
      setShowReceiptCamera(false);
      if (result && (result.gallons || result.price_per_gallon)) {
        if (result.gallons) setGallons(String(result.gallons));
        if (result.price_per_gallon) setPricePerGal(String(result.price_per_gallon));

        const parsedDate = parseReceiptDateTime(result.date, result.time);
        setScannedDateTime(parsedDate);

        setShowAddForm(true);
        Alert.alert(
          '',
          lang === 'EN'
            ? `Scanned: ${result.gallons ?? '?'} gal @ $${result.price_per_gallon ?? '?'}/gal${parsedDate ? ` — ${parsedDate.toLocaleString()}` : ' — date not read, using today'}. Review before saving.`
            : `Escaneado: ${result.gallons ?? '?'} gal @ $${result.price_per_gallon ?? '?'}/gal${parsedDate ? ` — ${parsedDate.toLocaleString()}` : ' — fecha no leída, usando hoy'}. Revisa antes de guardar.`
        );
      } else {
        Alert.alert('', lang === 'EN' ? "Couldn't read that receipt. Please enter the details manually." : 'No se pudo leer el recibo. Por favor ingresa los datos manualmente.');
      }
    }

    if (showReceiptCamera) {
      return (
        <ScannerCamera 
          lang={lang} 
          onPhotoTaken={handleReceiptPhotoResult} 
          onClose={() => setShowReceiptCamera(false)} 
        />
      );
    }

    if (showCamera) {
      return (
        <ScannerCamera 
          lang={lang} 
          onPhotoTaken={async (b64) => {
            setShowCamera(false);
            const result = await callOCR(b64, 'odometer');
            if (result && result.mileage) {
              setMileage(String(result.mileage));
            } else {
              Alert.alert('', SOW_TRANSLATIONS[lang]?.odo_read_error || SOW_TRANSLATIONS.EN.odo_read_error);
            }
          }} 
          onClose={() => setShowCamera(false)} 
        />
      );
    }

    return (
      <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>
        {vehicles.length > 0 && (
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
        )}

        <View style={s.statRow}>
          <View style={s.statCard}>
            <Text style={s.statVal}>{mpg ? mpg : '—'}</Text>
            <Text style={s.statLabel}>{lang === 'EN' ? 'Avg MPG' : 'MPG prom.'}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statVal}>{vehicleFuelLog.length}</Text>
            <Text style={s.statLabel}>{lang === 'EN' ? 'Fill-ups' : 'Repostajes'}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statVal}>${totalSpent > 0 ? totalSpent.toFixed(0) : '0'}</Text>
            <Text style={s.statLabel}>{lang === 'EN' ? 'Total spent' : 'Total gastado'}</Text>
          </View>
        </View>

        <TouchableOpacity style={s.addVehicleBtn} onPress={() => { setShowAddForm(!showAddForm); setScannedDateTime(null); }}>
          <Text style={s.addVehicleBtnText}>
            {showAddForm
              ? (lang === 'EN' ? '✕ Cancel' : '✕ Cancelar')
              : (lang === 'EN' ? '⛽ Log fuel stop' : '⛽ Registrar parada')
            }
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.addVehicleBtnSecondary} onPress={() => setShowReceiptCamera(true)}>
          <Text style={s.addVehicleBtnSecondaryText}>🧾 {lang === 'EN' ? 'Scan receipt (auto-fill)' : 'Escanear recibo (auto-completar)'}</Text>
        </TouchableOpacity>

        {showAddForm && (
          <View style={[s.card, { marginTop: 12 }]}>
            <Text style={s.sectionLabel}>{lang === 'EN' ? 'New fuel stop' : 'Nueva parada'}</Text>

            {scannedDateTime && (
              <View style={[s.vinVerifiedBadge, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={s.vinVerifiedText}>
                  📅 {lang === 'EN' ? 'From receipt:' : 'Del recibo:'} {scannedDateTime.toLocaleString()}
                </Text>
                <TouchableOpacity onPress={() => setScannedDateTime(null)}>
                  <Text style={{ color: COLORS.accentDark, fontSize: 12, fontWeight: '600' }}>
                    {lang === 'EN' ? 'Use today' : 'Usar hoy'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={s.fieldRow}>
              <View style={s.fieldHalf}>
                <Text style={s.fieldLabel}>{lang === 'EN' ? 'Mileage' : 'Kilometraje'}</Text>
                <TextInput style={s.input} value={mileage} onChangeText={setMileage} placeholder={activeVehicle?.mileage ? String(activeVehicle.mileage) : '94,210'} placeholderTextColor={COLORS.textMuted} keyboardType="number-pad" />
              </View>
              <View style={s.fieldHalf}>
                <Text style={s.fieldLabel}>{lang === 'EN' ? 'Gallons' : 'Galones'}</Text>
                <TextInput style={s.input} value={gallons} onChangeText={setGallons} placeholder="24.5" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />
              </View>
            </View>
            <Text style={s.fieldLabel}>{lang === 'EN' ? 'Odometer photo (optional)' : 'Foto del odómetro (opcional)'}</Text>
            <TouchableOpacity style={cs.photoBtn} onPress={() => setShowCamera(true)}>
              <Text style={cs.photoBtnText}>
                {odometerPhoto
                  ? (lang === 'EN' ? '📸 Photo captured — tap to retake' : '📸 Foto capturada — toca para repetir')
                  : (lang === 'EN' ? '📸 Take odometer photo' : '📸 Tomar foto del odómetro')
                }
              </Text>
            </TouchableOpacity>
            <Text style={s.fieldLabel}>{lang === 'EN' ? 'Price per gallon (optional)' : 'Precio por galón (opcional)'}</Text>
            <TextInput style={s.input} value={pricePerGal} onChangeText={setPricePerGal} placeholder="$3.89" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />
            <TouchableOpacity style={s.primaryBtn} onPress={handleAddFuelStop}>
              <Text style={s.primaryBtnText}>{lang === 'EN' ? 'Log fuel stop' : 'Registrar parada'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {vehicleFuelLog.length === 0 ? (
          <View style={[s.emptyWrap, { paddingVertical: 40 }]}>
            <Text style={s.emptyIcon}>⛽</Text>
            <Text style={s.emptyTitle}>{lang === 'EN' ? 'No fuel stops logged yet' : 'No hay paradas registradas aún'}</Text>
            <Text style={s.emptyBody}>{lang === 'EN' ? 'Log your fill-ups to track MPG and fuel spending.' : 'Registra tus repostajes para rastrear MPG y gastos.'}</Text>
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            <Text style={s.serviceSectionTitle}>{lang === 'EN' ? 'Recent fill-ups' : 'Repostajes recientes'}</Text>
            <View style={s.card}>
              {vehicleFuelLog.map((entry, i) => {
                const date = new Date(entry.date).toLocaleDateString();
                const entryMPG = i < vehicleFuelLog.length - 1
                  ? ((entry.mileage - vehicleFuelLog[i + 1].mileage) / entry.gallons).toFixed(1)
                  : null;
                return (
                  <View key={i} style={s.serviceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.serviceName}>{entry.mileage.toLocaleString()} mi — {entry.gallons} {lang === 'EN' ? 'gal' : 'gal'}</Text>
                      <Text style={s.serviceDue}>
                        {entry.dateDisplay || date}
                        {entryMPG ? ` · ${entryMPG} MPG` : ''}
                        {entry.totalCost > 0 ? ` · $${entry.totalCost.toFixed(2)}` : ''}
                      </Text>
                    </View>
                    {entry.pricePerGal > 0 && <Text style={s.serviceSpec}>${entry.pricePerGal.toFixed(2)}/gal</Text>}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <TouchableOpacity style={s.upsideBanner} onPress={() => openAffiliateLink('UPSIDE')}>
          <Text style={s.upsideBannerTitle}>⛽ {lang === 'EN' ? 'AutoCoach Fuel Rewards' : 'Recompensas de Combustible'}</Text>
          <Text style={s.upsideBannerBody}>{lang === 'EN' ? 'Earn up to 25¢/gal cashback at 45,000+ stations' : 'Gana hasta 25¢/gal de reembolso en más de 45,000 gasolineras'}</Text>
          <Text style={s.upsideBannerCta}>{lang === 'EN' ? 'Learn more →' : 'Más información →'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // SHOP SCREEN
  // ─────────────────────────────────────────────
  function ShopScreen() {
    const [shopVehicle, setShopVehicle] = useState(activeVehicle);

    const schedule = shopVehicle
      ? getMaintenanceSchedule(shopVehicle.make, shopVehicle.model, shopVehicle.engine)
      : null;
    const vKey = shopVehicle ? `${shopVehicle.year}_${shopVehicle.make}_${shopVehicle.model}` : null;

    let dueNow = [], comingUp = [];
    if (schedule && shopVehicle?.mileage) {
      const due = calculateDueServices(schedule.services, Number(shopVehicle.mileage), serviceHistory[vKey] || {}, mileageInterval);
      dueNow   = due.filter(sv => sv.status === 'overdue');
      comingUp = due.filter(sv => sv.status === 'due_soon');
    }

    const vehicleLabel = shopVehicle ? `${shopVehicle.year} ${shopVehicle.make} ${shopVehicle.model}` : '';
    const tireIsDue = [...dueNow, ...comingUp].some(sv => sv.id === 'tire_rotation');

    function isOemPart(svc) {
      return /oem/i.test(svc.spec || '') || /oem/i.test(svc.notes || '');
    }

    function PartCard({ svc }) {
      const map  = SERVICE_SHOP_MAP[svc.id] || DEFAULT_SHOP_ENTRY;
      const name = lang === 'ES' ? svc.nameES : svc.nameEN;

      return (
        <View style={s.shopCard}>
          <View style={s.shopCardHeader}>
            <Text style={s.shopCardIcon}>{map.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.shopCardTitle}>{name}</Text>
              <Text style={s.shopCardBody}>{T('shop_exact_fit')} {vehicleLabel}</Text>
              {isOemPart(svc) && (
                <View style={s.oemBadge}><Text style={s.oemBadgeText}>{T('shop_oem_part')}</Text></View>
              )}
            </View>
          </View>
          <TouchableOpacity style={s.shopBuyBtn} onPress={() => openAffiliateLink(map.primary)}>
            <Text style={s.shopBuyBtnText}>{T('shop_buy')} — {AFFILIATE_LABELS[map.primary]}</Text>
          </TouchableOpacity>
          {map.alternates?.length > 0 && (
            <View style={s.shopAltRow}>
              {map.alternates.map((key, i) => (
                <TouchableOpacity key={i} onPress={() => openAffiliateLink(key)}>
                  <Text style={s.shopAltLink}>{T('shop_view')} — {AFFILIATE_LABELS[key]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    }

    return (
      <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>
        <Text style={s.screenTitle}>{T('shop_title')}</Text>
        <Text style={s.shopSubtitle}>{T('shop_subtitle')}</Text>

        {vehicles.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.vehicleChipRow}>
            {vehicles.map((v, i) => (
              <TouchableOpacity
                key={i}
                style={[s.vehicleChip, shopVehicle === v && s.vehicleChipActive]}
                onPress={() => setShopVehicle(v)}
              >
                <Text style={[s.vehicleChipText, shopVehicle === v && s.vehicleChipTextActive]}>
                  {v.year} {v.make} {v.model}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {dueNow.length > 0 && (
          <View style={s.serviceSection}>
            <Text style={s.serviceSectionTitle}>🔴 {T('shop_due_now')} ({dueNow.length})</Text>
            {dueNow.map((svc, i) => <PartCard key={i} svc={svc} />)}
          </View>
        )}

        {comingUp.length > 0 && (
          <View style={s.serviceSection}>
            <Text style={s.serviceSectionTitle}>🟡 {T('shop_coming_up')} ({comingUp.length})</Text>
            {comingUp.map((svc, i) => <PartCard key={i} svc={svc} />)}
          </View>
        )}

        {shopVehicle && dueNow.length === 0 && comingUp.length === 0 && (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 24 }]}>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 19 }}>
              {T('shop_empty')}
            </Text>
          </View>
        )}

        {/* Tires — always shown */}
        <View style={s.serviceSection}>
          <View style={s.shopCard}>
            <View style={s.shopCardHeader}>
              <Text style={s.shopCardIcon}>🛞</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.shopCardTitle}>{T('shop_tires')}</Text>
                <Text style={s.shopCardBody}>
                  {T('shop_exact_fit')} {vehicleLabel || (lang === 'EN' ? 'your vehicle' : 'tu vehículo')}
                </Text>
              </View>
              {tireIsDue && (
                <View style={s.shopDueBadge}><Text style={s.shopDueBadgeText}>{T('shop_due_now')}</Text></View>
              )}
            </View>
            <TouchableOpacity style={s.shopBuyBtn} onPress={() => openAffiliateLink('TIRE_RACK')}>
              <Text style={s.shopBuyBtnText}>{T('shop_buy')} — {AFFILIATE_LABELS.TIRE_RACK}</Text>
            </TouchableOpacity>
            <View style={s.shopAltRow}>
              <TouchableOpacity onPress={() => openAffiliateLink('SIMPLE_TIRE')}>
                <Text style={s.shopAltLink}>{T('shop_view')} — {AFFILIATE_LABELS.SIMPLE_TIRE}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openAffiliateLink('MAVIS')}>
                <Text style={s.shopAltLink}>{T('shop_view')} — {AFFILIATE_LABELS.MAVIS}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Detailing — always shown */}
        <View style={s.serviceSection}>
          <View style={s.shopCard}>
            <View style={s.shopCardHeader}>
              <Text style={s.shopCardIcon}>🧽</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.shopCardTitle}>{T('shop_detailing')}</Text>
              </View>
            </View>
            <TouchableOpacity style={s.shopBuyBtn} onPress={() => openAffiliateLink('CHEMICAL_GUYS')}>
              <Text style={s.shopBuyBtnText}>{T('shop_buy')} — {AFFILIATE_LABELS.CHEMICAL_GUYS}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* All parts catch-all */}
        <TouchableOpacity style={s.shopAllPartsRow} onPress={() => openAffiliateLink('ADVANCE_AUTO')}>
          <Text style={s.shopAllPartsText}>🔎 {T('shop_all_parts')}</Text>
          <Text style={s.shopAllPartsArrow}>›</Text>
        </TouchableOpacity>

        {/* Local car wash deals */}
        <TouchableOpacity style={s.carWashBanner} onPress={() => openAffiliateLink('UPSIDE')}>
          <Text style={s.carWashTitle}>🚿 {T('shop_car_wash_title')}</Text>
          <Text style={s.carWashSubtitle}>{T('shop_car_wash_subtitle')}</Text>
          <Text style={s.carWashCta}>{T('shop_car_wash_cta')} →</Text>
        </TouchableOpacity>

        <View style={s.shopDisclaimerBox}>
          <Text style={s.shopDisclaimerText}>{T('shop_affiliate_disclosure')}</Text>
        </View>
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // PAYWALL SCREEN
  // No free tier — this is the only path to unlocking vehicle-adding.
  // FleetPricingCalculator.js owns the tier picker, pricing math, and the
  // subscribe/enterprise CTAs; this screen wraps it with the value-prop
  // header, feature list, and legal footer.
  // ─────────────────────────────────────────────
  function PaywallScreen() {
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>
        <TouchableOpacity style={s.backBtn} onPress={() => setActiveTab('garage')}>
          <Text style={s.backBtnText}>← {T('btn_back')}</Text>
        </TouchableOpacity>

        <Text style={s.screenTitle}>{T('paywall_title')}</Text>
        <Text style={s.paywallSubtitle}>{T('paywall_subtitle')}</Text>

        <View style={s.card}>
          {[1, 2, 3, 4, 5, 6, 7].map(n => (
            <View key={n} style={s.paywallFeatureRow}>
              <Text style={s.paywallFeatureCheck}>✓</Text>
              <Text style={s.paywallFeatureText}>{T(`paywall_feature_${n}`)}</Text>
            </View>
          ))}
        </View>

        <FleetPricingCalculator
          lang={lang}
          onSubscribe={handleSubscribe}
          onContact={handleEnterpriseContact}
        />

        <View style={[s.paywallFooterRow, { flexWrap: 'wrap', paddingHorizontal: 20 }]}>
          <TouchableOpacity onPress={handleRestorePurchases} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <Text style={s.paywallFooterLink}>{T('paywall_restore')}</Text>
          </TouchableOpacity>
          <Text style={s.paywallFooterDot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://coachplatform.app/terms.html')} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <Text style={[s.paywallFooterLink, { textAlign: 'center' }]}>{T('paywall_terms')}</Text>
          </TouchableOpacity>
          <Text style={s.paywallFooterDot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://coachplatform.app/privacy.html')} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <Text style={[s.paywallFooterLink, { textAlign: 'center' }]}>{T('settings_privacy')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.paywallNoFreeTier}>{T('paywall_no_free_tier')}</Text>
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // ADD VEHICLE SCREEN
  // ─────────────────────────────────────────────
  function AddVehicleScreen() {
    const [vin, setVin]               = useState('');
    const [vinLoading, setVinLoading] = useState(false);
    const [vinResult, setVinResult]   = useState(null);
    const [selectedMake,   setSelectedMake]   = useState('');
    const [selectedModel,  setSelectedModel]  = useState('');
    const [selectedEngine, setSelectedEngine] = useState('');
    const [selectedYear,   setSelectedYear]   = useState('');
    const [mileage,        setMileage]        = useState('');
    const [nickname,       setNickname]       = useState('');
    const [showVinCamera,  setShowVinCamera]  = useState(false);
    const [vinScanning,    setVinScanning]    = useState(false);

    const allMakes   = getAllMakes();
    const allModels  = selectedMake  ? getModelsForMake(selectedMake)  : [];
    const allEngines = (selectedMake && selectedModel) ? getEnginesForMakeModel(selectedMake, selectedModel) : [];
    const allYears   = (selectedMake && selectedModel) ? getYearsForMakeModel(selectedMake, selectedModel).map(String).sort((a,b) => b-a) : [];

    function onMakeSelect(make)   { setSelectedMake(make); setSelectedModel(''); setSelectedEngine(''); setSelectedYear(''); }
    function onModelSelect(model) { setSelectedModel(model); setSelectedEngine(''); setSelectedYear(''); }

    // Called once Ankit's real camera capture produces a base64 photo.
    // Wired end-to-end already — just needs a real image passed in instead
    // of the placeholder camera screen below.
    async function handleVinPhotoResult(base64Image) {
      setVinScanning(true);
      const result = await callOCR(base64Image, 'vin');
      setVinScanning(false);
      setShowVinCamera(false);
      if (result && result.vin) {
        setVin(result.vin);
        Alert.alert(
          '',
          lang === 'EN' ? `Scanned VIN: ${result.vin}. Tap Decode to fill in details.` : `VIN escaneado: ${result.vin}. Toca Decodificar para completar los datos.`
        );
      } else {
        Alert.alert('', lang === 'EN' ? "Couldn't read a VIN from that photo. Try again or enter it manually." : 'No se pudo leer un VIN en esa foto. Intenta de nuevo o ingrésalo manualmente.');
      }
    }

    async function lookupVIN() {
      if (vin.length < 17) { Alert.alert('', T('add_vehicle_vin_invalid')); return; }
      setVinLoading(true);
      try {
        const result = await decodeVIN(vin);
        if (result && result.isValid) {
          setVinResult(result);
          setSelectedMake(result.make); setSelectedModel(result.model);
          setSelectedEngine(result.engine); setSelectedYear(result.year);
        } else { Alert.alert('', T('add_vehicle_vin_invalid')); }
      } catch (e) { Alert.alert('', T('error_network')); }
      setVinLoading(false);
    }

    function handleAdd() {
      if (!selectedYear || !selectedMake || !selectedModel) { Alert.alert('', T('required')); return; }
      addVehicle({
        vin: vin || null, year: selectedYear, make: selectedMake,
        model: selectedModel, engine: selectedEngine,
        mileage: mileage ? parseInt(mileage.replace(/,/g, '')) : null,
        nickname: nickname || null, addedAt: new Date().toISOString(),
      });
    }

    if (showVinCamera) {
      return (
        <ScannerCamera 
          lang={lang} 
          onPhotoTaken={handleVinPhotoResult} 
          onClose={() => setShowVinCamera(false)} 
        />
      );
    }

    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={s.screen} contentContainerStyle={s.screenContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={s.backBtn} onPress={() => setActiveTab('garage')}>
            <Text style={s.backBtnText}>← {T('btn_back')}</Text>
          </TouchableOpacity>
          <Text style={s.screenTitle}>{T('add_vehicle_title')}</Text>

          <View style={s.card}>
            <Text style={s.sectionLabel}>{lang === 'EN' ? 'VIN (optional — auto-fills details)' : 'VIN (opcional — rellena datos automáticamente)'}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput style={[s.input, { flex: 1 }]} value={vin} onChangeText={t => setVin(t.toUpperCase())} placeholder={T('add_vehicle_vin_placeholder')} placeholderTextColor={COLORS.textMuted} autoCapitalize="characters" maxLength={17} />
              <TouchableOpacity style={s.vinBtn} onPress={() => setShowVinCamera(true)}>
                <Text style={s.vinBtnText}>📸 {lang === 'EN' ? 'Scan' : 'Escanear'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.vinBtn, vinLoading && { opacity: 0.6 }]} onPress={lookupVIN} disabled={vinLoading}>
                {vinLoading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={s.vinBtnText}>{lang === 'EN' ? 'Decode' : 'Decodificar'}</Text>}
              </TouchableOpacity>
            </View>
            {vinResult && <View style={s.vinVerifiedBadge}><Text style={s.vinVerifiedText}>✓ {T('add_vehicle_vin_verified')}</Text></View>}
          </View>

          <View style={s.card}>
            <Text style={s.sectionLabel}>{lang === 'EN' ? 'Vehicle details' : 'Detalles del vehículo'}</Text>
            <Text style={s.fieldLabel}>{T('add_vehicle_make')}</Text>
            <ScrollPicker items={allMakes} selectedValue={selectedMake} onSelect={onMakeSelect} label={T('add_vehicle_make')} placeholder={lang === 'EN' ? 'Select make...' : 'Seleccionar marca...'} lang={lang} />
            <Text style={s.fieldLabel}>{T('add_vehicle_model')}</Text>
            <ScrollPicker items={allModels} selectedValue={selectedModel} onSelect={onModelSelect} label={T('add_vehicle_model')} placeholder={selectedMake ? (lang === 'EN' ? 'Select model...' : 'Seleccionar modelo...') : (lang === 'EN' ? 'Select make first' : 'Primero selecciona la marca')} lang={lang} />
            <Text style={s.fieldLabel}>{T('add_vehicle_engine')}</Text>
            <ScrollPicker items={allEngines} selectedValue={selectedEngine} onSelect={setSelectedEngine} label={T('add_vehicle_engine')} placeholder={selectedModel ? (lang === 'EN' ? 'Select engine...' : 'Seleccionar motor...') : (lang === 'EN' ? 'Select model first' : 'Primero selecciona el modelo')} lang={lang} />
            <Text style={s.fieldLabel}>{lang === 'EN' ? 'Year' : 'Año'}</Text>
            <ScrollPicker items={allYears} selectedValue={selectedYear} onSelect={setSelectedYear} label={lang === 'EN' ? 'Year' : 'Año'} placeholder={selectedModel ? (lang === 'EN' ? 'Select year...' : 'Seleccionar año...') : (lang === 'EN' ? 'Select model first' : 'Primero selecciona el modelo')} lang={lang} />
            <Text style={s.fieldLabel}>{T('add_vehicle_odometer_label')}</Text>
            <TextInput style={s.input} value={mileage} onChangeText={setMileage} placeholder="94,210" placeholderTextColor={COLORS.textMuted} keyboardType="number-pad" />
            <Text style={s.fieldLabel}>{T('add_vehicle_nickname_label')}</Text>
            <TextInput style={s.input} value={nickname} onChangeText={setNickname} placeholder={T('add_vehicle_nickname_placeholder')} placeholderTextColor={COLORS.textMuted} />
          </View>

          <TouchableOpacity style={s.primaryBtn} onPress={handleAdd}>
            <Text style={s.primaryBtnText}>{T('add_vehicle_cta')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.requestVehicleBtn}
            onPress={() => Alert.alert(
              lang === 'EN' ? "Don't see your vehicle?" : "¿No ves tu vehículo?",
              lang === 'EN' ? "Email us at autocoach@coachplatform.app and we'll add it." : "Escríbenos a autocoach@coachplatform.app y lo agregaremos."
            )}
          >
            <Text style={s.requestVehicleBtnText}>{lang === 'EN' ? "Don't see your vehicle? Request it →" : "¿No ves tu vehículo? Solicítalo →"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────
  // SETTINGS SCREEN
  // ─────────────────────────────────────────────
  function SettingsScreen() {
    const tierLabels = {
      autocoach_solo: T('calc_name_solo'), autocoach_duo: T('calc_name_duo'),
      autocoach_family: T('calc_name_family'), autocoach_family_plus: T('calc_name_family_plus'),
      autocoach_fleet_s: T('calc_name_fleet_s'), autocoach_fleet_m: T('calc_name_fleet_m'),
      autocoach_fleet_l: T('calc_name_fleet_l'),
    };
    const planLabel = isPro && currentTier === 'reviewer_unlock'
      ? (lang === 'EN' ? 'Reviewer Access (test)' : 'Acceso de Revisor (prueba)')
      : isPro && currentTier
        ? (tierLabels[currentTier] ?? currentTier)
        : (lang === 'EN' ? 'Not subscribed' : 'No suscrito');

    function SettingsRow({ label, value, onPress, showArrow = true }) {
      return (
        <TouchableOpacity style={s.settingsRow} onPress={onPress} disabled={!onPress}>
          <Text style={s.settingsRowLabel}>{label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {value != null && <Text style={s.settingsRowValue}>{value}</Text>}
            {showArrow && onPress && <Text style={s.settingsRowArrow}>›</Text>}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <>
      <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>
        <TouchableOpacity style={s.backBtn} onPress={() => setActiveTab('garage')}>
          <Text style={s.backBtnText}>← {T('btn_back')}</Text>
        </TouchableOpacity>
        <Text style={s.screenTitle}>{T('settings_title')}</Text>

        {/* Account / Subscription */}
        <Text style={s.settingsSectionTitle}>{T('settings_account')}</Text>
        <View style={s.card}>
          <SettingsRow
            label={T('settings_subscription')}
            value={planLabel}
            onPress={() => setActiveTab('paywall')}
          />
          <SettingsRow
            label={T('settings_restore')}
            onPress={handleRestorePurchases}
          />
        </View>

        {/* Preferences */}
        <Text style={s.settingsSectionTitle}>{T('settings_notifications')} & {T('settings_units')}</Text>
        <View style={s.card}>
          <SettingsRow
            label={T('settings_language')}
            value={lang === 'EN' ? 'English' : 'Español'}
            onPress={toggleLang}
          />

          <View style={s.settingsDivider} />

          <Text style={s.settingsSubLabel}>{T('settings_units')}</Text>
          <View style={s.segmentRow}>
            <TouchableOpacity
              style={[s.segmentBtn, units === 'miles' && s.segmentBtnActive]}
              onPress={() => setUnitsAndSave('miles')}
            >
              <Text style={[s.segmentText, units === 'miles' && s.segmentTextActive]}>{T('settings_units_miles')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.segmentBtn, units === 'km' && s.segmentBtnActive]}
              onPress={() => setUnitsAndSave('km')}
            >
              <Text style={[s.segmentText, units === 'km' && s.segmentTextActive]}>{T('settings_units_km')}</Text>
            </TouchableOpacity>
          </View>
          {units === 'km' && (
            <Text style={s.settingsNote}>
              {lang === 'EN'
                ? 'Display unit saved — full km conversion across the app is coming in a future update.'
                : 'Unidad guardada — la conversión completa a km en toda la app llegará en una futura actualización.'}
            </Text>
          )}

          <View style={s.settingsDivider} />

          <Text style={s.settingsSubLabel}>{T('settings_mileage_interval')}</Text>
          <View style={s.segmentRow}>
            {[[500, 'settings_mileage_500'], [1000, 'settings_mileage_1000'], [2000, 'settings_mileage_2000']].map(([val, key]) => (
              <TouchableOpacity
                key={val}
                style={[s.segmentBtn, mileageInterval === val && s.segmentBtnActive]}
                onPress={() => setMileageIntervalAndSave(val)}
              >
                <Text style={[s.segmentText, mileageInterval === val && s.segmentTextActive]}>{T(key)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.settingsDivider} />

          <View style={s.settingsSwitchRow}>
            <Text style={s.settingsRowLabel}>{T('settings_notifications')}</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={s.settingsDivider} />

          <SettingsRow
            label={T('settings_location')}
            value={locationEnabled ? T('settings_location_enabled') : T('settings_location_disabled')}
            onPress={requestLocationAccess}
            showArrow={false}
          />
        </View>

        {/* Vehicle tools */}
        <Text style={s.settingsSectionTitle}>{lang === 'EN' ? 'Vehicle Tools' : 'Herramientas del Vehículo'}</Text>
        <View style={s.card}>
          <SettingsRow label={lang === 'EN' ? 'Vehicle Documents' : 'Documentos del Vehículo'} onPress={() => setActiveTab('documents')} />
          <SettingsRow label={lang === 'EN' ? 'In Case of an Accident' : 'En Caso de un Accidente'} onPress={() => setActiveTab('accidentChecklist')} />
        </View>

        {/* Support & Legal */}
        <Text style={s.settingsSectionTitle}>{lang === 'EN' ? 'Support & Legal' : 'Soporte y Legal'}</Text>
        <View style={s.card}>
          <SettingsRow label={T('settings_support')} onPress={() => setShowSupportChat(true)} />
          <SettingsRow label={T('settings_privacy')} onPress={() => Linking.openURL('https://coachplatform.app/privacy.html')} />
          <SettingsRow label={T('settings_terms')} onPress={() => Linking.openURL('https://coachplatform.app/terms.html')} />
        </View>

        {/* Danger zone */}
        <View style={[s.card, { borderColor: COLORS.overdueText }]}>
          <SettingsRow label={T('settings_sign_out')} onPress={handleResetApp} showArrow={false} />
        </View>

        <Text style={s.settingsVersion} onLongPress={() => setShowReviewModal(true)} delayLongPress={800}>
          {T('settings_version')} 1.0.0 (dev)
        </Text>
      </ScrollView>

      {/* Hidden store-reviewer bypass — see handleReviewCodeSubmit comment above */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowReviewModal(false); reviewCodeInputRef.current = ''; }}
      >
        <KeyboardAvoidingView
          style={s.reviewModalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.reviewModalCard}>
            <Text style={s.reviewModalTitle}>
              {lang === 'EN' ? 'Reviewer Access' : 'Acceso de Revisor'}
            </Text>
            <Text style={s.reviewModalBody}>
              {lang === 'EN'
                ? 'Enter the reviewer unlock code to enable full Pro access for testing.'
                : 'Ingresa el código de desbloqueo para habilitar el acceso Pro completo para pruebas.'}
            </Text>
            <TextInput
              style={s.reviewModalInput}
              defaultValue=""
              onChangeText={(t) => { reviewCodeInputRef.current = t; }}
              placeholder={lang === 'EN' ? 'Enter code' : 'Ingresa el código'}
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={[s.reviewModalBtn, s.reviewModalBtnCancel]}
                onPress={() => { setShowReviewModal(false); reviewCodeInputRef.current = ''; }}
              >
                <Text style={s.reviewModalBtnCancelText}>{lang === 'EN' ? 'Cancel' : 'Cancelar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.reviewModalBtn, s.reviewModalBtnSubmit]}
                onPress={handleReviewCodeSubmit}
              >
                <Text style={s.reviewModalBtnSubmitText}>{lang === 'EN' ? 'Unlock' : 'Desbloquear'}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>
      </>
    );
  }

  // ─────────────────────────────────────────────
  // DOCUMENTS SCREEN
  // Per-vehicle photo/document storage — insurance card, registration,
  // maintenance receipts, anything else worth keeping with the vehicle.
  // Photo capture uses the same placeholder pattern as the Fuel screen's
  // odometer photo today — Ankit wires the real expo-camera capture;
  // everything else here (storage, list, categorization) is fully real.
  // ─────────────────────────────────────────────
  const DOC_TYPES = [
    { key: 'insurance',   icon: '🪪', labelEN: 'Insurance',   labelES: 'Seguro' },
    { key: 'registration',icon: '📋', labelEN: 'Registration',labelES: 'Registro' },
    { key: 'maintenance', icon: '🧾', labelEN: 'Maintenance receipt', labelES: 'Recibo de mantenimiento' },
    { key: 'other',       icon: '📎', labelEN: 'Other',        labelES: 'Otro' },
  ];

  function DocumentsScreen() {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showCamera, setShowCamera]   = useState(false);
    const [docType, setDocType]         = useState('insurance');
    const [docLabel, setDocLabel]       = useState('');
    const [docPhoto, setDocPhoto]       = useState(null);

    if (!activeVehicle) {
      return (
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>📁</Text>
          <Text style={s.emptyTitle}>{lang === 'EN' ? 'No vehicle selected' : 'Ningún vehículo seleccionado'}</Text>
          <Text style={s.emptyBody}>{lang === 'EN' ? 'Select a vehicle from the Garage tab first.' : 'Primero selecciona un vehículo en la pestaña Garaje.'}</Text>
        </View>
      );
    }

    const vKey = `${activeVehicle.year}_${activeVehicle.make}_${activeVehicle.model}`;
    const vehicleDocs = documents.filter(d => d.vehicleKey === vKey);

    function handleSaveDoc() {
      if (!docLabel.trim()) {
        Alert.alert('', lang === 'EN' ? 'Please add a label for this document.' : 'Por favor agrega una etiqueta para este documento.');
        return;
      }
      const entry = {
        id: Date.now().toString(),
        vehicleKey: vKey,
        type: docType,
        label: docLabel.trim(),
        photoUri: docPhoto,
        date: new Date().toISOString(),
      };
      saveDocuments([entry, ...documents]);
      setDocLabel(''); setDocPhoto(null); setDocType('insurance'); setShowAddForm(false);
    }

    function handleDeleteDoc(id) {
      Alert.alert(
        lang === 'EN' ? 'Delete document?' : '¿Eliminar documento?',
        '',
        [
          { text: lang === 'EN' ? 'Cancel' : 'Cancelar', style: 'cancel' },
          { text: lang === 'EN' ? 'Delete' : 'Eliminar', style: 'destructive', onPress: () => saveDocuments(documents.filter(d => d.id !== id)) },
        ]
      );
    }

    if (showCamera) {
      return (
        <ScannerCamera 
          lang={lang} 
          onPhotoTaken={(b64) => {
            setDocPhoto(`data:image/jpeg;base64,${b64}`);
            setShowCamera(false);
          }} 
          onClose={() => setShowCamera(false)} 
        />
      );
    }

    return (
      <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>
        <Text style={s.screenTitle}>{lang === 'EN' ? 'Vehicle Documents' : 'Documentos del Vehículo'}</Text>
        <Text style={s.paywallSubtitle}>
          {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
        </Text>

        <TouchableOpacity style={s.addVehicleBtn} onPress={() => setShowAddForm(!showAddForm)}>
          <Text style={s.addVehicleBtnText}>
            {showAddForm ? (lang === 'EN' ? '✕ Cancel' : '✕ Cancelar') : '+ ' + (lang === 'EN' ? 'Add Document' : 'Agregar Documento')}
          </Text>
        </TouchableOpacity>

        {showAddForm && (
          <View style={[s.card, { marginTop: 12 }]}>
            <Text style={s.sectionLabel}>{lang === 'EN' ? 'Document type' : 'Tipo de documento'}</Text>
            <View style={s.segmentRow}>
              {DOC_TYPES.map(dt => (
                <TouchableOpacity
                  key={dt.key}
                  style={[s.segmentBtn, docType === dt.key && s.segmentBtnActive]}
                  onPress={() => setDocType(dt.key)}
                >
                  <Text style={[s.segmentText, docType === dt.key && s.segmentTextActive]}>{dt.icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>{lang === 'EN' ? 'Label' : 'Etiqueta'}</Text>
            <TextInput
              style={s.input}
              value={docLabel}
              onChangeText={setDocLabel}
              placeholder={lang === 'EN' ? 'e.g. State Farm Policy, Jiffy Lube 8/1/26' : 'p. ej. Póliza State Farm, Jiffy Lube 8/1/26'}
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity style={cs.photoBtn} onPress={() => setShowCamera(true)}>
              <Text style={cs.photoBtnText}>
                {docPhoto
                  ? (lang === 'EN' ? '📸 Photo captured — tap to retake' : '📸 Foto capturada — toca para repetir')
                  : (lang === 'EN' ? '📸 Add photo (optional)' : '📸 Agregar foto (opcional)')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.primaryBtn} onPress={handleSaveDoc}>
              <Text style={s.primaryBtnText}>{lang === 'EN' ? 'Save document' : 'Guardar documento'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {vehicleDocs.length === 0 ? (
          <View style={[s.emptyWrap, { paddingVertical: 40 }]}>
            <Text style={s.emptyIcon}>📁</Text>
            <Text style={s.emptyTitle}>{lang === 'EN' ? 'No documents saved yet' : 'Sin documentos guardados aún'}</Text>
            <Text style={s.emptyBody}>
              {lang === 'EN'
                ? 'Keep insurance cards, registration, and maintenance receipts all in one place with this vehicle.'
                : 'Guarda tarjetas de seguro, registro y recibos de mantenimiento en un solo lugar con este vehículo.'}
            </Text>
          </View>
        ) : (
          DOC_TYPES.map(dt => {
            const items = vehicleDocs.filter(d => d.type === dt.key);
            if (items.length === 0) return null;
            return (
              <View key={dt.key} style={s.serviceSection}>
                <Text style={s.serviceSectionTitle}>{dt.icon} {lang === 'EN' ? dt.labelEN : dt.labelES} ({items.length})</Text>
                <View style={s.card}>
                  {items.map(doc => (
                    <TouchableOpacity key={doc.id} style={s.serviceRow} onLongPress={() => handleDeleteDoc(doc.id)}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.serviceName}>{doc.label}</Text>
                        <Text style={s.serviceDue}>{new Date(doc.date).toLocaleDateString()}{doc.photoUri ? ' · 📸' : ''}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })
        )}
        {vehicleDocs.length > 0 && (
          <Text style={s.settingsNote}>{lang === 'EN' ? 'Long-press a document to delete it.' : 'Mantén presionado un documento para eliminarlo.'}</Text>
        )}
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // ACCIDENT CHECKLIST SCREEN
  // Pure reference content — no camera/OCR dependency, fully real today.
  // ─────────────────────────────────────────────
  function AccidentChecklistScreen() {
    const steps = lang === 'EN' ? [
      { icon: '🛑', title: 'Stop and check for injuries', body: 'Move to a safe location if possible. Check yourself and others for injuries before doing anything else.' },
      { icon: '🚨', title: 'Call 911 if needed', body: 'Call emergency services if anyone is injured, if the vehicles are blocking traffic, or if it\u2019s required by your state for the damage involved.' },
      { icon: '📸', title: 'Photograph everything', body: 'Take photos of all vehicles, license plates, damage, the surrounding scene, and road/weather conditions before anything is moved.' },
      { icon: '🪪', title: 'Exchange information', body: 'Get the other driver\u2019s name, phone number, insurance company, policy number, license plate, and driver\u2019s license number.' },
      { icon: '🤐', title: 'Don\u2019t admit fault', body: 'Stick to facts when speaking with the other driver, witnesses, or police. Avoid saying "I\u2019m sorry" or anything that could be taken as admitting fault.' },
      { icon: '👮', title: 'File a police report if required', body: 'Many states require a police report for accidents above a certain damage threshold. When in doubt, request one.' },
      { icon: '📞', title: 'Contact your insurance company', body: 'Report the accident as soon as possible, even for minor incidents \u2014 most policies require prompt notification.' },
      { icon: '🧾', title: 'Save this accident to AutoCoach', body: 'Once things are handled, log the incident as a document on this vehicle so everything is in one place if you need it later.' },
    ] : [
      { icon: '🛑', title: 'Detente y revisa si hay heridos', body: 'Muévete a un lugar seguro si es posible. Revísate a ti mismo y a otros antes de hacer cualquier otra cosa.' },
      { icon: '🚨', title: 'Llama al 911 si es necesario', body: 'Llama a servicios de emergencia si alguien está herido, si los vehículos bloquean el tráfico, o si tu estado lo requiere según el daño.' },
      { icon: '📸', title: 'Fotografía todo', body: 'Toma fotos de todos los vehículos, placas, daños, la escena y las condiciones del camino/clima antes de mover algo.' },
      { icon: '🪪', title: 'Intercambia información', body: 'Obtén el nombre, teléfono, aseguradora, número de póliza, placa y número de licencia del otro conductor.' },
      { icon: '🤐', title: 'No admitas culpa', body: 'Apégate a los hechos al hablar con el otro conductor, testigos o la policía. Evita decir "lo siento" o algo que se interprete como admitir culpa.' },
      { icon: '👮', title: 'Presenta un reporte policial si se requiere', body: 'Muchos estados requieren un reporte policial para accidentes sobre cierto umbral de daño. Si tienes dudas, solicita uno.' },
      { icon: '📞', title: 'Contacta a tu aseguradora', body: 'Reporta el accidente lo antes posible, incluso en incidentes menores \u2014 la mayoría de las pólizas requieren notificación pronta.' },
      { icon: '🧾', title: 'Guarda este accidente en AutoCoach', body: 'Una vez resuelto, registra el incidente como documento de este vehículo para tener todo en un solo lugar si lo necesitas después.' },
    ];

    return (
      <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>
        <TouchableOpacity style={s.backBtn} onPress={() => setActiveTab('garage')}>
          <Text style={s.backBtnText}>← {T('btn_back')}</Text>
        </TouchableOpacity>
        <Text style={s.screenTitle}>{lang === 'EN' ? 'In Case of an Accident' : 'En Caso de un Accidente'}</Text>
        <View style={[s.card, { backgroundColor: COLORS.recallBg, borderColor: COLORS.recallBorder, marginBottom: 20 }]}>
          <Text style={{ fontSize: 13, color: COLORS.accentDark, lineHeight: 19 }}>
            {lang === 'EN'
              ? 'Save this screen for quick access. It works even without a data connection once loaded.'
              : 'Guarda esta pantalla para acceso rápido. Funciona incluso sin conexión a datos una vez cargada.'}
          </Text>
        </View>
        {steps.map((step, i) => (
          <View key={i} style={s.shopCard}>
            <View style={s.shopCardHeader}>
              <Text style={s.shopCardIcon}>{step.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.shopCardTitle}>{i + 1}. {step.title}</Text>
                <Text style={s.shopCardBody}>{step.body}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // PLACEHOLDER
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
  if (checkingGate) {
    return (
      <SafeAreaView style={[s.safeArea, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar style="light" backgroundColor={COLORS.primary} />
        <ActivityIndicator color={COLORS.white} size="large" />
      </SafeAreaView>
    );
  }

  if (!onboardingDone || !disclaimerAgreed) {
    return (
      <OnboardingFlow
        lang={lang}
        toggleLang={toggleLang}
        onboardingDone={onboardingDone}
        onFinishOnboarding={completeOnboarding}
        onAgreeDisclaimer={agreeToDisclaimer}
      />
    );
  }

  if (showSupportChat) {
    return (
      <SupportChat
        lang={lang}
        appName="autocoach"
        onClose={() => setShowSupportChat(false)}
      />
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>{T('appName')}</Text>
          <Text style={s.headerSub}>{vehicles.length} {T('garage_stat_vehicles')}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={s.langBtn} onPress={toggleLang}>
            <Text style={s.langBtnText}>{lang === 'EN' ? 'EN | ES' : 'ES | EN'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.gearBtn} onPress={() => setActiveTab('settings')}>
            <Text style={s.gearBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.screenWrap}>{renderScreen()}</View>
      <View style={s.bottomNav}>
        {[
          { key: 'garage',   label: T('nav_garage'),  icon: '🏠' },
          { key: 'schedule', label: T('nav_schedule'), icon: '📅' },
          { key: 'shop',     label: T('nav_shop'),     icon: '🛒' },
          { key: 'history',  label: T('nav_history'),  icon: '📋' },
          { key: 'fuel',     label: T('nav_fuel'),     icon: '⛽' },
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

  header:      { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '600' },
  headerSub:   { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 1 },
  langBtn:     { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  langBtnText: { color: COLORS.white, fontSize: 11, fontWeight: '600' },
  gearBtn:     { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  gearBtnText: { fontSize: 14 },

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

  addVehicleBtn:              { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 32, alignItems: 'center' },
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

  vehicleChipRow:        { flexDirection: 'row', marginBottom: 14 },
  vehicleChip:           { backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 0.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  vehicleChipActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  vehicleChipText:       { fontSize: 12, color: COLORS.textMuted },
  vehicleChipTextActive: { color: COLORS.white, fontWeight: '600' },

  scheduleHeader:      { backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 14, marginBottom: 14 },
  scheduleVehicleName: { fontSize: 17, fontWeight: '700', color: COLORS.textNavy },
  scheduleVehicleSub:  { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  oilSpec:             { fontSize: 12, color: COLORS.accent, marginTop: 4, fontWeight: '500' },

  serviceSection:      { marginBottom: 14 },
  serviceSectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textNavy, marginBottom: 8 },
  card:        { backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 14, marginBottom: 14 },

  serviceRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  serviceName: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  serviceDue:  { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  serviceSpec: { fontSize: 11, color: COLORS.accent, marginTop: 2 },

  detailBadgeWrap:  { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 12 },
  detailBadgeText:  { fontSize: 13, fontWeight: '600' },
  detailTitle:      { fontSize: 24, fontWeight: '700', color: COLORS.textNavy, marginBottom: 4 },
  detailVehicle:    { fontSize: 14, color: COLORS.textMuted, marginBottom: 20 },
  specRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  specLabel:        { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  specValue:        { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500', flex: 2, textAlign: 'right' },

  backBtn:      { marginBottom: 16 },
  backBtnText:  { color: COLORS.accent, fontSize: 14, fontWeight: '500' },
  screenTitle:  { fontSize: 22, fontWeight: '700', color: COLORS.textNavy, marginBottom: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 },
  fieldLabel:   { fontSize: 12, fontWeight: '500', color: COLORS.textMuted, marginBottom: 5, marginTop: 12 },
  fieldRow:     { flexDirection: 'row', gap: 10 },
  fieldHalf:    { flex: 1 },
  input:        { backgroundColor: COLORS.bodyBg, borderRadius: 8, borderWidth: 0.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: COLORS.textPrimary },

  vinBtn:           { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'center' },
  vinBtnText:       { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  vinVerifiedBadge: { backgroundColor: COLORS.okBg, borderRadius: 8, padding: 8, marginTop: 8, alignItems: 'center' },
  vinVerifiedText:  { color: COLORS.okText, fontSize: 13, fontWeight: '600' },

  requestVehicleBtn:     { marginTop: 20, alignItems: 'center', paddingVertical: 14 },
  requestVehicleBtnText: { color: COLORS.accent, fontSize: 13, fontWeight: '500' },

  upsideBanner:      { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, marginTop: 16 },
  upsideBannerTitle: { color: COLORS.white, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  upsideBannerBody:  { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 },
  upsideBannerCta:   { color: COLORS.accent, fontSize: 13, fontWeight: '600' },

  exportBtn:     { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 14 },
  exportBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },

  edmundsBanner:      { backgroundColor: COLORS.okBg, borderRadius: 12, padding: 16, marginTop: 4, borderWidth: 0.5, borderColor: COLORS.okText },
  edmundsBannerTitle: { color: COLORS.okText, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  edmundsBannerBody:  { color: '#065F46', fontSize: 13, marginBottom: 8, lineHeight: 18 },
  edmundsBannerCta:   { color: COLORS.okText, fontSize: 13, fontWeight: '600' },

  // Shop screen
  shopSubtitle:    { fontSize: 13, color: COLORS.textMuted, marginTop: -12, marginBottom: 16 },
  shopCard:        {
    backgroundColor: COLORS.cardBg, borderRadius: 18, borderWidth: 0.5, borderColor: COLORS.border,
    padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8,
    elevation: 3,
  },
  shopCardHeader:  { flexDirection: 'row', marginBottom: 14, alignItems: 'center' },
  shopCardIcon:    { fontSize: 38, marginRight: 16 },
  shopCardTitle:   { fontSize: 18, fontWeight: '700', color: COLORS.textNavy, marginBottom: 3 },
  shopCardBody:    { fontSize: 13.5, color: COLORS.textMuted, marginTop: 2, lineHeight: 19 },
  shopBuyBtn:      { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  shopBuyBtnText:  { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  shopAltRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 },
  shopAltLink:     { fontSize: 13, color: COLORS.accent, fontWeight: '600', textDecorationLine: 'underline' },
  shopDisclaimerBox:  { marginTop: 6, marginBottom: 20, paddingHorizontal: 4 },
  shopDisclaimerText: { fontSize: 10, color: COLORS.textMuted, lineHeight: 14, textAlign: 'center' },

  oemBadge:        { alignSelf: 'flex-start', backgroundColor: COLORS.okBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  oemBadgeText:    { fontSize: 10, color: COLORS.okText, fontWeight: '600' },
  shopDueBadge:      { backgroundColor: COLORS.overdueBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginLeft: 8 },
  shopDueBadgeText:  { fontSize: 11, color: COLORS.overdueText, fontWeight: '500' },

  shopAllPartsRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 15, marginBottom: 14 },
  shopAllPartsText:  { fontSize: 14, fontWeight: '500', color: COLORS.textNavy },
  shopAllPartsArrow: { fontSize: 20, color: COLORS.textMuted },

  carWashBanner:      { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, marginBottom: 14 },
  carWashTitle:       { color: COLORS.white, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  carWashSubtitle:    { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 },
  carWashCta:         { color: COLORS.accent, fontSize: 13, fontWeight: '600' },

  // Paywall screen
  paywallSubtitle:      { fontSize: 13, color: COLORS.textMuted, marginTop: -12, marginBottom: 16, lineHeight: 19 },
  paywallFeatureRow:    { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  paywallFeatureCheck:  { fontSize: 14, color: COLORS.okText, fontWeight: '700', marginRight: 10, marginTop: 1 },
  paywallFeatureText:   { fontSize: 13, color: COLORS.textPrimary, flex: 1, lineHeight: 19 },
  paywallFooterRow:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 10 },
  paywallFooterLink:    { fontSize: 12, color: COLORS.accent, fontWeight: '500' },
  paywallFooterDot:     { fontSize: 12, color: COLORS.textMuted },
  paywallNoFreeTier:    { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 },

  // Settings screen
  settingsSectionTitle: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  settingsRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
  settingsRowLabel: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  settingsRowValue: { fontSize: 13, color: COLORS.textMuted },
  settingsRowArrow: { fontSize: 18, color: COLORS.textMuted },
  settingsSwitchRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingsDivider:  { height: 0.5, backgroundColor: COLORS.border, marginVertical: 6 },
  settingsSubLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8, marginTop: 4 },
  settingsNote:     { fontSize: 11, color: COLORS.textMuted, lineHeight: 15, marginTop: 8, fontStyle: 'italic' },
  settingsVersion:  { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 24 },

  segmentRow:        { flexDirection: 'row', borderRadius: 8, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden' },
  segmentBtn:        { flex: 1, paddingVertical: 9, alignItems: 'center', backgroundColor: COLORS.bodyBg },
  segmentBtnActive:  { backgroundColor: COLORS.primary },
  segmentText:       { fontSize: 12, color: COLORS.textMuted },
  segmentTextActive: { color: COLORS.white, fontWeight: '600' },

  // Vehicle detail page — Quick Actions + brand footer (fills empty scroll space)
  quickActionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  quickActionCard:   {
    width: '47%', backgroundColor: COLORS.cardBg, borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.border,
    paddingVertical: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1,
  },
  quickActionIcon:   { fontSize: 30, marginBottom: 8 },
  quickActionLabel:  { fontSize: 13, fontWeight: '600', color: COLORS.textNavy, textAlign: 'center' },

  brandFooter:       { alignItems: 'center', paddingVertical: 28, opacity: 0.45 },
  brandFooterIcon:   { fontSize: 32, marginBottom: 6 },
  brandFooterText:   { fontSize: 16, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
  brandFooterSub:    { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // Reviewer-unlock modal
  reviewModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  reviewModalCard:     { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 20, width: '100%', maxWidth: 340 },
  reviewModalTitle:    { fontSize: 17, fontWeight: '700', color: COLORS.textNavy, marginBottom: 8 },
  reviewModalBody:     { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: 16 },
  reviewModalInput:    { backgroundColor: COLORS.bodyBg, borderRadius: 8, borderWidth: 0.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: COLORS.textPrimary },
  reviewModalBtn:         { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  reviewModalBtnCancel:   { borderWidth: 0.5, borderColor: COLORS.border },
  reviewModalBtnCancelText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '500' },
  reviewModalBtnSubmit:     { backgroundColor: COLORS.accent },
  reviewModalBtnSubmitText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
});

const cs = StyleSheet.create({
  photoBtn:     { backgroundColor: COLORS.primary, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 2 },
  photoBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '500' },
});
