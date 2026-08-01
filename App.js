import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS } from './src/translations/TRANSLATIONS';
import { COLORS } from './src/constants/colors';

export default function App() {
  const [lang, setLang] = useState('EN');
  const [vehicles, setVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState('garage');

  const T = (key) => TRANSLATIONS[key]?.[lang] ?? key;

  useEffect(() => {
    AsyncStorage.getItem('autocoach_lang').then(saved => {
      if (saved) setLang(saved);
    });
  }, []);

  function toggleLang() {
    const newLang = lang === 'EN' ? 'ES' : 'EN';
    setLang(newLang);
    AsyncStorage.setItem('autocoach_lang', newLang);
  }

  function renderScreen() {
    switch (activeTab) {
      case 'garage':   return <PlaceholderScreen label={T('nav_garage')} />;
      case 'schedule': return <PlaceholderScreen label={T('nav_schedule')} />;
      case 'shop':     return <PlaceholderScreen label={T('nav_shop')} />;
      case 'history':  return <PlaceholderScreen label={T('nav_history')} />;
      case 'fuel':     return <PlaceholderScreen label={T('nav_fuel')} />;
      default:         return <PlaceholderScreen label={T('nav_garage')} />;
    }
  }

  function PlaceholderScreen({ label }) {
    return (
      <View style={s.placeholder}>
        <Text style={s.placeholderIcon}>🔧</Text>
        <Text style={s.placeholderText}>{label}</Text>
        <Text style={s.placeholderSub}>AutoCoach — Coming soon</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />

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

      <View style={s.screenWrap}>
        {renderScreen()}
      </View>

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

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
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
  screenWrap: {
    flex: 1,
    backgroundColor: COLORS.bodyBg,
  },
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
});