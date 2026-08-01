// ============================================================
// AutoCoach — vehicleDatabase.js  v2.0
// Coach Platform LLC
//
// TARGET: 2017-2021 model years — DIY owners, 5-9 years old in 2026
// 50 vehicles, all with EN + ES service name translations embedded
//
// PART 1: NHTSA API helpers (free, no key required)
// PART 2: Curated maintenance database — 50 vehicles
// PART 3: Lookup and calculation functions
// ============================================================

// ─────────────────────────────────────────────────────────────
// PART 1: NHTSA API HELPERS
// ─────────────────────────────────────────────────────────────
const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const RECALLS_BASE = 'https://api.nhtsa.gov/recalls/recallsByVehicle';

export async function decodeVIN(vin) {
  try {
    const res = await fetch(`${NHTSA_BASE}/decodevinvalues/${vin.toUpperCase()}?format=json`);
    const data = await res.json();
    const v = data.Results[0];
    return {
      vin: vin.toUpperCase(),
      year: v.ModelYear || '',
      make: v.Make || '',
      model: v.Model || '',
      trim: v.Trim || '',
      engine: v.DisplacementL ? `${parseFloat(v.DisplacementL).toFixed(1)}L` : '',
      cylinders: v.EngineCylinders || '',
      fuelType: v.FuelTypePrimary || '',
      driveType: v.DriveType || '',
      bodyClass: v.BodyClass || '',
      transmissionStyle: v.TransmissionStyle || '',
      isValid: v.ErrorCode === '0',
      errorText: v.ErrorText || '',
    };
  } catch (err) { console.error('VIN decode error:', err); return null; }
}

