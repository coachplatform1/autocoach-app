export const RC_PRODUCTS = {
  SOLO_MONTHLY:        'autocoach_solo_monthly',
  SOLO_ANNUAL:         'autocoach_solo_annual',
  DUO_MONTHLY:         'autocoach_duo_monthly',
  DUO_ANNUAL:          'autocoach_duo_annual',
  FAMILY_MONTHLY:      'autocoach_family_monthly',
  FAMILY_ANNUAL:       'autocoach_family_annual',
  FAMILY_PLUS_MONTHLY: 'autocoach_family_plus_monthly',
  FAMILY_PLUS_ANNUAL:  'autocoach_family_plus_annual',
  FLEET_S_MONTHLY:     'autocoach_fleet_s_monthly',
  FLEET_S_ANNUAL:      'autocoach_fleet_s_annual',
  FLEET_M_MONTHLY:     'autocoach_fleet_m_monthly',
  FLEET_M_ANNUAL:      'autocoach_fleet_m_annual',
  FLEET_L_MONTHLY:     'autocoach_fleet_l_monthly',
  FLEET_L_ANNUAL:      'autocoach_fleet_l_annual',
};

export const VEHICLE_LIMITS = {
  autocoach_solo:         1,
  autocoach_duo:          2,
  autocoach_family:       3,
  autocoach_family_plus:  4,
  autocoach_fleet_s:      6,
  autocoach_fleet_m:      10,
  autocoach_fleet_l:      20,
  autocoach_enterprise:   999,
};

export function getVehicleLimit(customerInfo) {
  const active = customerInfo?.entitlements?.active ?? {};
  for (const [id, limit] of Object.entries(VEHICLE_LIMITS)) {
    if (active[id]?.isActive) return limit;
  }
  return 0;
}