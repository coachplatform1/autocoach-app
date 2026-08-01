// ============================================================
// FleetPricingCalculator.js
// Coach Platform LLC — AutoCoach
// Drop into: src/components/FleetPricingCalculator.js
//
// Props:
//   lang        {string}   'EN' or 'ES' — passed explicitly from App
//   onSubscribe {function} (tierId, price) => void — handles RevenueCat purchase
//   onContact   {function} (vehicleCount) => void — opens email for 21+ enterprise
//
// Usage:
//   <FleetPricingCalculator
//     lang={lang}
//     onSubscribe={(tierId, price) => purchasePlan(tierId)}
//     onContact={(qty) => openEnterpriseEmail(qty)}
//   />
//
// RevenueCat product IDs referenced:
//   autocoach_solo_monthly       $3.99
//   autocoach_duo_monthly        $6.99
//   autocoach_family_monthly     $7.99
//   autocoach_family_plus_monthly $9.99
//   autocoach_fleet_s_monthly    $13.99
//   autocoach_fleet_m_monthly    $19.99
//   autocoach_fleet_l_monthly    $29.99
//   autocoach_solo_annual        $29.99
//   autocoach_duo_annual         $55.99
//   autocoach_family_annual      $63.99
//   autocoach_family_plus_annual $79.99
//   autocoach_fleet_s_annual     $111.99
//   autocoach_fleet_m_annual     $159.99
//   autocoach_fleet_l_annual     $239.99
//   (Enterprise 21+: handled via direct contact, not RevenueCat)
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import { TRANSLATIONS } from '../translations/TRANSLATIONS';

// ─────────────────────────────────────────────
// TIER DATA
// ─────────────────────────────────────────────
const TIERS = [
  {
    id: 'solo',
    rcMonthly: 'autocoach_solo_monthly',
    rcAnnual:  'autocoach_solo_annual',
    price:     3.99,
    annual:    29.99,
    maxVehicles: 1,
    best: false,
  },
  {
    id: 'duo',
    rcMonthly: 'autocoach_duo_monthly',
    rcAnnual:  'autocoach_duo_annual',
    price:     6.99,
    annual:    55.99,
    maxVehicles: 2,
    best: false,
  },
  {
    id: 'family',
    rcMonthly: 'autocoach_family_monthly',
    rcAnnual:  'autocoach_family_annual',
    price:     7.99,
    annual:    63.99,
    maxVehicles: 3,
    best: false,
  },
  {
    id: 'family_plus',
    rcMonthly: 'autocoach_family_plus_monthly',
    rcAnnual:  'autocoach_family_plus_annual',
    price:     9.99,
    annual:    79.99,
    maxVehicles: 4,
    best: true,
  },
  {
    id: 'fleet_s',
    rcMonthly: 'autocoach_fleet_s_monthly',
    rcAnnual:  'autocoach_fleet_s_annual',
    price:     13.99,
    annual:    111.99,
    maxVehicles: 6,
    best: false,
  },
  {
    id: 'fleet_m',
    rcMonthly: 'autocoach_fleet_m_monthly',
    rcAnnual:  'autocoach_fleet_m_annual',
    price:     19.99,
    annual:    159.99,
    maxVehicles: 10,
    best: true,
  },
  {
    id: 'fleet_l',
    rcMonthly: 'autocoach_fleet_l_monthly',
    rcAnnual:  'autocoach_fleet_l_annual',
    price:     29.99,
    annual:    239.99,
    maxVehicles: 20,
    best: false,
  },
];

const ENTERPRISE_BASE   = 29.99;
const ENTERPRISE_PER    = 1.50;
const ENTERPRISE_MIN    = 21;
const ENTERPRISE_MAX    = 999;
const ANNUAL_MULTIPLIER = 10; // 2 months free