export async function getRecalls(make, model, year) {
  try {
    const url = `${RECALLS_BASE}?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.results || data.results.length === 0) return [];
    return data.results.map(r => ({
      id: r.NHTSACampaignNumber,
      date: r.ReportReceivedDate,
      component: r.Component,
      summary: r.Summary,
      consequence: r.Consequence,
      remedy: r.Remedy,
      isFreeRepair: true,
    }));
  } catch (err) { console.error('Recall fetch error:', err); return []; }
}

export async function getModelsForMakeYear(make, year) {
  try {
    const res = await fetch(`${NHTSA_BASE}/getmodelsformakeyear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`);
    const data = await res.json();
    return data.Results.map(r => r.Model_Name).sort();
  } catch (err) { console.error('Models fetch error:', err); return []; }
}


// ─────────────────────────────────────────────────────────────
// PART 2: SERVICE TEMPLATE FUNCTIONS
// All service names include EN and ES translations
// ─────────────────────────────────────────────────────────────

function svc(id, nameEN, nameES, miles, months, spec, qty, priority, notes, dieselOnly) {
  return { id, nameEN, nameES, interval_miles: miles, interval_months: months,
           spec, qty, priority: priority || 'medium', notes: notes || null, dieselOnly: dieselOnly || false };
}

function baseGasServices(oilSpec, oilQty, filterPN, oilInterval) {
  return [
    svc('oil_filter',       'Engine oil & filter',              'Aceite de motor y filtro',               oilInterval, 12,  oilSpec + ' — ' + filterPN, oilQty, 'high'),
    svc('tire_rotation',    'Tire rotation',                    'Rotación de llantas',                    5000,  6,   'Rotate per owner manual pattern', 'All 4', 'high'),
    svc('air_filter_cabin', 'Cabin air filter',                 'Filtro de aire de la cabina',            15000, 12,  'Activated carbon recommended', '1', 'medium'),
    svc('air_filter_engine','Engine air filter',                'Filtro de aire del motor',               30000, 36,  'OEM or K&N equivalent', '1', 'medium'),
    svc('brake_inspection', 'Brake pads & rotor inspection',   'Inspección de pastillas y rotores',      20000, 24,  'Replace pads under 3mm', 'Front & rear', 'high'),
    svc('spark_plugs',      'Spark plugs',                      'Bujías',                                 60000, 60,  'OEM iridium or platinum — no copper', 'Per cylinder', 'medium', 'Extended-life plugs 60-100k. Never use anti-seize on modern aluminum heads.'),
    svc('transmission',     'Transmission fluid',               'Fluido de transmisión',                  60000, 60,  'OEM-specified ATF — check manual for exact spec', 'Varies', 'high', 'CRITICAL: Wrong ATF destroys transmission. OEM spec only.'),
    svc('coolant',          'Coolant flush',                    'Cambio de refrigerante',                 100000,60,  'Vehicle-specific coolant — OAT, HOAT, or IAT per manual', 'System capacity', 'medium', 'Never mix coolant types.'),
    svc('brake_fluid',      'Brake fluid flush',                'Cambio de fluido de frenos',             45000, 36,  'DOT 3 or DOT 4 per manual', '1 qt', 'medium', 'Brake fluid absorbs moisture reducing boiling point over time.'),
    svc('battery',          'Battery inspection & load test',   'Inspección y prueba de batería',         null,  36,  'Replace if under 70% CCA', '1', 'medium', 'Free testing at AutoZone and Advance Auto Parts.'),
    svc('serpentine_belt',  'Serpentine belt inspection',       'Inspección de correa serpentina',        60000, 60,  'Inspect for cracks, fraying, glazing', '1', 'medium'),
    svc('wiper_blades',     'Wiper blades',                     'Escobillas limpiaparabrisas',            null,  12,  'Beam-style recommended', '2-3', 'low'),
  ];
}

function dieselServices(oilSpec, oilQty, filterPN) {
  const base = baseGasServices(oilSpec, oilQty, filterPN, 10000)
    .filter(s => s.id !== 'spark_plugs');
  return [
    ...base,
    svc('fuel_filter_diesel', 'Fuel filter (primary + secondary)',   'Filtro de combustible (primario + secundario)', 15000, 18, 'OEM fuel filter kit', '1 kit', 'high', 'Water-in-fuel warning = change immediately. Clogged filter destroys injectors.', true),
    svc('def_fluid',          'DEF fluid (diesel exhaust fluid)',    'Fluido DEF (fluido de escape diesel)',          10000, 12, 'API-certified DEF ISO 22241', '1-2 gal', 'high', 'Running low limits engine power. 2011+ diesel only. Never use tap water.', true),
    svc('glow_plugs',         'Glow plugs',                         'Bujías de precalentamiento',                   100000,96, 'OEM glow plugs — torque spec critical', 'Per cylinder', 'medium', 'Hard cold starts often mean failing glow plugs.', true),
    svc('egr_cleaning',       'EGR system cleaning',                'Limpieza del sistema EGR',                     75000, 60, 'Carbon deposit removal — intake and EGR valve', 'Service', 'medium', 'Clogged EGR causes rough idle, power loss, black smoke.', true),
    svc('dpf_cleaning',       'DPF cleaning / inspection',          'Limpieza / inspección del filtro de partículas (DPF)', 100000, 96, 'Professional DPF cleaning', 'Service', 'medium', 'Short trips load DPF faster. Forced regen if warning light appears.', true),
    svc('turbo_inspection',   'Turbo oil feed line inspection',     'Inspección de la línea de aceite del turbo',   60000, 60, 'Inspect for carbon buildup and restriction', 'Service', 'medium', 'Let engine idle 2 min before shutdown to cool turbo.', true),
  ];
}

function hybridServices(oilSpec, oilQty, filterPN) {
  return [
    ...baseGasServices(oilSpec, oilQty, filterPN, 10000),
    svc('hybrid_battery',   'Hybrid battery health check',          'Revisión de salud de batería híbrida',         null,  24, 'OBD-II hybrid monitor or dealer scan', 'Service', 'medium', 'Typically lasts 150-200k miles. Monitor for sudden MPG drop.'),
    svc('hybrid_brake',     'Hybrid brake fluid flush',             'Cambio de fluido de frenos híbrido',           null,  36, 'DOT 3 — regenerative brakes still need fluid flush', '1 qt', 'medium', 'Pads last much longer with regen braking but fluid still ages.'),
  ];
}

function cvtNote(brand) {
  return `CVT transmission — use only ${brand} CVT fluid. CRITICAL: Wrong fluid destroys the CVT.`;
}


// ─────────────────────────────────────────────────────────────
// PART 3: MAINTENANCE DATABASE — 50 VEHICLES
// All 2017-2021 unless noted
// ─────────────────────────────────────────────────────────────

export const MAINTENANCE_DB = {

  // ══ FORD ══════════════════════════════════════════════════
  'ford_f150': {
    make:'Ford', model:'F-150', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.7L EcoBoost V6': { oilSpec:'5W-30 Motorcraft Full Synthetic', oilQty:'6 qts', filterPN:'Motorcraft FL-500-S', services: baseGasServices('5W-30 Motorcraft Full Synthetic','6 qts','FL-500-S',10000) },
      '3.5L EcoBoost V6': { oilSpec:'5W-30 Motorcraft Full Synthetic', oilQty:'6 qts', filterPN:'Motorcraft FL-500-S', services: baseGasServices('5W-30 Motorcraft Full Synthetic','6 qts','FL-500-S',10000) },
      '5.0L V8 Coyote':   { oilSpec:'5W-20 Motorcraft Full Synthetic', oilQty:'8 qts', filterPN:'Motorcraft FL-820-S', services: baseGasServices('5W-20 Motorcraft Full Synthetic','8 qts','FL-820-S',7500) },
    }
  },

  'ford_f250_diesel': {
    make:'Ford', model:'F-250 Super Duty', years:[2017,2018,2019,2020,2021],
    engines: {
      '6.7L Power Stroke Diesel': { oilSpec:'15W-40 Motorcraft CJ-4 Diesel', oilQty:'15 qts w/ filter', filterPN:'Motorcraft FL-2051-S', services: dieselServices('15W-40 CJ-4','15 qts','Motorcraft FL-2051-S') },
      '6.2L V8 Gas':              { oilSpec:'5W-20 Motorcraft Full Synthetic', oilQty:'6 qts', filterPN:'Motorcraft FL-820-S', services: baseGasServices('5W-20','6 qts','FL-820-S',7500) },
    }
  },

  'ford_f350_diesel': {
    make:'Ford', model:'F-350 Super Duty', years:[2017,2018,2019,2020,2021],
    engines: {
      '6.7L Power Stroke Diesel': { oilSpec:'15W-40 Motorcraft CJ-4 Diesel', oilQty:'15 qts w/ filter', filterPN:'Motorcraft FL-2051-S', services: dieselServices('15W-40 CJ-4','15 qts','Motorcraft FL-2051-S') },
    }
  },

  'ford_escape': {
    make:'Ford', model:'Escape', years:[2017,2018,2019,2020,2021],
    engines: {
      '1.5L EcoBoost': { oilSpec:'5W-30 Motorcraft Full Synthetic', oilQty:'4.5 qts', filterPN:'Motorcraft FL-500-S', services: baseGasServices('5W-30','4.5 qts','FL-500-S',10000) },
      '2.0L EcoBoost': { oilSpec:'5W-30 Motorcraft Full Synthetic', oilQty:'5.7 qts', filterPN:'Motorcraft FL-500-S', services: baseGasServices('5W-30','5.7 qts','FL-500-S',10000) },
    }
  },

  'ford_explorer': {
    make:'Ford', model:'Explorer', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.3L EcoBoost': { oilSpec:'5W-30 Motorcraft Full Synthetic', oilQty:'5.7 qts', filterPN:'Motorcraft FL-500-S', services: baseGasServices('5W-30','5.7 qts','FL-500-S',10000) },
      '3.5L EcoBoost': { oilSpec:'5W-30 Motorcraft Full Synthetic', oilQty:'6 qts',   filterPN:'Motorcraft FL-500-S', services: baseGasServices('5W-30','6 qts','FL-500-S',10000) },
      '3.5L V6':       { oilSpec:'5W-20 Motorcraft Full Synthetic', oilQty:'6 qts',   filterPN:'Motorcraft FL-820-S', services: baseGasServices('5W-20','6 qts','FL-820-S',7500) },
    }
  },

  'ford_mustang': {
    make:'Ford', model:'Mustang', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.3L EcoBoost': { oilSpec:'5W-50 Motorcraft Full Synthetic', oilQty:'5.7 qts', filterPN:'Motorcraft FL-500-S', services: baseGasServices('5W-50','5.7 qts','FL-500-S',7500) },
      '5.0L V8 Coyote': { oilSpec:'5W-50 Motorcraft Full Synthetic', oilQty:'8 qts', filterPN:'Motorcraft FL-820-S', notes:'5W-50 only — never substitute 5W-20 or 5W-30 in the Coyote.', services: baseGasServices('5W-50','8 qts','FL-820-S',7500) },
    }
  },

  'ford_ranger': {
    make:'Ford', model:'Ranger', years:[2019,2020,2021],
    engines: {
      '2.3L EcoBoost': { oilSpec:'5W-30 Motorcraft Full Synthetic', oilQty:'5.7 qts', filterPN:'Motorcraft FL-500-S', services: baseGasServices('5W-30','5.7 qts','FL-500-S',10000) },
    }
  },

  'ford_transit': {
    make:'Ford', model:'Transit', years:[2017,2018,2019,2020,2021],
    engines: {
      '3.5L EcoBoost V6':  { oilSpec:'5W-30 Motorcraft Full Synthetic', oilQty:'6 qts',   filterPN:'Motorcraft FL-500-S', notes:'Commercial fleet use — follow severe duty intervals. Oil change every 7,500 mi or 6 months for fleet vehicles.', services: baseGasServices('5W-30','6 qts','FL-500-S',7500) },
      '3.7L V6':           { oilSpec:'5W-20 Motorcraft Full Synthetic', oilQty:'6 qts',   filterPN:'Motorcraft FL-820-S', services: baseGasServices('5W-20','6 qts','FL-820-S',7500) },
      '3.2L Power Stroke Diesel': { oilSpec:'5W-40 Full Synthetic Diesel', oilQty:'9.5 qts', filterPN:'Motorcraft FL-2051-S', notes:'5-cylinder diesel. DPF regen needs highway driving. Avoid short trips.', services: dieselServices('5W-40 Full Synthetic Diesel','9.5 qts','Motorcraft FL-2051-S') },
    }
  },

  // ══ CHEVROLET ══════════════════════════════════════════════
  'chevy_silverado_1500': {
    make:'Chevrolet', model:'Silverado 1500', years:[2017,2018,2019,2020,2021],
    engines: {
      '4.3L V6':  { oilSpec:'5W-30 Dexos Full Synthetic', oilQty:'6 qts',   filterPN:'AC Delco PF63',  services: baseGasServices('5W-30 Dexos','6 qts','AC Delco PF63',7500) },
      '5.3L V8':  { oilSpec:'0W-20 Dexos Full Synthetic', oilQty:'8 qts',   filterPN:'AC Delco PF63E', services: baseGasServices('0W-20 Dexos','8 qts','AC Delco PF63E',7500) },
      '6.2L V8':  { oilSpec:'0W-20 Dexos Full Synthetic', oilQty:'8 qts',   filterPN:'AC Delco PF63E', services: baseGasServices('0W-20 Dexos','8 qts','AC Delco PF63E',7500) },
    }
  },

  'chevy_silverado_2500_diesel': {
    make:'Chevrolet', model:'Silverado 2500HD', years:[2017,2018,2019,2020,2021],
    engines: {
      '6.6L Duramax L5P Diesel': { oilSpec:'0W-20 Dexos D Full Synthetic Diesel', oilQty:'10 qts',   filterPN:'AC Delco PF2232', notes:'L5P Duramax 2017+. Dexos D certified oil required.', services: dieselServices('0W-20 Dexos D','10 qts','AC Delco PF2232') },
      '6.6L Duramax LML Diesel': { oilSpec:'15W-40 CJ-4 Full Synthetic Diesel',   oilQty:'10 qts',   filterPN:'AC Delco PF2232', services: dieselServices('15W-40 CJ-4','10 qts','AC Delco PF2232') },
      '6.0L V8 Gas':             { oilSpec:'0W-20 Dexos Full Synthetic',           oilQty:'6 qts',   filterPN:'AC Delco PF63E',  services: baseGasServices('0W-20 Dexos','6 qts','AC Delco PF63E',7500) },
    }
  },

  'chevy_silverado_3500_diesel': {
    make:'Chevrolet', model:'Silverado 3500HD', years:[2017,2018,2019,2020,2021],
    engines: {
      '6.6L Duramax Diesel': { oilSpec:'0W-20 Dexos D Full Synthetic Diesel', oilQty:'10 qts', filterPN:'AC Delco PF2232', services: dieselServices('0W-20 Dexos D','10 qts','AC Delco PF2232') },
      '6.0L V8 Gas':         { oilSpec:'0W-20 Dexos Full Synthetic', oilQty:'6 qts', filterPN:'AC Delco PF63E', services: baseGasServices('0W-20 Dexos','6 qts','AC Delco PF63E',7500) },
    }
  },

  'chevy_equinox': {
    make:'Chevrolet', model:'Equinox', years:[2017,2018,2019,2020,2021],
    engines: {
      '1.5L Turbo': { oilSpec:'0W-20 Dexos1 Gen2 Full Synthetic', oilQty:'5 qts',   filterPN:'AC Delco PF64', notes:'Dexos1 Gen2 certified only. Non-certified oil voids GM warranty.', services: baseGasServices('0W-20 Dexos1 Gen2','5 qts','AC Delco PF64',7500) },
      '2.0L Turbo': { oilSpec:'0W-30 Dexos1 Full Synthetic',       oilQty:'5.5 qts', filterPN:'AC Delco PF64', services: baseGasServices('0W-30 Dexos1','5.5 qts','AC Delco PF64',7500) },
    }
  },

  'chevy_tahoe': {
    make:'Chevrolet', model:'Tahoe', years:[2017,2018,2019,2020,2021],
    engines: {
      '5.3L V8': { oilSpec:'0W-20 Dexos Full Synthetic', oilQty:'8 qts', filterPN:'AC Delco PF63E', services: baseGasServices('0W-20 Dexos','8 qts','AC Delco PF63E',7500) },
      '6.2L V8': { oilSpec:'0W-20 Dexos Full Synthetic', oilQty:'8 qts', filterPN:'AC Delco PF63E', services: baseGasServices('0W-20 Dexos','8 qts','AC Delco PF63E',7500) },
    }
  },

  'chevy_colorado': {
    make:'Chevrolet', model:'Colorado', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.5L 4-cyl':         { oilSpec:'5W-30 Dexos Full Synthetic',        oilQty:'5 qts',   filterPN:'AC Delco PF47',    services: baseGasServices('5W-30 Dexos','5 qts','AC Delco PF47',7500) },
      '3.6L V6':            { oilSpec:'0W-20 Dexos Full Synthetic',         oilQty:'6 qts',   filterPN:'AC Delco PF47',    services: baseGasServices('0W-20 Dexos','6 qts','AC Delco PF47',7500) },
      '2.8L Duramax Diesel':{ oilSpec:'5W-30 Dexos D Full Synthetic Diesel',oilQty:'7.6 qts', filterPN:'AC Delco PF2257G', services: dieselServices('5W-30 Dexos D','7.6 qts','AC Delco PF2257G') },
    }
  },

  'chevy_traverse': {
    make:'Chevrolet', model:'Traverse', years:[2017,2018,2019,2020,2021],
    engines: {
      '3.6L V6': { oilSpec:'0W-20 Dexos Full Synthetic', oilQty:'6 qts', filterPN:'AC Delco PF63E', services: baseGasServices('0W-20 Dexos','6 qts','AC Delco PF63E',7500) },
    }
  },

  // ══ GMC ════════════════════════════════════════════════════
  'gmc_sierra_1500': {
    make:'GMC', model:'Sierra 1500', years:[2017,2018,2019,2020,2021],
    engines: {
      '4.3L V6': { oilSpec:'5W-30 Dexos Full Synthetic', oilQty:'6 qts',   filterPN:'AC Delco PF63',  services: baseGasServices('5W-30 Dexos','6 qts','AC Delco PF63',7500) },
      '5.3L V8': { oilSpec:'0W-20 Dexos Full Synthetic', oilQty:'8 qts',   filterPN:'AC Delco PF63E', services: baseGasServices('0W-20 Dexos','8 qts','AC Delco PF63E',7500) },
      '6.2L V8': { oilSpec:'0W-20 Dexos Full Synthetic', oilQty:'8 qts',   filterPN:'AC Delco PF63E', services: baseGasServices('0W-20 Dexos','8 qts','AC Delco PF63E',7500) },
    }
  },

  'gmc_sierra_2500_diesel': {
    make:'GMC', model:'Sierra 2500HD', years:[2017,2018,2019,2020,2021],
    engines: {
      '6.6L Duramax Diesel': { oilSpec:'0W-20 Dexos D Full Synthetic Diesel', oilQty:'10 qts', filterPN:'AC Delco PF2232', services: dieselServices('0W-20 Dexos D','10 qts','AC Delco PF2232') },
      '6.0L V8 Gas':         { oilSpec:'0W-20 Dexos Full Synthetic',           oilQty:'6 qts',  filterPN:'AC Delco PF63E',  services: baseGasServices('0W-20 Dexos','6 qts','AC Delco PF63E',7500) },
    }
  },

  'gmc_sierra_3500_diesel': {
    make:'GMC', model:'Sierra 3500HD', years:[2017,2018,2019,2020,2021],
    engines: {
      '6.6L Duramax Diesel': { oilSpec:'0W-20 Dexos D Full Synthetic Diesel', oilQty:'10 qts', filterPN:'AC Delco PF2232', services: dieselServices('0W-20 Dexos D','10 qts','AC Delco PF2232') },
    }
  },

  'gmc_terrain': {
    make:'GMC', model:'Terrain', years:[2017,2018,2019,2020,2021],
    engines: {
      '1.5L Turbo': { oilSpec:'0W-20 Dexos1 Gen2 Full Synthetic', oilQty:'5 qts',   filterPN:'AC Delco PF64', services: baseGasServices('0W-20 Dexos1','5 qts','AC Delco PF64',7500) },
      '2.0L Turbo': { oilSpec:'0W-30 Dexos1 Full Synthetic',       oilQty:'5.5 qts', filterPN:'AC Delco PF64', services: baseGasServices('0W-30 Dexos1','5.5 qts','AC Delco PF64',7500) },
    }
  },

  'gmc_yukon': {
    make:'GMC', model:'Yukon', years:[2017,2018,2019,2020,2021],
    engines: {
      '5.3L V8': { oilSpec:'0W-20 Dexos Full Synthetic', oilQty:'8 qts', filterPN:'AC Delco PF63E', services: baseGasServices('0W-20 Dexos','8 qts','AC Delco PF63E',7500) },
      '6.2L V8': { oilSpec:'0W-20 Dexos Full Synthetic', oilQty:'8 qts', filterPN:'AC Delco PF63E', services: baseGasServices('0W-20 Dexos','8 qts','AC Delco PF63E',7500) },
    }
  },

  'gmc_canyon': {
    make:'GMC', model:'Canyon', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.5L 4-cyl':          { oilSpec:'5W-30 Dexos Full Synthetic',         oilQty:'5 qts',   filterPN:'AC Delco PF47',    services: baseGasServices('5W-30 Dexos','5 qts','AC Delco PF47',7500) },
      '3.6L V6':             { oilSpec:'0W-20 Dexos Full Synthetic',          oilQty:'6 qts',   filterPN:'AC Delco PF47',    services: baseGasServices('0W-20 Dexos','6 qts','AC Delco PF47',7500) },
      '2.8L Duramax Diesel': { oilSpec:'5W-30 Dexos D Full Synthetic Diesel', oilQty:'7.6 qts', filterPN:'AC Delco PF2257G', services: dieselServices('5W-30 Dexos D','7.6 qts','AC Delco PF2257G') },
    }
  },

  // ══ RAM ════════════════════════════════════════════════════
  'ram_1500': {
    make:'Ram', model:'1500', years:[2017,2018,2019,2020,2021],
    engines: {
      '3.6L Pentastar V6': { oilSpec:'5W-20 Mopar Full Synthetic', oilQty:'5.9 qts',  filterPN:'Mopar 68191349AC', services: baseGasServices('5W-20 Mopar','5.9 qts','Mopar 68191349AC',8000) },
      '5.7L HEMI V8':      { oilSpec:'5W-20 Mopar Full Synthetic', oilQty:'7 qts',    filterPN:'Mopar 68191349AC', services: baseGasServices('5W-20 Mopar','7 qts','Mopar 68191349AC',8000) },
      '3.0L EcoDiesel':    { oilSpec:'5W-40 Full Synthetic Diesel', oilQty:'10.5 qts', filterPN:'Mopar 68229897AA', notes:'EcoDiesel had multiple recall campaigns. Check NHTSA for VIN-specific recalls before purchase.', services: dieselServices('5W-40','10.5 qts','Mopar 68229897AA') },
    }
  },

  'ram_2500_diesel': {
    make:'Ram', model:'2500', years:[2017,2018,2019,2020,2021],
    engines: {
      '6.7L Cummins Diesel': { oilSpec:'15W-40 CJ-4 Diesel', oilQty:'12 qts w/ filter', filterPN:'Mopar 68157291AA', services: dieselServices('15W-40 CJ-4','12 qts','Mopar 68157291AA') },
      '5.7L HEMI V8':        { oilSpec:'5W-20 Mopar Full Synthetic', oilQty:'7 qts',     filterPN:'Mopar 68191349AC', services: baseGasServices('5W-20 Mopar','7 qts','Mopar 68191349AC',8000) },
      '6.4L HEMI Gas':       { oilSpec:'5W-20 Mopar Full Synthetic', oilQty:'7 qts',     filterPN:'Mopar 68191349AC', services: baseGasServices('5W-20 Mopar','7 qts','Mopar 68191349AC',8000) },
    }
  },

  'ram_3500_diesel': {
    make:'Ram', model:'3500', years:[2017,2018,2019,2020,2021],
    engines: {
      '6.7L Cummins Diesel': { oilSpec:'15W-40 CJ-4 Diesel', oilQty:'12 qts w/ filter', filterPN:'Mopar 68157291AA', services: dieselServices('15W-40 CJ-4','12 qts','Mopar 68157291AA') },
      '6.4L HEMI Gas':       { oilSpec:'5W-20 Mopar Full Synthetic', oilQty:'7 qts',    filterPN:'Mopar 68191349AC', services: baseGasServices('5W-20 Mopar','7 qts','Mopar 68191349AC',8000) },
    }
  },

  // ══ TOYOTA ═════════════════════════════════════════════════
  'toyota_rav4': {
    make:'Toyota', model:'RAV4', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.5L 4-cyl':   { oilSpec:'0W-20 Toyota Full Synthetic', oilQty:'4.6 qts', filterPN:'Toyota 04152-YZZA6', services: baseGasServices('0W-20 Toyota','4.6 qts','Toyota 04152-YZZA6',10000) },
      '2.5L Hybrid':  { oilSpec:'0W-20 Toyota Full Synthetic', oilQty:'4.6 qts', filterPN:'Toyota 04152-YZZA6', services: hybridServices('0W-20 Toyota','4.6 qts','Toyota 04152-YZZA6') },
    }
  },

  'toyota_camry': {
    make:'Toyota', model:'Camry', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.5L 4-cyl':  { oilSpec:'0W-20 Toyota Full Synthetic', oilQty:'4.8 qts', filterPN:'Toyota 04152-YZZA6', services: baseGasServices('0W-20 Toyota','4.8 qts','Toyota 04152-YZZA6',10000) },
      '3.5L V6':     { oilSpec:'0W-20 Toyota Full Synthetic', oilQty:'6.4 qts', filterPN:'Toyota 04152-YZZA6', services: baseGasServices('0W-20 Toyota','6.4 qts','Toyota 04152-YZZA6',10000) },
      '2.5L Hybrid': { oilSpec:'0W-20 Toyota Full Synthetic', oilQty:'4.8 qts', filterPN:'Toyota 04152-YZZA6', services: hybridServices('0W-20 Toyota','4.8 qts','Toyota 04152-YZZA6') },
    }
  },

  'toyota_tacoma': {
    make:'Toyota', model:'Tacoma', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.7L 4-cyl': { oilSpec:'0W-20 Toyota Full Synthetic', oilQty:'5.8 qts', filterPN:'Toyota 04152-YZZA6', services: baseGasServices('0W-20 Toyota','5.8 qts','Toyota 04152-YZZA6',10000) },
      '3.5L V6':    { oilSpec:'0W-20 Toyota Full Synthetic', oilQty:'6.2 qts', filterPN:'Toyota 04152-YZZA6', notes:'Known cold-start timing chain rattle — use 0W-20 Toyota-approved oil only.', services: baseGasServices('0W-20 Toyota','6.2 qts','Toyota 04152-YZZA6',10000) },
    }
  },

  'toyota_corolla': {
    make:'Toyota', model:'Corolla', years:[2017,2018,2019,2020,2021],
    engines: {
      '1.8L 4-cyl':          { oilSpec:'0W-20 Toyota Full Synthetic', oilQty:'4.4 qts', filterPN:'Toyota 04152-YZZA6', services: baseGasServices('0W-20 Toyota','4.4 qts','Toyota 04152-YZZA6',10000) },
      '2.0L 4-cyl (2020+)':  { oilSpec:'0W-16 Toyota Full Synthetic', oilQty:'4.8 qts', filterPN:'Toyota 04152-YZZA6', notes:'0W-16 required — do NOT substitute 0W-20 in 2020+ 2.0L engines.', services: baseGasServices('0W-16 Toyota','4.8 qts','Toyota 04152-YZZA6',10000) },
    }
  },

  'toyota_4runner': {
    make:'Toyota', model:'4Runner', years:[2017,2018,2019,2020,2021],
    engines: {
      '4.0L V6': { oilSpec:'5W-30 Toyota Full Synthetic', oilQty:'5.5 qts', filterPN:'Toyota 15607-31060', notes:'Uses 5W-30 not 0W-20. Front and rear diff fluid critical — change every 30k or after water crossings.', services: baseGasServices('5W-30 Toyota','5.5 qts','Toyota 15607-31060',5000) },
    }
  },

  'toyota_highlander': {
    make:'Toyota', model:'Highlander', years:[2017,2018,2019,2020,2021],
    engines: {
      '3.5L V6':       { oilSpec:'0W-20 Toyota Full Synthetic', oilQty:'6.4 qts', filterPN:'Toyota 04152-YZZA6', services: baseGasServices('0W-20 Toyota','6.4 qts','Toyota 04152-YZZA6',10000) },
      '3.5L V6 Hybrid':{ oilSpec:'0W-20 Toyota Full Synthetic', oilQty:'6.4 qts', filterPN:'Toyota 04152-YZZA6', services: hybridServices('0W-20 Toyota','6.4 qts','Toyota 04152-YZZA6') },
    }
  },

  'toyota_tundra': {
    make:'Toyota', model:'Tundra', years:[2017,2018,2019,2020,2021],
    engines: {
      '4.6L V8': { oilSpec:'0W-20 Toyota Full Synthetic', oilQty:'8 qts',   filterPN:'Toyota 15607-31060', services: baseGasServices('0W-20 Toyota','8 qts','Toyota 15607-31060',10000) },
      '5.7L V8': { oilSpec:'0W-20 Toyota Full Synthetic', oilQty:'8.5 qts', filterPN:'Toyota 15607-31060', services: baseGasServices('0W-20 Toyota','8.5 qts','Toyota 15607-31060',10000) },
    }
  },

  // ══ HONDA ══════════════════════════════════════════════════
  'honda_crv': {
    make:'Honda', model:'CR-V', years:[2017,2018,2019,2020,2021],
    engines: {
      '1.5L Turbo': { oilSpec:'0W-20 Honda Full Synthetic', oilQty:'3.9 qts', filterPN:'Honda 15400-PLM-A02', notes:'Oil dilution TSB — full synthetic only. Check oil level monthly.', services: baseGasServices('0W-20 Honda','3.9 qts','Honda 15400-PLM-A02',7500) },
      '2.4L 4-cyl': { oilSpec:'0W-20 Honda Full Synthetic', oilQty:'4.4 qts', filterPN:'Honda 15400-PLM-A02', services: baseGasServices('0W-20 Honda','4.4 qts','Honda 15400-PLM-A02',7500) },
    }
  },

  'honda_civic': {
    make:'Honda', model:'Civic', years:[2017,2018,2019,2020,2021],
    engines: {
      '1.5L Turbo': { oilSpec:'0W-20 Honda Full Synthetic', oilQty:'3.9 qts', filterPN:'Honda 15400-PLM-A02', services: baseGasServices('0W-20 Honda','3.9 qts','Honda 15400-PLM-A02',7500) },
      '2.0L 4-cyl': { oilSpec:'0W-20 Honda Full Synthetic', oilQty:'3.7 qts', filterPN:'Honda 15400-PLM-A02', services: baseGasServices('0W-20 Honda','3.7 qts','Honda 15400-PLM-A02',7500) },
    }
  },

  'honda_accord': {
    make:'Honda', model:'Accord', years:[2017,2018,2019,2020,2021],
    engines: {
      '1.5L Turbo':      { oilSpec:'0W-20 Honda Full Synthetic', oilQty:'3.9 qts', filterPN:'Honda 15400-PLM-A02', notes:'Oil dilution in cold climates — check monthly.', services: baseGasServices('0W-20 Honda','3.9 qts','Honda 15400-PLM-A02',7500) },
      '2.0L Turbo':      { oilSpec:'0W-20 Honda Full Synthetic', oilQty:'5.7 qts', filterPN:'Honda 15400-PLM-A02', services: baseGasServices('0W-20 Honda','5.7 qts','Honda 15400-PLM-A02',7500) },
      '3.5L V6 (2017)':  { oilSpec:'0W-20 Honda Full Synthetic', oilQty:'4.5 qts', filterPN:'Honda 15400-PLM-A02', services: baseGasServices('0W-20 Honda','4.5 qts','Honda 15400-PLM-A02',7500) },
    }
  },

  'honda_pilot': {
    make:'Honda', model:'Pilot', years:[2017,2018,2019,2020,2021],
    engines: {
      '3.5L V6': { oilSpec:'0W-20 Honda Full Synthetic', oilQty:'5.7 qts', filterPN:'Honda 15400-PLM-A02', notes:'9-speed ZF transmission — use Honda DW-1 ATF only. Critical for AWD models.', services: baseGasServices('0W-20 Honda','5.7 qts','Honda 15400-PLM-A02',7500) },
    }
  },

  'honda_odyssey': {
    make:'Honda', model:'Odyssey', years:[2017,2018,2019,2020,2021],
    engines: {
      '3.5L V6': { oilSpec:'0W-20 Honda Full Synthetic', oilQty:'4.5 qts', filterPN:'Honda 15400-PLM-A02', notes:'10-speed transmission 2018+ — Honda DW-1 ATF required.', services: baseGasServices('0W-20 Honda','4.5 qts','Honda 15400-PLM-A02',7500) },
    }
  },

  // ══ NISSAN ═════════════════════════════════════════════════
  'nissan_rogue': {
    make:'Nissan', model:'Rogue', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.5L 4-cyl': { oilSpec:'0W-20 Full Synthetic', oilQty:'5.1 qts', filterPN:'Nissan 15208-65F0E', notes: cvtNote('Nissan NS-3'), services: baseGasServices('0W-20','5.1 qts','Nissan 15208-65F0E',5000) },
    }
  },

  'nissan_altima': {
    make:'Nissan', model:'Altima', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.5L 4-cyl':          { oilSpec:'5W-30 Full Synthetic', oilQty:'4.9 qts', filterPN:'Nissan 15208-65F0E', notes: cvtNote('Nissan NS-3'), services: baseGasServices('5W-30','4.9 qts','Nissan 15208-65F0E',5000) },
      '2.0L Turbo (2019+)':  { oilSpec:'0W-20 Full Synthetic', oilQty:'4.2 qts', filterPN:'Nissan 15208-65F0E', services: baseGasServices('0W-20','4.2 qts','Nissan 15208-65F0E',5000) },
    }
  },

  'nissan_murano': {
    make:'Nissan', model:'Murano', years:[2017,2018,2019,2020,2021],
    engines: {
      '3.5L V6': { oilSpec:'5W-30 Full Synthetic', oilQty:'5.1 qts', filterPN:'Nissan 15208-65F0E', notes: cvtNote('Nissan NS-3'), services: baseGasServices('5W-30','5.1 qts','Nissan 15208-65F0E',5000) },
    }
  },

  'nissan_frontier': {
    make:'Nissan', model:'Frontier', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.5L 4-cyl': { oilSpec:'5W-30 Full Synthetic', oilQty:'4.2 qts', filterPN:'Nissan 15208-65F0A', services: baseGasServices('5W-30','4.2 qts','Nissan 15208-65F0A',5000) },
      '4.0L V6':    { oilSpec:'5W-30 Full Synthetic', oilQty:'5.4 qts', filterPN:'Nissan 15208-65F0A', services: baseGasServices('5W-30','5.4 qts','Nissan 15208-65F0A',5000) },
    }
  },

  // ══ JEEP ═══════════════════════════════════════════════════
  'jeep_grand_cherokee': {
    make:'Jeep', model:'Grand Cherokee', years:[2017,2018,2019,2020,2021],
    engines: {
      '3.6L Pentastar V6': { oilSpec:'5W-20 Mopar Full Synthetic', oilQty:'5.9 qts',  filterPN:'Mopar 68191349AC', services: baseGasServices('5W-20 Mopar','5.9 qts','Mopar 68191349AC',8000) },
      '5.7L HEMI V8':      { oilSpec:'5W-20 Mopar Full Synthetic', oilQty:'7 qts',    filterPN:'Mopar 68191349AC', services: baseGasServices('5W-20 Mopar','7 qts','Mopar 68191349AC',8000) },
      '3.0L EcoDiesel':    { oilSpec:'5W-40 Full Synthetic Diesel', oilQty:'10.5 qts', filterPN:'Mopar 68229897AA', services: dieselServices('5W-40','10.5 qts','Mopar 68229897AA') },
    }
  },

  'jeep_wrangler': {
    make:'Jeep', model:'Wrangler', years:[2017,2018,2019,2020,2021],
    engines: {
      '3.6L Pentastar V6': { oilSpec:'5W-20 Mopar Full Synthetic', oilQty:'5.9 qts', filterPN:'Mopar 68191349AC', notes:'Front and rear axle diff fluid critical for off-road — change every 30k or after water crossings.', services: baseGasServices('5W-20 Mopar','5.9 qts','Mopar 68191349AC',8000) },
      '2.0L Turbo (2018+)':{ oilSpec:'0W-20 Mopar Full Synthetic', oilQty:'5 qts',   filterPN:'Mopar 68191349AC', services: baseGasServices('0W-20 Mopar','5 qts','Mopar 68191349AC',8000) },
    }
  },

  // ══ SUBARU ═════════════════════════════════════════════════
  'subaru_outback': {
    make:'Subaru', model:'Outback', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.5L Boxer 4-cyl': { oilSpec:'0W-20 Subaru Full Synthetic', oilQty:'5.1 qts', filterPN:'Subaru 15208AA15A', notes:'Horizontally-opposed engines consume more oil. Check every 1,000 miles.', services: baseGasServices('0W-20 Subaru','5.1 qts','Subaru 15208AA15A',6000) },
      '3.6L Boxer 6-cyl': { oilSpec:'5W-30 Subaru Full Synthetic', oilQty:'6.9 qts', filterPN:'Subaru 15208AA15A', notes:'Higher oil consumption is normal — monitor and top off between changes.', services: baseGasServices('5W-30 Subaru','6.9 qts','Subaru 15208AA15A',6000) },
    }
  },

  'subaru_forester': {
    make:'Subaru', model:'Forester', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.5L Boxer 4-cyl': { oilSpec:'0W-20 Subaru Full Synthetic', oilQty:'5.1 qts', filterPN:'Subaru 15208AA15A', notes:'Oil consumption is common — check monthly.', services: baseGasServices('0W-20 Subaru','5.1 qts','Subaru 15208AA15A',6000) },
    }
  },

  'subaru_crosstrek': {
    make:'Subaru', model:'Crosstrek', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.0L Boxer 4-cyl':        { oilSpec:'0W-20 Subaru Full Synthetic', oilQty:'4.4 qts', filterPN:'Subaru 15208AA15A', notes:'CVT fluid change every 30k recommended. Check oil monthly.', services: baseGasServices('0W-20 Subaru','4.4 qts','Subaru 15208AA15A',6000) },
      '2.5L Boxer 4-cyl (2021+)':{ oilSpec:'0W-20 Subaru Full Synthetic', oilQty:'5.1 qts', filterPN:'Subaru 15208AA15A', services: baseGasServices('0W-20 Subaru','5.1 qts','Subaru 15208AA15A',6000) },
    }
  },

  // ══ HYUNDAI ════════════════════════════════════════════════
  'hyundai_tucson': {
    make:'Hyundai', model:'Tucson', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.0L 4-cyl':  { oilSpec:'5W-20 Full Synthetic', oilQty:'4.8 qts', filterPN:'Hyundai 26300-35503', services: baseGasServices('5W-20','4.8 qts','Hyundai 26300-35503',7500) },
      '1.6L Turbo':  { oilSpec:'0W-20 Full Synthetic', oilQty:'4.2 qts', filterPN:'Hyundai 26300-35503', services: baseGasServices('0W-20','4.2 qts','Hyundai 26300-35503',7500) },
    }
  },

  'hyundai_santa_fe': {
    make:'Hyundai', model:'Santa Fe', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.4L 4-cyl': { oilSpec:'5W-20 Full Synthetic', oilQty:'4.8 qts', filterPN:'Hyundai 26300-35503', services: baseGasServices('5W-20','4.8 qts','Hyundai 26300-35503',7500) },
      '2.0L Turbo': { oilSpec:'5W-30 Full Synthetic', oilQty:'5.3 qts', filterPN:'Hyundai 26300-35503', services: baseGasServices('5W-30','5.3 qts','Hyundai 26300-35503',7500) },
      '3.3L V6':    { oilSpec:'5W-20 Full Synthetic', oilQty:'6.1 qts', filterPN:'Hyundai 26300-35503', services: baseGasServices('5W-20','6.1 qts','Hyundai 26300-35503',7500) },
    }
  },

  'hyundai_elantra': {
    make:'Hyundai', model:'Elantra', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.0L 4-cyl': { oilSpec:'5W-20 Full Synthetic', oilQty:'4.2 qts', filterPN:'Hyundai 26300-35503', services: baseGasServices('5W-20','4.2 qts','Hyundai 26300-35503',7500) },
      '1.4L Turbo': { oilSpec:'0W-20 Full Synthetic', oilQty:'3.7 qts', filterPN:'Hyundai 26300-35503', services: baseGasServices('0W-20','3.7 qts','Hyundai 26300-35503',7500) },
    }
  },

  // ══ KIA ════════════════════════════════════════════════════
  'kia_sorento': {
    make:'Kia', model:'Sorento', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.4L 4-cyl': { oilSpec:'5W-20 Full Synthetic', oilQty:'4.8 qts', filterPN:'Kia 26300-35503', services: baseGasServices('5W-20','4.8 qts','Kia 26300-35503',7500) },
      '3.3L V6':    { oilSpec:'5W-20 Full Synthetic', oilQty:'5.7 qts', filterPN:'Kia 26300-35503', services: baseGasServices('5W-20','5.7 qts','Kia 26300-35503',7500) },
      '2.0L Turbo': { oilSpec:'0W-20 Full Synthetic', oilQty:'4.8 qts', filterPN:'Kia 26300-35503', services: baseGasServices('0W-20','4.8 qts','Kia 26300-35503',7500) },
    }
  },

  'kia_sportage': {
    make:'Kia', model:'Sportage', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.4L 4-cyl': { oilSpec:'5W-20 Full Synthetic', oilQty:'4.8 qts', filterPN:'Kia 26300-35503', services: baseGasServices('5W-20','4.8 qts','Kia 26300-35503',8000) },
      '2.0L Turbo': { oilSpec:'5W-30 Full Synthetic', oilQty:'4.2 qts', filterPN:'Kia 26300-35503', services: baseGasServices('5W-30','4.2 qts','Kia 26300-35503',8000) },
    }
  },

  'kia_telluride': {
    make:'Kia', model:'Telluride', years:[2020,2021],
    engines: {
      '3.8L V6': { oilSpec:'5W-20 Full Synthetic', oilQty:'6.9 qts', filterPN:'Kia 26300-35503', notes:'AWD models — rear axle and transfer case fluid every 37,500 mi. Transmission fluid at 60k.', services: baseGasServices('5W-20','6.9 qts','Kia 26300-35503',7500) },
    }
  },

  'kia_soul': {
    make:'Kia', model:'Soul', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.0L 4-cyl': { oilSpec:'5W-20 Full Synthetic', oilQty:'4.2 qts', filterPN:'Kia 26300-35503', services: baseGasServices('5W-20','4.2 qts','Kia 26300-35503',7500) },
      '1.6L Turbo': { oilSpec:'0W-20 Full Synthetic', oilQty:'3.7 qts', filterPN:'Kia 26300-35503', services: baseGasServices('0W-20','3.7 qts','Kia 26300-35503',7500) },
    }
  },

  // ══ MAZDA ══════════════════════════════════════════════════
  'mazda_cx5': {
    make:'Mazda', model:'CX-5', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.0L SKYACTIV-G':      { oilSpec:'0W-20 Mazda Full Synthetic', oilQty:'4.4 qts', filterPN:'Mazda PE01-14-302', notes:'FL-22 coolant required — no substitutions.', services: baseGasServices('0W-20 Mazda','4.4 qts','Mazda PE01-14-302',7500) },
      '2.5L SKYACTIV-G':      { oilSpec:'0W-20 Mazda Full Synthetic', oilQty:'4.8 qts', filterPN:'Mazda PE01-14-302', notes:'FL-22 coolant required.', services: baseGasServices('0W-20 Mazda','4.8 qts','Mazda PE01-14-302',7500) },
      '2.5L Turbo (2021+)':   { oilSpec:'0W-20 Mazda Full Synthetic', oilQty:'5.1 qts', filterPN:'Mazda PE01-14-302', notes:'Turbocharged — use full synthetic only. FL-22 coolant.', services: baseGasServices('0W-20 Mazda','5.1 qts','Mazda PE01-14-302',7500) },
    }
  },

  'mazda_cx9': {
    make:'Mazda', model:'CX-9', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.5L Turbo SKYACTIV-G': { oilSpec:'0W-20 Mazda Full Synthetic', oilQty:'5.3 qts', filterPN:'Mazda PE01-14-302', notes:'FL-22 coolant only. Change oil at least yearly regardless of mileage.', services: baseGasServices('0W-20 Mazda','5.3 qts','Mazda PE01-14-302',7500) },
    }
  },

  'mazda_mazda3': {
    make:'Mazda', model:'Mazda3', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.0L SKYACTIV-G': { oilSpec:'0W-20 Mazda Full Synthetic', oilQty:'4.4 qts', filterPN:'Mazda PE01-14-302', services: baseGasServices('0W-20 Mazda','4.4 qts','Mazda PE01-14-302',7500) },
      '2.5L SKYACTIV-G': { oilSpec:'0W-20 Mazda Full Synthetic', oilQty:'4.8 qts', filterPN:'Mazda PE01-14-302', services: baseGasServices('0W-20 Mazda','4.8 qts','Mazda PE01-14-302',7500) },
    }
  },

  'mazda_mazda6': {
    make:'Mazda', model:'Mazda6', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.5L SKYACTIV-G': { oilSpec:'0W-20 Mazda Full Synthetic', oilQty:'4.8 qts', filterPN:'Mazda PE01-14-302', services: baseGasServices('0W-20 Mazda','4.8 qts','Mazda PE01-14-302',7500) },
    }
  },

  // ══ VOLKSWAGEN ═════════════════════════════════════════════
  'vw_jetta': {
    make:'Volkswagen', model:'Jetta', years:[2017,2018,2019,2020,2021],
    engines: {
      '1.4L Turbo':    { oilSpec:'5W-40 VW 502.00 Full Synthetic', oilQty:'4.5 qts', filterPN:'Mann HU7111', notes:'Must use VW 502.00 certified oil. Longlife service — do not exceed 10k miles.', services: baseGasServices('5W-40 VW 502.00','4.5 qts','Mann HU7111',10000) },
      '2.0L Turbo GLI':{ oilSpec:'5W-40 VW 502.00 Full Synthetic', oilQty:'4.7 qts', filterPN:'Mann HU7111', services: baseGasServices('5W-40 VW 502.00','4.7 qts','Mann HU7111',10000) },
    }
  },

  'vw_tiguan': {
    make:'Volkswagen', model:'Tiguan', years:[2017,2018,2019,2020,2021],
    engines: {
      '2.0L Turbo TSI': { oilSpec:'5W-40 VW 502.00 Full Synthetic', oilQty:'4.7 qts', filterPN:'Mann HU7111', notes:'VW 502.00 certified oil required. DSG transmission fluid every 40k.', services: baseGasServices('5W-40 VW 502.00','4.7 qts','Mann HU7111',10000) },
    }
  },

  // ══ DODGE / CHRYSLER ═══════════════════════════════════════
  'dodge_grand_caravan': {
    make:'Dodge', model:'Grand Caravan', years:[2017,2018,2019,2020],
    engines: {
      '3.6L Pentastar V6': { oilSpec:'5W-20 Mopar Full Synthetic', oilQty:'5.9 qts', filterPN:'Mopar 68191349AC', services: baseGasServices('5W-20 Mopar','5.9 qts','Mopar 68191349AC',8000) },
    }
  },

  'chrysler_pacifica': {
    make:'Chrysler', model:'Pacifica', years:[2017,2018,2019,2020,2021],
    engines: {
      '3.6L Pentastar V6':  { oilSpec:'5W-20 Mopar Full Synthetic', oilQty:'5.9 qts', filterPN:'Mopar 68191349AC', services: baseGasServices('5W-20 Mopar','5.9 qts','Mopar 68191349AC',8000) },
      '3.6L Hybrid (PHEV)': { oilSpec:'5W-20 Mopar Full Synthetic', oilQty:'5.9 qts', filterPN:'Mopar 68191349AC', notes:'PHEV — also requires high-voltage battery inspection every 2 years.', services: hybridServices('5W-20 Mopar','5.9 qts','Mopar 68191349AC') },
    }
  },

};


// ─────────────────────────────────────────────────────────────
// PART 4: LOOKUP + CALCULATION FUNCTIONS
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// FUZZY MATCH HELPER
// Strips hyphens, spaces, punctuation, lowercases for comparison
// Allows "f250", "F250", "f-250" all to match "F-250"
// ─────────────────────────────────────────────────────────────
function fuzzy(str) {
  return str.toLowerCase().replace(/[-\s\.]/g, '');
}

export function getMaintenanceSchedule(make, model, engine) {
  const makeN  = fuzzy(make.trim());
  const modelN = fuzzy(model.trim());

  // Find matching vehicle — fuzzy on both make and model
  const key = Object.keys(MAINTENANCE_DB).find(k => {
    const v = MAINTENANCE_DB[k];
    return fuzzy(v.make) === makeN && fuzzy(v.model) === modelN;
  });

  if (!key) return null;
  const vehicle = MAINTENANCE_DB[key];

  // Find matching engine — fuzzy, falls back to first engine if no match
  let engineData, engineName;
  if (engine && engine.trim()) {
    const engineN = fuzzy(engine.trim());
    engineName = Object.keys(vehicle.engines).find(e =>
      fuzzy(e).includes(engineN) ||
      engineN.includes(fuzzy(e).substring(0, 4)) ||
      fuzzy(e).startsWith(engineN.substring(0, 4))
    );
    engineData = engineName ? vehicle.engines[engineName] : Object.values(vehicle.engines)[0];
    if (!engineName) engineName = Object.keys(vehicle.engines)[0];
  } else {
    engineName = Object.keys(vehicle.engines)[0];
    engineData = Object.values(vehicle.engines)[0];
  }

  return {
    make: vehicle.make, model: vehicle.model, years: vehicle.years,
    engineName, oilSpec: engineData.oilSpec, oilQty: engineData.oilQty,
    filterPN: engineData.filterPN, notes: engineData.notes || null,
    services: engineData.services,
  };
}

// ─────────────────────────────────────────────────────────────
// PICKER DATA HELPERS
// Returns arrays for ScrollView/Picker selectors
// ─────────────────────────────────────────────────────────────

/** Returns sorted list of all unique makes in the database */
export function getAllMakes() {
  const makes = [...new Set(Object.values(MAINTENANCE_DB).map(v => v.make))];
  return makes.sort();
}

/** Returns all models for a given make */
export function getModelsForMake(make) {
  const makeN = fuzzy(make);
  const models = Object.values(MAINTENANCE_DB)
    .filter(v => fuzzy(v.make) === makeN)
    .map(v => v.model);
  return [...new Set(models)].sort();
}

/** Returns all engines for a given make + model */
export function getEnginesForMakeModel(make, model) {
  const makeN  = fuzzy(make);
  const modelN = fuzzy(model);
  const vehicle = Object.values(MAINTENANCE_DB).find(v =>
    fuzzy(v.make) === makeN && fuzzy(v.model) === modelN
  );
  return vehicle ? Object.keys(vehicle.engines) : [];
}

/** Returns year range for a given make + model */
export function getYearsForMakeModel(make, model) {
  const makeN  = fuzzy(make);
  const modelN = fuzzy(model);
  const vehicle = Object.values(MAINTENANCE_DB).find(v =>
    fuzzy(v.make) === makeN && fuzzy(v.model) === modelN
  );
  return vehicle ? vehicle.years : [];
}

export function calculateDueServices(services, currentMileage, serviceHistory = {}) {
  return services.map(service => {
    const history = serviceHistory[service.id];
    const lastMileage = history?.lastMileage || 0;
    const milesUntilDue = service.interval_miles
      ? (lastMileage + service.interval_miles) - currentMileage
      : null;
    let status = 'ok';
    if (milesUntilDue !== null) {
      if (milesUntilDue <= 0) status = 'overdue';
      else if (milesUntilDue <= 1500) status = 'due_soon';
    }
    return { ...service, lastMileage, milesUntilDue, status };
  }).sort((a, b) => ({ overdue:0, due_soon:1, ok:2 }[a.status] - { overdue:0, due_soon:1, ok:2 }[b.status]));
}

export const DB_SUMMARY = {
  totalVehicles: Object.keys(MAINTENANCE_DB).length,
  makes: [...new Set(Object.values(MAINTENANCE_DB).map(v => v.make))].sort(),
  yearRange: '2017-2021',
  targetAudience: 'DIY owners of 5-9 year old high-mileage vehicles (2026)',
};
