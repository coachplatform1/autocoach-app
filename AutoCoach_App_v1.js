import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, Platform, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS } from './src/translations/TRANSLATIONS';
import { COLORS } from './src/constants/colors';

export default function App() {
  const [lang, setLang]               = useState('EN');
  const [vehicles, setVehicles]       = useState([]);
  const [activeTab, setActiveTab]     = useState('garage');
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [isPro, setIsPro]             = useState(false);
  const [vehicleLimit, setVehicleLimit] = useState(0);

  const T = (key) => TRANSLATIONS[key]?.[lang] ?? key;

  // ── Load saved language ──────────────────────
  useEffect(() => {
    AsyncStorage.getItem('autocoach_lang').then(saved => {
      if (saved) setLang(saved);
    });
  }, []);

  // ── Toggle language ──────────────────────────
  function toggleLang() {
    const newLang = lang === 'EN' ? 'ES' : 'EN';
    setLang(newLang);
    AsyncStorage.setItem('autocoach_lang', newLang);
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
      case 'addVehicle': return <PlaceholderScreen label={T('add_vehicle_title')} />;
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

        {/* Empty state — no vehicles yet */}
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
                      ? vehicle.mileage.toLocaleString() + ' mi'
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

  // Layout
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  screenWrap: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
  screenContent: {
    padding: 14,
    paddingBottom: 30,
  },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 1,
  },
  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  langBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  navIcon: {
    fontSize: 22,
    opacity: 0.4,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 10,
    color: COLORS.navInactive,
  },
  navLabelActive: {
    color: COLORS.accentDark,
    fontWeight: '600',
  },

  // Placeholder
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bodyBg,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 6,
  },
  placeholderSub: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // Stat row
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: 10,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.accent,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textNavy,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  addVehicleBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 32,
  },
  addVehicleBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  addVehicleBtnSecondary: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addVehicleBtnSecondaryText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },

  // Vehicle cards
  vehicleCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  vehicleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textNavy,
  },
  vehicleSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badgeOk: {
    backgroundColor: COLORS.okBg,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeOkText: {
    fontSize: 11,
    color: COLORS.okText,
    fontWeight: '500',
  },
});