// ─────────────────────────────────────────────
// ENTERPRISE MATH
// ─────────────────────────────────────────────
function calcEnterprise(qty) {
  const extra   = Math.max(0, qty - 20);
  const monthly = parseFloat((ENTERPRISE_BASE + extra * ENTERPRISE_PER).toFixed(2));
  const annual  = parseFloat((monthly * ANNUAL_MULTIPLIER).toFixed(2));
  const savings = parseFloat((monthly * 2).toFixed(2));
  return { extra, monthly, annual, savings };
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export default function FleetPricingCalculator({ lang = 'EN', onSubscribe, onContact }) {
  const [selectedId, setSelectedId]   = useState('solo');
  const [billingCycle, setBilling]    = useState('monthly'); // 'monthly' | 'annual'
  const [enterpriseQty, setQty]       = useState(ENTERPRISE_MIN);
  const [qtyText, setQtyText]         = useState(String(ENTERPRISE_MIN));

  // Translation helper
  const T = useCallback((key) => TRANSLATIONS[key]?.[lang] ?? key, [lang]);

  const isEnterprise = selectedId === 'enterprise';
  const activeTier   = TIERS.find(t => t.id === selectedId);
  const ent          = calcEnterprise(enterpriseQty);

  // ── Stepper handlers ──────────────────────
  function handleQtyChange(delta) {
    const next = Math.min(ENTERPRISE_MAX, Math.max(ENTERPRISE_MIN, enterpriseQty + delta));
    setQty(next);
    setQtyText(String(next));
  }

  function handleQtyText(val) {
    setQtyText(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setQty(Math.min(ENTERPRISE_MAX, Math.max(ENTERPRISE_MIN, parsed)));
    }
  }

  function handleQtyBlur() {
    const parsed = parseInt(qtyText, 10);
    const clamped = isNaN(parsed)
      ? ENTERPRISE_MIN
      : Math.min(ENTERPRISE_MAX, Math.max(ENTERPRISE_MIN, parsed));
    setQty(clamped);
    setQtyText(String(clamped));
  }

  // ── CTA handlers ─────────────────────────
  function handlePrimary() {
    if (isEnterprise) {
      if (onContact) onContact(enterpriseQty);
      // Fallback: open email
      const subject = encodeURIComponent(`AutoCoach Enterprise — ${enterpriseQty} vehicles`);
      const body = encodeURIComponent(
        `Hi AutoCoach team,\n\nI'd like to set up an enterprise fleet account for ${enterpriseQty} vehicles.\n\nEstimated monthly: $${ent.monthly.toFixed(2)}\n\nPlease reach out to discuss.`
      );
      Linking.openURL(`mailto:fleet@coachplatform.app?subject=${subject}&body=${body}`);
      return;
    }
    if (!activeTier || !onSubscribe) return;
    const rcId = billingCycle === 'annual' ? activeTier.rcAnnual : activeTier.rcMonthly;
    const price = billingCycle === 'annual' ? activeTier.annual : activeTier.price;
    onSubscribe(rcId, price);
  }

  function handleSecondary() {
    if (isEnterprise) {
      // Learn more — no action needed at launch
      return;
    }
    if (!activeTier || !onSubscribe) return;
    // Toggle to annual if currently monthly, vice versa
    const newCycle = billingCycle === 'monthly' ? 'annual' : 'monthly';
    setBilling(newCycle);
    const rcId = newCycle === 'annual' ? activeTier.rcAnnual : activeTier.rcMonthly;
    const price = newCycle === 'annual' ? activeTier.annual : activeTier.price;
    onSubscribe(rcId, price);
  }

  // ── Chip row data ─────────────────────────
  const chips = [
    { id: 'solo',       label: T('calc_chip_solo') },
    { id: 'duo',        label: T('calc_chip_duo') },
    { id: 'family',     label: T('calc_chip_family') },
    { id: 'family_plus',label: T('calc_chip_family_plus') },
    { id: 'fleet_s',    label: T('calc_chip_fleet_s') },
    { id: 'fleet_m',    label: T('calc_chip_fleet_m') },
    { id: 'fleet_l',    label: T('calc_chip_fleet_l') },
    { id: 'enterprise', label: T('calc_chip_enterprise') },
  ];

  // ── Tier card strings ─────────────────────
  function tierName(id) {
    const map = {
      solo: T('calc_name_solo'), duo: T('calc_name_duo'),
      family: T('calc_name_family'), family_plus: T('calc_name_family_plus'),
      fleet_s: T('calc_name_fleet_s'), fleet_m: T('calc_name_fleet_m'),
      fleet_l: T('calc_name_fleet_l'),
    };
    return map[id] ?? id;
  }

  function tierBadge(id) {
    const map = {
      solo: T('calc_badge_solo'), duo: T('calc_badge_duo'),
      family: T('calc_badge_family'), family_plus: T('calc_badge_family_plus'),
      fleet_s: T('calc_badge_fleet_s'), fleet_m: T('calc_badge_fleet_m'),
      fleet_l: T('calc_badge_fleet_l'),
    };
    return map[id] ?? '';
  }

  function tierVehicles(id) {
    const map = {
      solo: T('calc_vehicles_solo'), duo: T('calc_vehicles_duo'),
      family: T('calc_vehicles_family'), family_plus: T('calc_vehicles_family_plus'),
      fleet_s: T('calc_vehicles_fleet_s'), fleet_m: T('calc_vehicles_fleet_m'),
      fleet_l: T('calc_vehicles_fleet_l'),
    };
    return map[id] ?? '';
  }

  function annualSavings(tier) {
    const saved = parseFloat(((tier.price * 12) - tier.annual).toFixed(2));
    return `${T('calc_annual_saves')} $${saved.toFixed(2)}`;
  }

  // ── Breakdown string ──────────────────────
  function breakdownLine() {
    const vWord = ent.extra === 1
      ? `1 ${T('calc_breakdown_vehicle_singular')}`
      : `${ent.extra} ${T('calc_breakdown_vehicle_plural')}`;
    return `${T('calc_breakdown_base')}: $${ENTERPRISE_BASE.toFixed(2)}  +  ${vWord} × $${ENTERPRISE_PER.toFixed(2)} = $${(ent.extra * ENTERPRISE_PER).toFixed(2)}`;
  }

  // ── Primary button label ──────────────────
  function primaryLabel() {
    if (isEnterprise) return T('calc_cta_enterprise');
    if (!activeTier) return '';
    const price = billingCycle === 'annual' ? activeTier.annual : activeTier.price;
    const suffix = billingCycle === 'annual' ? T('calc_annual_suffix') : T('calc_cta_subscribe_suffix');
    return `${T('calc_cta_subscribe_prefix')}${price.toFixed(2)}${suffix}`;
  }

  function secondaryLabel() {
    if (isEnterprise) return T('calc_cta_enterprise_learn');
    if (!activeTier) return '';
    if (billingCycle === 'monthly') {
      return `${T('calc_cta_annual_prefix')}${activeTier.annual.toFixed(2)}${T('calc_cta_annual_suffix')}`;
    }
    return `${T('calc_cta_subscribe_prefix')}${activeTier.price.toFixed(2)}${T('calc_cta_subscribe_suffix')}`;
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <View style={s.container}>

      {/* Section label */}
      <Text style={s.sectionLabel}>{T('calc_choose_plan')}</Text>

      {/* Chip row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipRow}
      >
        {chips.map(chip => (
          <TouchableOpacity
            key={chip.id}
            style={[s.chip, selectedId === chip.id && s.chipActive]}
            onPress={() => setSelectedId(chip.id)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, selectedId === chip.id && s.chipTextActive]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── STANDARD TIER CARD ── */}
      {!isEnterprise && activeTier && (
        <View style={s.card}>
          {/* Best value badge */}
          {activeTier.best && (
            <View style={s.bestBadgeWrap}>
              <Text style={s.bestBadgeText}>{T('calc_best_value')}</Text>
            </View>
          )}

          {/* Header row */}
          <View style={s.planHeader}>
            <Text style={s.planName}>{tierName(activeTier.id)}</Text>
            <View style={[s.badge, activeTier.best && s.badgeBest]}>
              <Text style={[s.badgeText, activeTier.best && s.badgeTextBest]}>
                {tierBadge(activeTier.id)}
              </Text>
            </View>
          </View>

          {/* Price */}
          <View style={s.priceRow}>
            <Text style={s.priceLarge}>
              ${billingCycle === 'annual'
                ? activeTier.annual.toFixed(2)
                : activeTier.price.toFixed(2)}
            </Text>
            <Text style={s.priceSuffix}>
              {billingCycle === 'annual'
                ? T('calc_cta_annual_suffix')
                : T('calc_cta_subscribe_suffix')}
            </Text>
          </View>

          {/* Vehicle count */}
          <Text style={s.vehicleCount}>{tierVehicles(activeTier.id)}</Text>

          {/* Annual savings line */}
          <View style={s.annualRow}>
            <Text style={s.annualText}>
              {T('calc_annual_prefix')}
              {activeTier.annual.toFixed(2)}
              {T('calc_annual_suffix')} — {' '}
              <Text style={s.annualSavings}>{annualSavings(activeTier)}</Text>
            </Text>
          </View>

          {/* Billing toggle */}
          <View style={s.billingToggle}>
            <TouchableOpacity
              style={[s.toggleBtn, billingCycle === 'monthly' && s.toggleBtnActive]}
              onPress={() => setBilling('monthly')}
            >
              <Text style={[s.toggleText, billingCycle === 'monthly' && s.toggleTextActive]}>
                {T('calc_monthly_label')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, billingCycle === 'annual' && s.toggleBtnActive]}
              onPress={() => setBilling('annual')}
            >
              <Text style={[s.toggleText, billingCycle === 'annual' && s.toggleTextActive]}>
                {T('calc_annual_label')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── ENTERPRISE CARD ── */}
      {isEnterprise && (
        <View style={s.card}>
          <Text style={s.enterpriseTitle}>{T('calc_enterprise_label')}</Text>
          <Text style={s.enterpriseNote}>{T('calc_enterprise_min')}</Text>

          {/* Section label */}
          <Text style={[s.sectionLabel, { marginTop: 14 }]}>{T('calc_qty_label')}</Text>

          {/* Stepper */}
          <View style={s.stepper}>
            <TouchableOpacity
              style={s.stepBtn}
              onPress={() => handleQtyChange(-1)}
              activeOpacity={0.7}
            >
              <Text style={s.stepBtnText}>−</Text>
            </TouchableOpacity>

            <TextInput
              style={s.stepInput}
              value={qtyText}
              onChangeText={handleQtyText}
              onBlur={handleQtyBlur}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
            />

            <TouchableOpacity
              style={s.stepBtn}
              onPress={() => handleQtyChange(1)}
              activeOpacity={0.7}
            >
              <Text style={s.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Result grid */}
          <View style={s.resultGrid}>
            <View style={s.resultCard}>
              <Text style={s.resultLabel}>{T('calc_monthly_label')}</Text>
              <Text style={s.resultValue}>${ent.monthly.toFixed(2)}</Text>
            </View>
            <View style={s.resultCard}>
              <Text style={s.resultLabel}>{T('calc_annual_label')}</Text>
              <Text style={s.resultValueMuted}>${ent.annual.toFixed(2)}</Text>
            </View>
          </View>

          {/* Breakdown */}
          <View style={s.breakdownBox}>
            <Text style={s.breakdownText}>{breakdownLine()}</Text>
          </View>

          {/* Annual savings pill */}
          <View style={s.savingsPill}>
            <Text style={s.savingsPillText}>
              {T('calc_annual_saves_pill')}{ent.savings.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Divider */}
      <View style={s.divider} />

      {/* Primary CTA */}
      <TouchableOpacity style={s.primaryBtn} onPress={handlePrimary} activeOpacity={0.85}>
        <Text style={s.primaryBtnText}>{primaryLabel()}</Text>
      </TouchableOpacity>

      {/* Secondary CTA */}
      <TouchableOpacity style={s.secondaryBtn} onPress={handleSecondary} activeOpacity={0.85}>
        <Text style={s.secondaryBtnText}>{secondaryLabel()}</Text>
      </TouchableOpacity>

    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// Uses AutoCoach palette:
//   Primary action: #1A1A1A (near-black)
//   Brand accent:   #E85D04 (orange)
//   Success green:  #2E7D32
//   Background:     #F9F9F9
//   Card:           #FFFFFF
//   Border:         #E0E0E0
// ─────────────────────────────────────────────
const ORANGE  = '#E85D04';
const DARK    = '#1A1A1A';
const GREEN   = '#2E7D32';
const BORDER  = '#E0E0E0';
const CARD_BG = '#FFFFFF';
const PAGE_BG = '#F5F5F5';
const GRAY    = '#757575';
const GRAY_LT = '#F0F0F0';

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PAGE_BG,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: GRAY,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Chip row
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: BORDER,
    backgroundColor: CARD_BG,
  },
  chipActive: {
    backgroundColor: DARK,
    borderColor: DARK,
  },
  chipText: {
    fontSize: 12,
    color: GRAY,
    fontWeight: '400',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 12,
  },

  // Best value badge
  bestBadgeWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
  },
  bestBadgeText: {
    fontSize: 11,
    color: '#1B5E20',
    fontWeight: '500',
  },

  // Plan header
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: '500',
    color: DARK,
  },
  badge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeBest: {
    backgroundColor: '#E8F5E9',
  },
  badgeText: {
    fontSize: 11,
    color: '#BF360C',
    fontWeight: '500',
  },
  badgeTextBest: {
    color: '#1B5E20',
  },

  // Price
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 4,
  },
  priceLarge: {
    fontSize: 30,
    fontWeight: '500',
    color: ORANGE,
  },
  priceSuffix: {
    fontSize: 14,
    color: GRAY,
    fontWeight: '400',
  },

  // Vehicle count
  vehicleCount: {
    fontSize: 13,
    color: GRAY,
    marginBottom: 8,
    marginTop: 2,
  },

  // Annual row
  annualRow: {
    marginBottom: 12,
  },
  annualText: {
    fontSize: 12,
    color: GRAY,
  },
  annualSavings: {
    color: GREEN,
    fontWeight: '500',
  },

  // Billing toggle
  billingToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: GRAY_LT,
  },
  toggleBtnActive: {
    backgroundColor: DARK,
  },
  toggleText: {
    fontSize: 12,
    color: GRAY,
    fontWeight: '400',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Enterprise
  enterpriseTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: DARK,
    marginBottom: 4,
  },
  enterpriseNote: {
    fontSize: 12,
    color: GRAY,
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: BORDER,
    overflow: 'hidden',
    marginBottom: 14,
  },
  stepBtn: {
    width: 52,
    height: 52,
    backgroundColor: GRAY_LT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 24,
    color: DARK,
    fontWeight: '400',
    lineHeight: 28,
  },
  stepInput: {
    flex: 1,
    height: 52,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '500',
    color: DARK,
    backgroundColor: CARD_BG,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: BORDER,
  },

  // Result grid
  resultGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  resultCard: {
    flex: 1,
    backgroundColor: GRAY_LT,
    borderRadius: 10,
    padding: 12,
  },
  resultLabel: {
    fontSize: 11,
    color: GRAY,
    marginBottom: 4,
    fontWeight: '400',
  },
  resultValue: {
    fontSize: 22,
    fontWeight: '500',
    color: ORANGE,
  },
  resultValueMuted: {
    fontSize: 22,
    fontWeight: '500',
    color: DARK,
  },

  // Breakdown
  breakdownBox: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  breakdownText: {
    fontSize: 12,
    color: GRAY,
    lineHeight: 18,
  },

  // Savings pill
  savingsPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  savingsPillText: {
    fontSize: 12,
    color: '#1B5E20',
    fontWeight: '500',
  },

  // Divider
  divider: {
    height: 0.5,
    backgroundColor: BORDER,
    marginVertical: 14,
  },

  // CTA buttons
  primaryBtn: {
    backgroundColor: DARK,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  secondaryBtnText: {
    color: GRAY,
    fontSize: 13,
    fontWeight: '400',
  },
});
