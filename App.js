import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, Platform, ScrollView,
  TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Modal, FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS } from './src/translations/TRANSLATIONS';
import { COLORS } from './src/constants/colors';
import {
  decodeVIN,
  getMaintenanceSchedule,
  calculateDueServices,
  getAllMakes,
  getModelsForMake,
  getEnginesForMakeModel,
  getYearsForMakeModel,
} from './src/data/vehicleDatabase';

// ─────────────────────────────────────────────
// SCROLL PICKER COMPONENT
// Native-feeling scroll wheel selector
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

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={sp.backdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        />
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
                onPress={() => {
                  onSelect(item);
                  setModalVisible(false);
                }}
              >
                <Text style={[sp.itemText, item === selectedValue && sp.itemTextSelected]}>
                  {item}
                </Text>
                {item === selectedValue && (
                  <Text style={sp.itemCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const sp = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bodyBg,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 2,
  },
  triggerValue:       { fontSize: 15, color: COLORS.textPrimary, flex: 1 },
  triggerPlaceholder: { fontSize: 15, color: COLORS.textMuted, flex: 1 },
  triggerArrow:       { fontSize: 18, color: COLORS.textMuted },
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  sheetTitle:    { fontSize: 16, fontWeight: '600', color: COLORS.textNavy },
  sheetDone:     { fontSize: 16, fontWeight: '600', color: COLORS.accent },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  itemSelected:     { backgroundColor: COLORS.okBg },
  itemText:         { fontSize: 15, color: COLORS.textPrimary },
  itemTextSelected: { color: COLORS.primary, fontWeight: '600' },
  itemCheck:        { fontSize: 16, color: COLORS.okText, fontWeight: '700' },
});


// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [lang, setLang]                     = useState('EN');
  const [vehicles, setVehicles]             = useState([]);
  const [activeTab, setActiveTab]           = useState('garage');
  const [activeVehicle, setActiveVehicle]   = useState(null);
  const [serviceHistory, setServiceHistory] = useState({});
  const [isPro, setIsPro]                   = useState(false);
  const [vehicleLimit, setVehicleLimit]     = useState(0);

  const T = (key) => TRANSLATIONS[key]?.[lang] ?? key;

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
            let overdueCount = 0, soonCount = 0;
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
      services = calculateDueServices(schedule.services, currentMileage, serviceHistory[vKey] || {});
    }

    const overdue = services.filter(s => s.status === 'overdue');
    const soon    = services.filter(s => s.status === 'due_soon');
    const ok      = services.filter(s => s.status === 'ok');

    function ServiceRow({ svc }) {
      const isOd   = svc.status === 'overdue';
      const isSoon = svc.status === 'due_soon';
      const name   = lang === 'ES' ? svc.nameES : svc.nameEN;
      const milesText = svc.milesUntilDue !== null
        ? isOd
          ? `${Math.abs(Math.round(svc.milesUntilDue)).toLocaleString()} ${T('svc_overdue_suffix')}`
          : `${T('svc_due_in')} ${Math.round(svc.milesUntilDue).toLocaleString()} mi`
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
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────
  // ADD VEHICLE SCREEN — with scroll pickers
  // ─────────────────────────────────────────────
  function AddVehicleScreen() {
    const [mode, setMode]             = useState('manual'); // manual only — VIN is bonus
    const [vin, setVin]               = useState('');
    const [vinLoading, setVinLoading] = useState(false);
    const [vinResult, setVinResult]   = useState(null);

    // Picker state
    const [selectedMake,   setSelectedMake]   = useState('');
    const [selectedModel,  setSelectedModel]  = useState('');
    const [selectedEngine, setSelectedEngine] = useState('');
    const [selectedYear,   setSelectedYear]   = useState('');
    const [mileage,        setMileage]         = useState('');
    const [nickname,       setNickname]        = useState('');

    // Derived picker lists
    const allMakes   = getAllMakes();
    const allModels  = selectedMake  ? getModelsForMake(selectedMake) : [];
    const allEngines = (selectedMake && selectedModel) ? getEnginesForMakeModel(selectedMake, selectedModel) : [];
    const allYears   = (selectedMake && selectedModel)
      ? getYearsForMakeModel(selectedMake, selectedModel).map(String).sort((a,b) => b-a)
      : [];

    // When make changes reset downstream
    function onMakeSelect(make) {
      setSelectedMake(make);
      setSelectedModel('');
      setSelectedEngine('');
      setSelectedYear('');
    }
    function onModelSelect(model) {
      setSelectedModel(model);
      setSelectedEngine('');
      setSelectedYear('');
    }

    async function lookupVIN() {
      if (vin.length < 17) { Alert.alert('', T('add_vehicle_vin_invalid')); return; }
      setVinLoading(true);
      try {
        const result = await decodeVIN(vin);
        if (result && result.isValid) {
          setVinResult(result);
          setSelectedMake(result.make);
          setSelectedModel(result.model);
          setSelectedEngine(result.engine);
          setSelectedYear(result.year);
        } else {
          Alert.alert('', T('add_vehicle_vin_invalid'));
        }
      } catch (e) {
        Alert.alert('', T('error_network'));
      }
      setVinLoading(false);
    }

    function handleAdd() {
      if (!selectedYear || !selectedMake || !selectedModel) {
        Alert.alert('', T('required'));
        return;
      }
      addVehicle({
        vin: vin || null,
        year: selectedYear,
        make: selectedMake,
        model: selectedModel,
        engine: selectedEngine,
        mileage: mileage ? parseInt(mileage.replace(/,/g, '')) : null,
        nickname: nickname || null,
        addedAt: new Date().toISOString(),
      });
    }

    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={s.screen} contentContainerStyle={s.screenContent} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={s.backBtn} onPress={() => setActiveTab('garage')}>
            <Text style={s.backBtnText}>← {T('btn_back')}</Text>
          </TouchableOpacity>
          <Text style={s.screenTitle}>{T('add_vehicle_title')}</Text>

          {/* VIN entry (optional) */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>
              {lang === 'EN' ? 'VIN (optional — auto-fills details)' : 'VIN (opcional — rellena datos automáticamente)'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={vin}
                onChangeText={t => setVin(t.toUpperCase())}
                placeholder={T('add_vehicle_vin_placeholder')}
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
                maxLength={17}
              />
              <TouchableOpacity
                style={[s.vinBtn, vinLoading && { opacity: 0.6 }]}
                onPress={lookupVIN}
                disabled={vinLoading}
              >
                {vinLoading
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={s.vinBtnText}>{lang === 'EN' ? 'Decode' : 'Decodificar'}</Text>
                }
              </TouchableOpacity>
            </View>
            {vinResult && (
              <View style={s.vinVerifiedBadge}>
                <Text style={s.vinVerifiedText}>✓ {T('add_vehicle_vin_verified')}</Text>
              </View>
            )}
          </View>

          {/* Scroll pickers */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>
              {lang === 'EN' ? 'Vehicle details' : 'Detalles del vehículo'}
            </Text>

            <Text style={s.fieldLabel}>{T('add_vehicle_make')}</Text>
            <ScrollPicker
              items={allMakes}
              selectedValue={selectedMake}
              onSelect={onMakeSelect}
              label={T('add_vehicle_make')}
              placeholder={lang === 'EN' ? 'Select make...' : 'Seleccionar marca...'}
              lang={lang}
            />

            <Text style={s.fieldLabel}>{T('add_vehicle_model')}</Text>
            <ScrollPicker
              items={allModels}
              selectedValue={selectedModel}
              onSelect={onModelSelect}
              label={T('add_vehicle_model')}
              placeholder={selectedMake ? (lang === 'EN' ? 'Select model...' : 'Seleccionar modelo...') : (lang === 'EN' ? 'Select make first' : 'Primero selecciona la marca')}
              lang={lang}
            />

            <Text style={s.fieldLabel}>{T('add_vehicle_engine')}</Text>
            <ScrollPicker
              items={allEngines}
              selectedValue={selectedEngine}
              onSelect={setSelectedEngine}
              label={T('add_vehicle_engine')}
              placeholder={selectedModel ? (lang === 'EN' ? 'Select engine...' : 'Seleccionar motor...') : (lang === 'EN' ? 'Select model first' : 'Primero selecciona el modelo')}
              lang={lang}
            />

            <Text style={s.fieldLabel}>{lang === 'EN' ? 'Year' : 'Año'}</Text>
            <ScrollPicker
              items={allYears}
              selectedValue={selectedYear}
              onSelect={setSelectedYear}
              label={lang === 'EN' ? 'Year' : 'Año'}
              placeholder={selectedModel ? (lang === 'EN' ? 'Select year...' : 'Seleccionar año...') : (lang === 'EN' ? 'Select model first' : 'Primero selecciona el modelo')}
              lang={lang}
            />

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

          <TouchableOpacity style={s.primaryBtn} onPress={handleAdd}>
            <Text style={s.primaryBtnText}>{T('add_vehicle_cta')}</Text>
          </TouchableOpacity>

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

  vehicleChipRow:        { flexDirection: 'row', marginBottom: 14 },
  vehicleChip:           { backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 0.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  vehicleChipActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  vehicleChipText:       { fontSize: 12, color: COLORS.textMuted },
  vehicleChipTextActive: { color: COLORS.white, fontWeight: '600' },

  scheduleHeader:      { backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 14, marginBottom: 14 },
  scheduleVehicleName: { fontSize: 17, fontWeight: '700', color: COLORS.textNavy },
  scheduleVehicleSub:  { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  oilSpec:             { fontSize: 12, color: COLORS.accent, marginTop: 6, fontWeight: '500' },

  serviceSection:      { marginBottom: 14 },
  serviceSectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textNavy, marginBottom: 8 },
  card:        { backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.border, padding: 14, marginBottom: 14 },

  serviceRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  serviceName: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  serviceDue:  { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  serviceSpec: { fontSize: 11, color: COLORS.accent, marginTop: 2 },

  backBtn:      { marginBottom: 16 },
  backBtnText:  { color: COLORS.accent, fontSize: 14, fontWeight: '500' },
  screenTitle:  { fontSize: 22, fontWeight: '700', color: COLORS.textNavy, marginBottom: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 },
  fieldLabel:   { fontSize: 12, fontWeight: '500', color: COLORS.textMuted, marginBottom: 5, marginTop: 12 },
  input:        { backgroundColor: COLORS.bodyBg, borderRadius: 8, borderWidth: 0.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: COLORS.textPrimary },

  vinBtn:        { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'center' },
  vinBtnText:    { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  vinVerifiedBadge: { backgroundColor: COLORS.okBg, borderRadius: 8, padding: 8, marginTop: 8, alignItems: 'center' },
  vinVerifiedText:  { color: COLORS.okText, fontSize: 13, fontWeight: '600' },

  requestVehicleBtn:     { marginTop: 20, alignItems: 'center', paddingVertical: 14 },
  requestVehicleBtnText: { color: COLORS.accent, fontSize: 13, fontWeight: '500' },
});
