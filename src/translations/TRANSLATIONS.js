// ============================================================
// AutoCoach — TRANSLATIONS.js
// Coach Platform LLC
// All UI strings in English (EN) and Spanish (ES)
// Usage: T(key) helper reads lang state and returns correct string
// Rule: ONLY plain string values in this object.
//       All lang === ternary logic belongs in JSX render code only.
//       Components outside App that need language must receive
//       `lang` as an explicit prop.
// ============================================================

export const TRANSLATIONS = {

  // ─────────────────────────────────────────────
  // APP HEADER & NAVIGATION
  // ─────────────────────────────────────────────
  appName: {
    EN: "AutoCoach",
    ES: "AutoCoach",
  },
  tagline: {
    EN: "Your vehicle. Always ready.",
    ES: "Tu vehículo. Siempre listo.",
  },
  nav_garage: {
    EN: "Garage",
    ES: "Garaje",
  },
  nav_schedule: {
    EN: "Schedule",
    ES: "Programa",
  },
  nav_shop: {
    EN: "Shop",
    ES: "Tienda",
  },
  nav_history: {
    EN: "History",
    ES: "Historial",
  },
  nav_fuel: {
    EN: "Fuel",
    ES: "Combustible",
  },

  // ─────────────────────────────────────────────
  // ONBOARDING
  // ─────────────────────────────────────────────
  onboarding_welcome_title: {
    EN: "Welcome to AutoCoach",
    ES: "Bienvenido a AutoCoach",
  },
  onboarding_welcome_subtitle: {
    EN: "Smart vehicle maintenance — personalized to your exact year, make, and model.",
    ES: "Mantenimiento inteligente — personalizado para tu año, marca y modelo exactos.",
  },
  onboarding_step1_title: {
    EN: "Add your vehicle",
    ES: "Agrega tu vehículo",
  },
  onboarding_step1_body: {
    EN: "Enter your VIN or select year, make, model, and engine. AutoCoach builds your exact maintenance schedule automatically.",
    ES: "Ingresa tu VIN o selecciona año, marca, modelo y motor. AutoCoach construye tu programa de mantenimiento exacto automáticamente.",
  },
  onboarding_step2_title: {
    EN: "Photo your odometer",
    ES: "Fotografía tu odómetro",
  },
  onboarding_step2_body: {
    EN: "Every time you fill up, snap a photo of your odometer. AutoCoach reads the mileage automatically and updates your service schedule.",
    ES: "Cada vez que llenes el tanque, toma una foto de tu odómetro. AutoCoach lee el millaje automáticamente y actualiza tu programa de servicio.",
  },
  onboarding_step3_title: {
    EN: "Stay ahead of service",
    ES: "Mantente al día con el servicio",
  },
  onboarding_step3_body: {
    EN: "Get reminders before services are due — by mileage or time, whichever comes first. Never miss a service again.",
    ES: "Recibe recordatorios antes de que venza un servicio — por millaje o por tiempo, lo que llegue primero. Nunca vuelvas a perder un servicio.",
  },
  onboarding_step4_title: {
    EN: "Build your resale value",
    ES: "Aumenta el valor de reventa",
  },
  onboarding_step4_body: {
    EN: "Every service log and odometer photo creates a verified, timestamped history. Show buyers proof — a documented vehicle is worth more.",
    ES: "Cada registro de servicio y foto de odómetro crea un historial verificado con marca de tiempo. Muestra a los compradores la evidencia — un vehículo documentado vale más.",
  },
  onboarding_get_started: {
    EN: "Get Started",
    ES: "Comenzar",
  },
  onboarding_next: {
    EN: "Next",
    ES: "Siguiente",
  },
  onboarding_skip: {
    EN: "Skip",
    ES: "Omitir",
  },
  onboarding_disclaimer_title: {
    EN: "Before you begin",
    ES: "Antes de comenzar",
  },
  onboarding_disclaimer_body: {
    EN: "AutoCoach provides maintenance guidance based on manufacturer recommendations and general industry standards. Always consult your vehicle's owner manual and a qualified mechanic for safety-critical decisions. AutoCoach is not responsible for mechanical outcomes.",
    ES: "AutoCoach proporciona orientación de mantenimiento basada en las recomendaciones del fabricante y los estándares generales de la industria. Siempre consulta el manual del propietario de tu vehículo y a un mecánico calificado para decisiones de seguridad críticas. AutoCoach no es responsable de los resultados mecánicos.",
  },
  onboarding_disclaimer_agree: {
    EN: "I understand — let's go",
    ES: "Entiendo — vamos",
  },

  // ─────────────────────────────────────────────
  // SUBSCRIPTION / PAYWALL
  // ─────────────────────────────────────────────
  paywall_title: {
    EN: "AutoCoach Pro",
    ES: "AutoCoach Pro",
  },
  paywall_subtitle: {
    EN: "Full vehicle maintenance intelligence for less than a cup of coffee a month.",
    ES: "Inteligencia completa de mantenimiento vehicular por menos que una taza de café al mes.",
  },
  // Tier names
  paywall_tier_1_name: {
    EN: "Solo",
    ES: "Individual",
  },
  paywall_tier_2_name: {
    EN: "Duo",
    ES: "Dúo",
  },
  paywall_tier_3_name: {
    EN: "Family",
    ES: "Familiar",
  },
  paywall_tier_4_name: {
    EN: "Family Plus",
    ES: "Familiar Plus",
  },
  paywall_tier_fleet_s_name: {
    EN: "Fleet Small",
    ES: "Flotilla Pequeña",
  },
  paywall_tier_fleet_m_name: {
    EN: "Fleet Medium",
    ES: "Flotilla Mediana",
  },
  paywall_tier_fleet_l_name: {
    EN: "Fleet Large",
    ES: "Flotilla Grande",
  },

  // Tier prices
  paywall_tier_1_price: {
    EN: "$3.99 / month",
    ES: "$3.99 / mes",
  },
  paywall_tier_2_price: {
    EN: "$6.99 / month",
    ES: "$6.99 / mes",
  },
  paywall_tier_3_price: {
    EN: "$7.99 / month",
    ES: "$7.99 / mes",
  },
  paywall_tier_4_price: {
    EN: "$9.99 / month",
    ES: "$9.99 / mes",
  },
  paywall_tier_fleet_s_price: {
    EN: "$13.99 / month",
    ES: "$13.99 / mes",
  },
  paywall_tier_fleet_m_price: {
    EN: "$19.99 / month",
    ES: "$19.99 / mes",
  },
  paywall_tier_fleet_l_price: {
    EN: "$29.99 / month",
    ES: "$29.99 / mes",
  },

  // Tier vehicle counts
  paywall_tier_1_vehicles: {
    EN: "1 vehicle",
    ES: "1 vehículo",
  },
  paywall_tier_2_vehicles: {
    EN: "Up to 2 vehicles",
    ES: "Hasta 2 vehículos",
  },
  paywall_tier_3_vehicles: {
    EN: "Up to 3 vehicles",
    ES: "Hasta 3 vehículos",
  },
  paywall_tier_4_vehicles: {
    EN: "Up to 4 vehicles",
    ES: "Hasta 4 vehículos",
  },
  paywall_tier_fleet_s_vehicles: {
    EN: "Up to 6 vehicles",
    ES: "Hasta 6 vehículos",
  },
  paywall_tier_fleet_m_vehicles: {
    EN: "Up to 10 vehicles",
    ES: "Hasta 10 vehículos",
  },
  paywall_tier_fleet_l_vehicles: {
    EN: "Up to 20 vehicles",
    ES: "Hasta 20 vehículos",
  },

  // Tier badges / callouts
  paywall_tier_1_badge: {
    EN: "Personal",
    ES: "Personal",
  },
  paywall_tier_2_badge: {
    EN: "Couple / roommates",
    ES: "Pareja / compañeros",
  },
  paywall_tier_3_badge: {
    EN: "Family",
    ES: "Familia",
  },
  paywall_tier_4_badge: {
    EN: "Best family value",
    ES: "Mejor valor familiar",
  },
  paywall_tier_fleet_s_badge: {
    EN: "Small business",
    ES: "Pequeña empresa",
  },
  paywall_tier_fleet_m_badge: {
    EN: "Growing fleet",
    ES: "Flotilla en crecimiento",
  },
  paywall_tier_fleet_l_badge: {
    EN: "Large fleet",
    ES: "Flotilla grande",
  },

  // Annual equivalents
  paywall_tier_1_annual: {
    EN: "$29.99 / year — save $18",
    ES: "$29.99 / año — ahorra $18",
  },
  paywall_tier_2_annual: {
    EN: "$55.99 / year — save $28",
    ES: "$55.99 / año — ahorra $28",
  },
  paywall_tier_3_annual: {
    EN: "$63.99 / year — save $32",
    ES: "$63.99 / año — ahorra $32",
  },
  paywall_tier_4_annual: {
    EN: "$79.99 / year — save $40",
    ES: "$79.99 / año — ahorra $40",
  },
  paywall_tier_fleet_s_annual: {
    EN: "$111.99 / year — 2 months free",
    ES: "$111.99 / año — 2 meses gratis",
  },
  paywall_tier_fleet_m_annual: {
    EN: "$159.99 / year — 2 months free",
    ES: "$159.99 / año — 2 meses gratis",
  },
  paywall_tier_fleet_l_annual: {
    EN: "$239.99 / year — 2 months free",
    ES: "$239.99 / año — 2 meses gratis",
  },

  // Paywall UI labels
  paywall_choose_plan: {
    EN: "Choose your plan",
    ES: "Elige tu plan",
  },
  paywall_personal_plans: {
    EN: "Personal",
    ES: "Personal",
  },
  paywall_fleet_plans: {
    EN: "Fleet / Business",
    ES: "Flotilla / Negocio",
  },
  paywall_billed_monthly: {
    EN: "Billed monthly",
    ES: "Facturado mensualmente",
  },
  paywall_billed_annually: {
    EN: "Billed annually",
    ES: "Facturado anualmente",
  },
  paywall_most_popular: {
    EN: "Most popular",
    ES: "Más popular",
  },
  paywall_best_value: {
    EN: "Best value",
    ES: "Mejor valor",
  },
  paywall_per_vehicle: {
    EN: "per vehicle / mo",
    ES: "por vehículo / mes",
  },
  paywall_upgrade_anytime: {
    EN: "Upgrade your plan anytime as your fleet grows",
    ES: "Actualiza tu plan en cualquier momento a medida que crece tu flotilla",
  },
  paywall_downgrade_anytime: {
    EN: "Downgrade or cancel anytime",
    ES: "Reduce o cancela en cualquier momento",
  },
  paywall_fleet_20plus: {
    EN: "More than 20 vehicles? $29.99/mo + $1.50 per vehicle over 20.",
    ES: "¿Más de 20 vehículos? $29.99/mes + $1.50 por vehículo adicional después de 20.",
  },
  paywall_fleet_20plus_example: {
    EN: "Example: 25 vehicles = $29.99 + (5 × $1.50) = $37.49/mo",
    ES: "Ejemplo: 25 vehículos = $29.99 + (5 × $1.50) = $37.49/mes",
  },
  paywall_fleet_contact: {
    EN: "Contact us to set up your enterprise account",
    ES: "Contáctanos para configurar tu cuenta empresarial",
  },

  // ─────────────────────────────────────────────
  // FLEET PRICING CALCULATOR — all 7 tiers + enterprise
  // ─────────────────────────────────────────────

  // Chip labels (short — header row)
  calc_chip_solo: { EN: "Solo", ES: "Individual" },
  calc_chip_duo: { EN: "Duo", ES: "Dúo" },
  calc_chip_family: { EN: "Family", ES: "Familiar" },
  calc_chip_family_plus: { EN: "Family Plus", ES: "Familiar Plus" },
  calc_chip_fleet_s: { EN: "Fleet S", ES: "Flotilla P" },
  calc_chip_fleet_m: { EN: "Fleet M", ES: "Flotilla M" },
  calc_chip_fleet_l: { EN: "Fleet L", ES: "Flotilla G" },
  calc_chip_enterprise: { EN: "21+ ⚙", ES: "21+ ⚙" },

  // Section labels
  calc_choose_plan: { EN: "Choose your plan", ES: "Elige tu plan" },
  calc_qty_label: { EN: "Number of vehicles", ES: "Número de vehículos" },
  calc_monthly_label: { EN: "Monthly", ES: "Mensual" },
  calc_annual_label: { EN: "Annual (2 mo free)", ES: "Anual (2 meses gratis)" },
  calc_enterprise_label: { EN: "Enterprise calculator", ES: "Calculadora empresarial" },

  // Tier names
  calc_name_solo: { EN: "Solo", ES: "Individual" },
  calc_name_duo: { EN: "Duo", ES: "Dúo" },
  calc_name_family: { EN: "Family", ES: "Familiar" },
  calc_name_family_plus: { EN: "Family Plus", ES: "Familiar Plus" },
  calc_name_fleet_s: { EN: "Fleet Small", ES: "Flotilla Pequeña" },
  calc_name_fleet_m: { EN: "Fleet Medium", ES: "Flotilla Mediana" },
  calc_name_fleet_l: { EN: "Fleet Large", ES: "Flotilla Grande" },
  calc_name_enterprise: { EN: "Enterprise", ES: "Empresarial" },

  // Tier badges
  calc_badge_solo: { EN: "Personal", ES: "Personal" },
  calc_badge_duo: { EN: "2 vehicles", ES: "2 vehículos" },
  calc_badge_family: { EN: "Family", ES: "Familiar" },
  calc_badge_family_plus: { EN: "Best family value", ES: "Mejor valor familiar" },
  calc_badge_fleet_s: { EN: "Small business", ES: "Pequeña empresa" },
  calc_badge_fleet_m: { EN: "Growing fleet", ES: "Flotilla en crecimiento" },
  calc_badge_fleet_l: { EN: "Large fleet", ES: "Flotilla grande" },

  // Vehicle count labels
  calc_vehicles_solo: { EN: "1 vehicle", ES: "1 vehículo" },
  calc_vehicles_duo: { EN: "Up to 2 vehicles", ES: "Hasta 2 vehículos" },
  calc_vehicles_family: { EN: "Up to 3 vehicles", ES: "Hasta 3 vehículos" },
  calc_vehicles_family_plus: { EN: "Up to 4 vehicles", ES: "Hasta 4 vehículos" },
  calc_vehicles_fleet_s: { EN: "Up to 6 vehicles", ES: "Hasta 6 vehículos" },
  calc_vehicles_fleet_m: { EN: "Up to 10 vehicles", ES: "Hasta 10 vehículos" },
  calc_vehicles_fleet_l: { EN: "Up to 20 vehicles", ES: "Hasta 20 vehículos" },
  calc_vehicles_enterprise: { EN: "21+ vehicles", ES: "21+ vehículos" },

  // Annual savings lines (dynamic — suffix appended in code)
  calc_annual_prefix: { EN: "Annual: $", ES: "Anual: $" },
  calc_annual_suffix: { EN: "/yr", ES: "/año" },
  calc_annual_saves: { EN: "save", ES: "ahorra" },
  calc_annual_saves_pill: { EN: "Annual saves $", ES: "Anual ahorra $" },

  // Enterprise breakdown line
  calc_breakdown_base: { EN: "Base", ES: "Base" },
  calc_breakdown_vehicle_singular: { EN: "vehicle", ES: "vehículo" },
  calc_breakdown_vehicle_plural: { EN: "vehicles", ES: "vehículos" },
  calc_breakdown_over_20: { EN: "over 20", ES: "adicionales sobre 20" },

  // Enterprise min vehicles note
  calc_enterprise_min: {
    EN: "Minimum 21 vehicles for enterprise tier.",
    ES: "Mínimo 21 vehículos para el nivel empresarial.",
  },
  calc_enterprise_range: {
    EN: "21 – 999 vehicles supported.",
    ES: "Compatible con 21 a 999 vehículos.",
  },

  // CTA buttons
  calc_cta_subscribe_prefix: { EN: "Subscribe — $", ES: "Suscribirme — $" },
  calc_cta_subscribe_suffix: { EN: "/mo", ES: "/mes" },
  calc_cta_annual_prefix: { EN: "Annual — $", ES: "Anual — $" },
  calc_cta_annual_suffix: { EN: "/yr", ES: "/año" },
  calc_cta_enterprise: {
    EN: "Contact us to set up account",
    ES: "Contáctanos para configurar cuenta",
  },
  calc_cta_enterprise_learn: {
    EN: "Learn more about fleet plans",
    ES: "Conocer más sobre planes de flotilla",
  },

  // Most popular / best value callouts
  calc_most_popular: { EN: "Most popular", ES: "Más popular" },
  calc_best_value: { EN: "Best value", ES: "Mejor valor" },
  fleet_enterprise_label: {
    EN: "Enterprise (21+ vehicles)",
    ES: "Empresarial (21+ vehículos)",
  },
  fleet_enterprise_price: {
    EN: "$29.99/mo base + $1.50 per vehicle over 20",
    ES: "$29.99/mes base + $1.50 por vehículo adicional después de 20",
  },
  fleet_enterprise_calculator: {
    EN: "Your fleet cost",
    ES: "Costo de tu flotilla",
  },
  fleet_enterprise_vehicles_label: {
    EN: "Number of vehicles",
    ES: "Número de vehículos",
  },
  fleet_enterprise_monthly_total: {
    EN: "Monthly total",
    ES: "Total mensual",
  },
  fleet_enterprise_annual_total: {
    EN: "Annual total (2 months free)",
    ES: "Total anual (2 meses gratis)",
  },
  paywall_feature_1: {
    EN: "Exact maintenance schedule for your vehicle",
    ES: "Programa de mantenimiento exacto para tu vehículo",
  },
  paywall_feature_2: {
    EN: "Odometer photo capture with OCR mileage reading",
    ES: "Captura fotográfica del odómetro con lectura OCR de millaje",
  },
  paywall_feature_3: {
    EN: "NHTSA recall alerts for your VIN",
    ES: "Alertas de retiro del mercado NHTSA para tu VIN",
  },
  paywall_feature_4: {
    EN: "Seasonal maintenance alerts by your location",
    ES: "Alertas de mantenimiento estacional por tu ubicación",
  },
  paywall_feature_5: {
    EN: "Verified service history — builds resale value",
    ES: "Historial de servicio verificado — aumenta el valor de reventa",
  },
  paywall_feature_6: {
    EN: "Fuel savings with AutoCoach Fuel Rewards",
    ES: "Ahorro en combustible con Recompensas de Combustible AutoCoach",
  },
  paywall_feature_7: {
    EN: "Parts buy buttons — exact fitment for your vehicle",
    ES: "Botones de compra de piezas — ajuste exacto para tu vehículo",
  },
  paywall_subscribe_monthly: {
    EN: "Start Monthly — $3.99",
    ES: "Comenzar Mensual — $3.99",
  },
  paywall_subscribe_annual: {
    EN: "Start Annual — $29.99",
    ES: "Comenzar Anual — $29.99",
  },
  paywall_restore: {
    EN: "Restore Purchase",
    ES: "Restaurar Compra",
  },
  paywall_terms: {
    EN: "Subscription renews automatically. Cancel anytime.",
    ES: "La suscripción se renueva automáticamente. Cancela en cualquier momento.",
  },
  paywall_no_free_tier: {
    EN: "AutoCoach is a premium app. No free tier.",
    ES: "AutoCoach es una aplicación premium. Sin nivel gratuito.",
  },

  // ─────────────────────────────────────────────
  // GARAGE SCREEN
  // ─────────────────────────────────────────────
  garage_title: {
    EN: "My Garage",
    ES: "Mi Garaje",
  },
  garage_vehicles_label: {
    EN: "My vehicles",
    ES: "Mis vehículos",
  },
  garage_add_vehicle: {
    EN: "Add vehicle",
    ES: "Agregar vehículo",
  },
  garage_quick_stats: {
    EN: "Quick stats",
    ES: "Estadísticas rápidas",
  },
  garage_stat_vehicles: {
    EN: "Vehicles",
    ES: "Vehículos",
  },
  garage_stat_due: {
    EN: "Due soon",
    ES: "Próximo",
  },
  garage_stat_saved: {
    EN: "Saved DIY",
    ES: "Ahorro DIY",
  },
  garage_no_vehicles_title: {
    EN: "No vehicles yet",
    ES: "Sin vehículos aún",
  },
  garage_no_vehicles_body: {
    EN: "Add your first vehicle to get your personalized maintenance schedule.",
    ES: "Agrega tu primer vehículo para obtener tu programa de mantenimiento personalizado.",
  },
  garage_services_due: {
    EN: "services due",
    ES: "servicios pendientes",
  },
  garage_all_current: {
    EN: "All current",
    ES: "Todo al día",
  },
  garage_overdue: {
    EN: "Overdue",
    ES: "Vencido",
  },
  garage_fleet_card_title: {
    EN: "AutoCoach Fleet Card",
    ES: "Tarjeta Flotilla AutoCoach",
  },
  garage_fleet_card_body: {
    EN: "Save an average of 42¢/gal on diesel. No fees. Per-driver spend controls.",
    ES: "Ahorra un promedio de 42¢/galón en diesel. Sin cargos. Controles de gasto por conductor.",
  },
  garage_fleet_card_cta: {
    EN: "Learn more",
    ES: "Saber más",
  },

  // ─────────────────────────────────────────────
  // ADD VEHICLE SCREEN
  // ─────────────────────────────────────────────
  add_vehicle_title: {
    EN: "Add Vehicle",
    ES: "Agregar Vehículo",
  },
  add_vehicle_vin_label: {
    EN: "Enter VIN (auto-fills year / make / model)",
    ES: "Ingresa VIN (completa año / marca / modelo automáticamente)",
  },
  add_vehicle_vin_placeholder: {
    EN: "e.g. 1FT8W3BT5KEC12944",
    ES: "p. ej. 1FT8W3BT5KEC12944",
  },
  add_vehicle_vin_verified: {
    EN: "VIN Verified",
    ES: "VIN Verificado",
  },
  add_vehicle_vin_invalid: {
    EN: "VIN not recognized — enter details manually",
    ES: "VIN no reconocido — ingresa los detalles manualmente",
  },
  add_vehicle_or: {
    EN: "— or select manually —",
    ES: "— o selecciona manualmente —",
  },
  add_vehicle_year: {
    EN: "Year",
    ES: "Año",
  },
  add_vehicle_make: {
    EN: "Make",
    ES: "Marca",
  },
  add_vehicle_model: {
    EN: "Model",
    ES: "Modelo",
  },
  add_vehicle_trim: {
    EN: "Trim",
    ES: "Versión",
  },
  add_vehicle_engine: {
    EN: "Engine",
    ES: "Motor",
  },
  add_vehicle_odometer_label: {
    EN: "Current odometer reading (miles)",
    ES: "Lectura actual del odómetro (millas)",
  },
  add_vehicle_odometer_placeholder: {
    EN: "e.g. 94,210",
    ES: "p. ej. 94,210",
  },
  add_vehicle_odometer_photo: {
    EN: "Or take odometer photo",
    ES: "O toma una foto del odómetro",
  },
  add_vehicle_nickname_label: {
    EN: "Nickname (optional)",
    ES: "Apodo (opcional)",
  },
  add_vehicle_nickname_placeholder: {
    EN: "e.g. Dad's Truck, Work Van",
    ES: "p. ej. Camioneta de papá, Furgoneta de trabajo",
  },
  add_vehicle_photo_label: {
    EN: "Add vehicle photo (optional)",
    ES: "Agregar foto del vehículo (opcional)",
  },
  add_vehicle_diesel_mode: {
    EN: "Diesel Mode — extended service items enabled",
    ES: "Modo Diesel — artículos de servicio extendido habilitados",
  },
  add_vehicle_cta: {
    EN: "Add Vehicle & Build Schedule",
    ES: "Agregar Vehículo y Crear Programa",
  },
  add_vehicle_building: {
    EN: "Building your maintenance schedule...",
    ES: "Creando tu programa de mantenimiento...",
  },
  add_vehicle_success: {
    EN: "Vehicle added! Your schedule is ready.",
    ES: "¡Vehículo agregado! Tu programa está listo.",
  },

  // ─────────────────────────────────────────────
  // MAINTENANCE SCHEDULE SCREEN
  // ─────────────────────────────────────────────
  schedule_title: {
    EN: "Maintenance Schedule",
    ES: "Programa de Mantenimiento",
  },
  schedule_filter_all: {
    EN: "All",
    ES: "Todo",
  },
  schedule_filter_due: {
    EN: "Due now",
    ES: "Vence ahora",
  },
  schedule_filter_upcoming: {
    EN: "Upcoming",
    ES: "Próximo",
  },
  schedule_filter_completed: {
    EN: "Completed",
    ES: "Completado",
  },
  schedule_section_overdue: {
    EN: "Overdue",
    ES: "Vencido",
  },
  schedule_section_due_soon: {
    EN: "Due soon",
    ES: "Próximo a vencer",
  },
  schedule_section_current: {
    EN: "Current",
    ES: "Al día",
  },
  schedule_section_completed: {
    EN: "Completed",
    ES: "Completado",
  },
  schedule_badge_overdue: {
    EN: "OD",
    ES: "VEN",
  },
  schedule_badge_soon: {
    EN: "Soon",
    ES: "Próximo",
  },
  schedule_badge_ok: {
    EN: "OK",
    ES: "OK",
  },
  schedule_miles_away: {
    EN: "mi away",
    ES: "mi restantes",
  },
  schedule_miles_overdue: {
    EN: "mi overdue",
    ES: "mi vencido",
  },
  schedule_due_at: {
    EN: "Due at",
    ES: "Vence a las",
  },
  schedule_done_at: {
    EN: "Done at",
    ES: "Hecho a las",
  },
  schedule_next_at: {
    EN: "Next at",
    ES: "Próximo a las",
  },
  schedule_diesel_mode_banner: {
    EN: "Diesel Mode active — showing diesel-specific services",
    ES: "Modo Diesel activo — mostrando servicios específicos para diesel",
  },

  // ─────────────────────────────────────────────
  // SERVICE NAMES (maintenance items)
  // ─────────────────────────────────────────────
  service_oil_filter: {
    EN: "Engine oil & filter",
    ES: "Aceite de motor y filtro",
  },
  service_oil_filter_diesel: {
    EN: "Engine oil & filter (diesel)",
    ES: "Aceite de motor y filtro (diesel)",
  },
  service_air_filter_engine: {
    EN: "Engine air filter",
    ES: "Filtro de aire del motor",
  },
  service_air_filter_cabin: {
    EN: "Cabin air filter",
    ES: "Filtro de aire de la cabina",
  },
  service_transmission_fluid: {
    EN: "Transmission fluid",
    ES: "Fluido de transmisión",
  },
  service_differential_front: {
    EN: "Front differential fluid",
    ES: "Fluido del diferencial delantero",
  },
  service_differential_rear: {
    EN: "Rear differential fluid",
    ES: "Fluido del diferencial trasero",
  },
  service_transfer_case: {
    EN: "Transfer case fluid",
    ES: "Fluido de la caja de transferencia",
  },
  service_coolant: {
    EN: "Coolant flush",
    ES: "Cambio de refrigerante",
  },
  service_brake_fluid: {
    EN: "Brake fluid flush",
    ES: "Cambio de fluido de frenos",
  },
  service_power_steering: {
    EN: "Power steering fluid",
    ES: "Fluido de dirección asistida",
  },
  service_spark_plugs: {
    EN: "Spark plugs",
    ES: "Bujías",
  },
  service_glow_plugs: {
    EN: "Glow plugs (diesel)",
    ES: "Bujías de precalentamiento (diesel)",
  },
  service_timing_belt: {
    EN: "Timing belt inspection",
    ES: "Inspección de la correa de distribución",
  },
  service_serpentine_belt: {
    EN: "Serpentine belt",
    ES: "Correa serpentina",
  },
  service_fuel_filter: {
    EN: "Fuel filter",
    ES: "Filtro de combustible",
  },
  service_fuel_filter_diesel: {
    EN: "Fuel filter (primary + secondary)",
    ES: "Filtro de combustible (primario + secundario)",
  },
  service_tire_rotation: {
    EN: "Tire rotation",
    ES: "Rotación de llantas",
  },
  service_brake_pads: {
    EN: "Brake pads & rotors",
    ES: "Pastillas y rotores de freno",
  },
  service_battery: {
    EN: "Battery inspection",
    ES: "Inspección de batería",
  },
  service_wiper_blades: {
    EN: "Wiper blades",
    ES: "Escobillas limpiaparabrisas",
  },
  service_pcv_valve: {
    EN: "PCV valve",
    ES: "Válvula PCV",
  },
  service_fuel_injector: {
    EN: "Fuel injector cleaning",
    ES: "Limpieza de inyectores de combustible",
  },
  service_wheel_alignment: {
    EN: "Wheel alignment",
    ES: "Alineación de ruedas",
  },
  service_cv_boots: {
    EN: "CV boots & axles",
    ES: "Fuelles y ejes homocinéticos",
  },
  service_def_fluid: {
    EN: "DEF fluid (diesel exhaust fluid)",
    ES: "Fluido DEF (fluido de escape diesel)",
  },
  service_egr_cleaning: {
    EN: "EGR system cleaning",
    ES: "Limpieza del sistema EGR",
  },
  service_dpf_cleaning: {
    EN: "DPF cleaning / inspection",
    ES: "Limpieza / inspección del filtro de partículas (DPF)",
  },
  service_turbo_inspection: {
    EN: "Turbo oil feed line inspection",
    ES: "Inspección de la línea de alimentación de aceite del turbo",
  },
  service_registration: {
    EN: "Vehicle registration renewal",
    ES: "Renovación del registro vehicular",
  },
  service_inspection: {
    EN: "State inspection",
    ES: "Inspección estatal",
  },

  // ─────────────────────────────────────────────
  // SERVICE DETAIL SCREEN
  // ─────────────────────────────────────────────
  service_detail_title: {
    EN: "Service Details",
    ES: "Detalles del Servicio",
  },
  service_detail_spec: {
    EN: "Spec",
    ES: "Especificación",
  },
  service_detail_capacity: {
    EN: "Capacity",
    ES: "Capacidad",
  },
  service_detail_interval: {
    EN: "Interval",
    ES: "Intervalo",
  },
  service_detail_last_done: {
    EN: "Last done",
    ES: "Último realizado",
  },
  service_detail_next_due: {
    EN: "Next due",
    ES: "Próximo vencimiento",
  },
  service_detail_status: {
    EN: "Status",
    ES: "Estado",
  },
  service_detail_buy_parts: {
    EN: "Buy the parts — do it yourself",
    ES: "Compra las piezas — hazlo tú mismo",
  },
  service_detail_log_complete: {
    EN: "Log this service as complete",
    ES: "Registrar este servicio como completado",
  },
  service_detail_find_shop: {
    EN: "Find a shop near me",
    ES: "Buscar un taller cerca de mí",
  },
  service_detail_overdue_by: {
    EN: "overdue by",
    ES: "vencido hace",
  },
  service_detail_due_in: {
    EN: "due in",
    ES: "vence en",
  },
  service_detail_miles: {
    EN: "miles",
    ES: "millas",
  },
  service_detail_every: {
    EN: "Every",
    ES: "Cada",
  },
  service_detail_manufacturer_note: {
    EN: "Per manufacturer recommendation",
    ES: "Según recomendación del fabricante",
  },
  service_detail_severe_duty: {
    EN: "Severe duty interval",
    ES: "Intervalo de servicio intensivo",
  },

  // ─────────────────────────────────────────────
  // LOG SERVICE SCREEN
  // ─────────────────────────────────────────────
  log_service_title: {
    EN: "Log Service",
    ES: "Registrar Servicio",
  },
  log_service_date: {
    EN: "Date",
    ES: "Fecha",
  },
  log_service_odometer: {
    EN: "Odometer at service",
    ES: "Odómetro al momento del servicio",
  },
  log_service_who: {
    EN: "Who did it?",
    ES: "¿Quién lo hizo?",
  },
  log_service_diy: {
    EN: "DIY",
    ES: "Yo mismo",
  },
  log_service_shop: {
    EN: "Shop",
    ES: "Taller",
  },
  log_service_shop_name: {
    EN: "Shop name",
    ES: "Nombre del taller",
  },
  log_service_shop_placeholder: {
    EN: "e.g. Ford Dealer, Jiffy Lube",
    ES: "p. ej. Concesionario Ford, Jiffy Lube",
  },
  log_service_cost: {
    EN: "Cost",
    ES: "Costo",
  },
  log_service_cost_placeholder: {
    EN: "e.g. $86.48",
    ES: "p. ej. $86.48",
  },
  log_service_notes: {
    EN: "Notes",
    ES: "Notas",
  },
  log_service_notes_placeholder: {
    EN: "e.g. Used Motorcraft 15W-40, changed at home",
    ES: "p. ej. Usé Motorcraft 15W-40, cambié en casa",
  },
  log_service_attach_receipt: {
    EN: "Attach receipt photo",
    ES: "Adjuntar foto del recibo",
  },
  log_service_save: {
    EN: "Save to history",
    ES: "Guardar en historial",
  },
  log_service_saved: {
    EN: "Service logged successfully",
    ES: "Servicio registrado exitosamente",
  },
  log_service_cancel: {
    EN: "Cancel",
    ES: "Cancelar",
  },

  // ─────────────────────────────────────────────
  // ODOMETER CAPTURE SCREEN
  // ─────────────────────────────────────────────
  odometer_title: {
    EN: "Odometer Photo",
    ES: "Foto del Odómetro",
  },
  odometer_instructions: {
    EN: "Center your odometer in the frame. Keep the image clear and well-lit.",
    ES: "Centra tu odómetro en el encuadre. Mantén la imagen clara y bien iluminada.",
  },
  odometer_capture: {
    EN: "Capture",
    ES: "Capturar",
  },
  odometer_retake: {
    EN: "Retake",
    ES: "Volver a tomar",
  },
  odometer_reading_detected: {
    EN: "Mileage detected",
    ES: "Millaje detectado",
  },
  odometer_confirm_reading: {
    EN: "Confirm this reading",
    ES: "Confirmar esta lectura",
  },
  odometer_reading_correct: {
    EN: "Yes, that's correct",
    ES: "Sí, eso es correcto",
  },
  odometer_reading_wrong: {
    EN: "No, let me type it",
    ES: "No, déjame escribirlo",
  },
  odometer_manual_entry: {
    EN: "Enter mileage manually",
    ES: "Ingresar millaje manualmente",
  },
  odometer_manual_placeholder: {
    EN: "Current mileage",
    ES: "Millaje actual",
  },
  odometer_low_confidence: {
    EN: "We couldn't read the odometer clearly. Please enter mileage manually.",
    ES: "No pudimos leer el odómetro claramente. Por favor ingresa el millaje manualmente.",
  },
  odometer_timestamp: {
    EN: "Photo timestamped",
    ES: "Foto con marca de tiempo",
  },
  odometer_gps_tagged: {
    EN: "Location tagged",
    ES: "Ubicación registrada",
  },
  odometer_saved: {
    EN: "Mileage recorded and schedule updated",
    ES: "Millaje registrado y programa actualizado",
  },
  odometer_tip: {
    EN: "Tip: take an odometer photo every fill-up to build your verified service history.",
    ES: "Consejo: toma una foto del odómetro en cada recarga para construir tu historial de servicio verificado.",
  },

  // ─────────────────────────────────────────────
  // FUEL LOG SCREEN
  // ─────────────────────────────────────────────
  fuel_title: {
    EN: "Fuel Log",
    ES: "Registro de Combustible",
  },
  fuel_log_stop: {
    EN: "Log fuel stop",
    ES: "Registrar parada de combustible",
  },
  fuel_date: {
    EN: "Date",
    ES: "Fecha",
  },
  fuel_station: {
    EN: "Station",
    ES: "Gasolinera",
  },
  fuel_station_placeholder: {
    EN: "e.g. Shell, Exxon, Flying J",
    ES: "p. ej. Shell, Exxon, Flying J",
  },
  fuel_gallons: {
    EN: "Gallons",
    ES: "Galones",
  },
  fuel_price_per_gallon: {
    EN: "Price per gallon",
    ES: "Precio por galón",
  },
  fuel_total_cost: {
    EN: "Total cost",
    ES: "Costo total",
  },
  fuel_type: {
    EN: "Fuel type",
    ES: "Tipo de combustible",
  },
  fuel_type_regular: {
    EN: "Regular",
    ES: "Regular",
  },
  fuel_type_midgrade: {
    EN: "Mid-grade",
    ES: "Grado medio",
  },
  fuel_type_premium: {
    EN: "Premium",
    ES: "Premium",
  },
  fuel_type_diesel: {
    EN: "Diesel",
    ES: "Diesel",
  },
  fuel_type_def: {
    EN: "DEF",
    ES: "DEF",
  },
  fuel_mpg_this_fill: {
    EN: "MPG this fill-up",
    ES: "MPG en esta recarga",
  },
  fuel_mpg_average: {
    EN: "Average MPG",
    ES: "MPG promedio",
  },
  fuel_mpg_drop_alert: {
    EN: "MPG dropped — may indicate a maintenance issue",
    ES: "MPG disminuyó — puede indicar un problema de mantenimiento",
  },
  fuel_state_avg: {
    EN: "State avg this week",
    ES: "Promedio estatal esta semana",
  },
  fuel_cashback_banner: {
    EN: "Save on this fill-up — earn up to 25¢/gal cashback at stations near you",
    ES: "Ahorra en esta recarga — gana hasta 25¢/gal de reembolso en gasolineras cercanas",
  },
  fuel_cashback_cta: {
    EN: "Activate fuel rewards",
    ES: "Activar recompensas de combustible",
  },
  fuel_save_log: {
    EN: "Save fuel log",
    ES: "Guardar registro de combustible",
  },
  fuel_history: {
    EN: "Fuel history",
    ES: "Historial de combustible",
  },
  fuel_total_spent: {
    EN: "Total spent",
    ES: "Total gastado",
  },
  fuel_total_gallons: {
    EN: "Total gallons",
    ES: "Total de galones",
  },
  fuel_fill_ups: {
    EN: "Fill-ups",
    ES: "Recargas",
  },

  // ─────────────────────────────────────────────
  // RECALL ALERTS
  // ─────────────────────────────────────────────
  recall_title: {
    EN: "Recall Alert",
    ES: "Alerta de Retiro del Mercado",
  },
  recall_open: {
    EN: "Open recall",
    ES: "Retiro del mercado abierto",
  },
  recall_no_recalls: {
    EN: "No open recalls for this vehicle",
    ES: "Sin retiros del mercado abiertos para este vehículo",
  },
  recall_check_date: {
    EN: "Last checked",
    ES: "Última verificación",
  },
  recall_schedule_dealer: {
    EN: "Schedule dealer repair",
    ES: "Programar reparación en concesionario",
  },
  recall_free_repair: {
    EN: "This recall repair is FREE at any authorized dealer",
    ES: "Esta reparación de retiro del mercado es GRATUITA en cualquier concesionario autorizado",
  },
  recall_reimbursement_title: {
    EN: "Paid for this repair already?",
    ES: "¿Ya pagaste por esta reparación?",
  },
  recall_reimbursement_body: {
    EN: "If you paid to fix this issue before the recall was announced, you may be eligible for reimbursement from the manufacturer. This window may be as short as 10 days after receiving this notice.",
    ES: "Si pagaste por reparar este problema antes de que se anunciara el retiro del mercado, puedes ser elegible para reembolso del fabricante. Esta ventana puede ser tan corta como 10 días después de recibir este aviso.",
  },
  recall_reimbursement_cta: {
    EN: "Learn how to claim reimbursement",
    ES: "Aprende cómo reclamar el reembolso",
  },
  recall_nhtsa_source: {
    EN: "Source: NHTSA — National Highway Traffic Safety Administration",
    ES: "Fuente: NHTSA — Administración Nacional de Seguridad del Tráfico en las Carreteras",
  },

  // ─────────────────────────────────────────────
  // SEASONAL ALERTS
  // ─────────────────────────────────────────────
  seasonal_winter_tires_title: {
    EN: "Time to swap to winter tires",
    ES: "Es hora de cambiar a llantas de invierno",
  },
  seasonal_winter_tires_body: {
    EN: "First freeze risk in your area arrives in about 3 weeks. Schedule your winter tire swap now — shops book up fast in October.",
    ES: "El primer riesgo de helada en tu área llega en aproximadamente 3 semanas. Programa el cambio de llantas de invierno ahora — los talleres se llenan rápido en octubre.",
  },
  seasonal_summer_tires_title: {
    EN: "Time to swap back to all-season tires",
    ES: "Es hora de volver a las llantas para todo clima",
  },
  seasonal_summer_tires_body: {
    EN: "Last frost risk in your area is typically around April 1st. Running winter tires in warm weather wears them significantly faster.",
    ES: "El último riesgo de helada en tu área es típicamente alrededor del 1 de abril. Usar llantas de invierno en clima cálido las desgasta significativamente más rápido.",
  },
  seasonal_winter_washer_title: {
    EN: "Switch to winter washer fluid",
    ES: "Cambiar a fluido limpiaparabrisas de invierno",
  },
  seasonal_winter_washer_body: {
    EN: "Temperatures will drop below freezing in your area within weeks. Regular washer fluid freezes in your reservoir and on your windshield. Switch to -40°F rated fluid now.",
    ES: "Las temperaturas caerán bajo el punto de congelación en tu área en pocas semanas. El fluido limpiaparabrisas regular se congela en tu depósito y en tu parabrisas. Cambia ahora a fluido certificado para -40°F.",
  },
  seasonal_bug_wash_title: {
    EN: "Switch to bug-rated washer fluid",
    ES: "Cambiar a fluido limpiaparabrisas para insectos",
  },
  seasonal_bug_wash_body: {
    EN: "Bug season is starting in your area. Bug-rated washer fluid clears your windshield more effectively during heavy insect season.",
    ES: "La temporada de insectos está comenzando en tu área. El fluido para insectos limpia tu parabrisas más eficazmente durante la temporada de insectos intensos.",
  },
  seasonal_battery_summer_title: {
    EN: "Battery check — summer heat warning",
    ES: "Revisión de batería — advertencia de calor de verano",
  },
  seasonal_battery_summer_body: {
    EN: "Heat kills batteries faster than cold. If your battery is 3+ years old, get a free load test before summer peaks. Most AutoZone and Advance Auto Parts stores test for free.",
    ES: "El calor daña las baterías más rápido que el frío. Si tu batería tiene 3 o más años, obtén una prueba de carga gratuita antes del pico del verano. La mayoría de las tiendas AutoZone y Advance Auto Parts prueban sin costo.",
  },
  seasonal_battery_winter_title: {
    EN: "Battery check — winter cold warning",
    ES: "Revisión de batería — advertencia de frío invernal",
  },
  seasonal_battery_winter_body: {
    EN: "Cold weather dramatically reduces battery cranking power. A battery at 50% capacity in summer may not start your engine at 10°F. Check yours before winter arrives.",
    ES: "El frío reduce drásticamente la potencia de arranque de la batería. Una batería al 50% de capacidad en verano puede no arrancar tu motor a -12°C. Revisa la tuya antes de que llegue el invierno.",
  },
  seasonal_coolant_title: {
    EN: "Check antifreeze before winter",
    ES: "Revisa el anticongelante antes del invierno",
  },
  seasonal_coolant_body: {
    EN: "Verify your coolant is rated for temperatures in your area. A coolant tester takes 30 seconds and costs under $5.",
    ES: "Verifica que tu refrigerante esté certificado para las temperaturas de tu área. Una prueba de refrigerante toma 30 segundos y cuesta menos de $5.",
  },
  seasonal_wiper_winter_title: {
    EN: "Swap to winter wiper blades",
    ES: "Cambiar a escobillas de invierno",
  },
  seasonal_wiper_winter_body: {
    EN: "Standard wiper blades clog with ice and snow. Winter wiper blades have a sealed frame that stays clear in freezing conditions.",
    ES: "Las escobillas estándar se tapan con hielo y nieve. Las escobillas de invierno tienen un marco sellado que permanece despejado en condiciones de congelación.",
  },
  seasonal_wiper_summer_title: {
    EN: "Swap back to standard wiper blades",
    ES: "Volver a las escobillas estándar",
  },
  seasonal_wiper_summer_body: {
    EN: "Winter blades are heavier and can reduce wiper performance in warm weather. Swap back to all-season blades this spring.",
    ES: "Las escobillas de invierno son más pesadas y pueden reducir el rendimiento en clima cálido. Cambia de vuelta a escobillas para todo clima esta primavera.",
  },
  seasonal_pre_winter_wash_title: {
    EN: "Pre-winter wash & wax",
    ES: "Lavado y encerado pre-invernal",
  },
  seasonal_pre_winter_wash_body: {
    EN: "A coat of wax before winter seals your paint from road salt corrosion. Now is the best time — before the first freeze.",
    ES: "Una capa de cera antes del invierno protege tu pintura de la corrosión por sal en las carreteras. Ahora es el mejor momento — antes de la primera helada.",
  },
  seasonal_spring_wash_title: {
    EN: "Spring wash — remove road salt",
    ES: "Lavado de primavera — eliminar sal vial",
  },
  seasonal_spring_wash_body: {
    EN: "Road salt from winter accelerates rust under your vehicle. A thorough spring wash, including the undercarriage, removes the buildup.",
    ES: "La sal de las carreteras de invierno acelera la oxidación bajo tu vehículo. Un lavado minucioso de primavera, incluyendo el chasis, elimina la acumulación.",
  },
  seasonal_dismiss: {
    EN: "Got it",
    ES: "Entendido",
  },
  seasonal_shop_now: {
    EN: "Shop now",
    ES: "Comprar ahora",
  },
  seasonal_schedule_now: {
    EN: "Schedule now",
    ES: "Programar ahora",
  },
  seasonal_remind_later: {
    EN: "Remind me in 1 week",
    ES: "Recuérdame en 1 semana",
  },

  // ─────────────────────────────────────────────
  // SHOP SCREEN
  // ─────────────────────────────────────────────
  shop_title: {
    EN: "Shop",
    ES: "Tienda",
  },
  shop_subtitle: {
    EN: "Parts for your vehicles — exact fitment",
    ES: "Piezas para tus vehículos — ajuste exacto",
  },
  shop_due_now: {
    EN: "Due now",
    ES: "Vence ahora",
  },
  shop_coming_up: {
    EN: "Coming up",
    ES: "Próximamente",
  },
  shop_all_parts: {
    EN: "All parts",
    ES: "Todas las piezas",
  },
  shop_detailing: {
    EN: "Detailing",
    ES: "Detallado",
  },
  shop_tires: {
    EN: "Tires",
    ES: "Llantas",
  },
  shop_buy: {
    EN: "Buy",
    ES: "Comprar",
  },
  shop_view: {
    EN: "View",
    ES: "Ver",
  },
  shop_exact_fit: {
    EN: "Exact fit for your",
    ES: "Ajuste exacto para tu",
  },
  shop_oem_part: {
    EN: "OEM fitment",
    ES: "Ajuste OEM",
  },
  shop_affiliate_disclosure: {
    EN: "AutoCoach earns a small commission on purchases. This never affects which parts we recommend — only parts that fit your vehicle are shown.",
    ES: "AutoCoach gana una pequeña comisión en las compras. Esto nunca afecta qué piezas recomendamos — solo se muestran piezas que se ajustan a tu vehículo.",
  },
  shop_car_wash_title: {
    EN: "Car wash deals near you",
    ES: "Ofertas de lavado de autos cerca de ti",
  },
  shop_car_wash_subtitle: {
    EN: "Local car wash deals for AutoCoach members",
    ES: "Ofertas de lavado de autos locales para miembros de AutoCoach",
  },
  shop_car_wash_cta: {
    EN: "Get deal",
    ES: "Obtener oferta",
  },
  shop_empty: {
    EN: "No parts to show right now. Check back when a service is due.",
    ES: "Sin piezas que mostrar ahora mismo. Vuelve cuando venza un servicio.",
  },

  // ─────────────────────────────────────────────
  // SERVICE HISTORY SCREEN
  // ─────────────────────────────────────────────
  history_title: {
    EN: "Service History",
    ES: "Historial de Servicio",
  },
  history_all_vehicles: {
    EN: "All vehicles",
    ES: "Todos los vehículos",
  },
  history_export: {
    EN: "Export full history (PDF)",
    ES: "Exportar historial completo (PDF)",
  },
  history_export_sharing: {
    EN: "Share history report",
    ES: "Compartir informe de historial",
  },
  history_no_entries: {
    EN: "No service history yet. Log your first service to start your record.",
    ES: "Sin historial de servicio aún. Registra tu primer servicio para comenzar tu registro.",
  },
  history_diy_label: {
    EN: "DIY",
    ES: "Yo mismo",
  },
  history_shop_label: {
    EN: "Shop",
    ES: "Taller",
  },
  history_cost_label: {
    EN: "Cost",
    ES: "Costo",
  },
  history_mileage_label: {
    EN: "Mileage",
    ES: "Millaje",
  },
  history_notes_label: {
    EN: "Notes",
    ES: "Notas",
  },
  history_receipt_label: {
    EN: "Receipt attached",
    ES: "Recibo adjunto",
  },
  history_pdf_title: {
    EN: "Verified Service History",
    ES: "Historial de Servicio Verificado",
  },
  history_pdf_generated: {
    EN: "Generated by AutoCoach",
    ES: "Generado por AutoCoach",
  },
  history_pdf_disclaimer: {
    EN: "This report reflects service logs entered by the vehicle owner in the AutoCoach app. Odometer readings marked as photo-verified include a timestamped photo on file.",
    ES: "Este informe refleja los registros de servicio ingresados por el propietario del vehículo en la aplicación AutoCoach. Las lecturas del odómetro marcadas como verificadas por foto incluyen una foto con marca de tiempo en el archivo.",
  },
  history_odometer_verified: {
    EN: "Photo-verified",
    ES: "Verificado por foto",
  },

  // ─────────────────────────────────────────────
  // FUEL CARD SCREENS
  // ─────────────────────────────────────────────
  fuelcard_personal_title: {
    EN: "AutoCoach Fuel Rewards",
    ES: "Recompensas de Combustible AutoCoach",
  },
  fuelcard_personal_subtitle: {
    EN: "Earn up to 25¢ per gallon cashback at 45,000+ stations",
    ES: "Gana hasta 25¢ por galón de reembolso en más de 45,000 gasolineras",
  },
  fuelcard_personal_body: {
    EN: "Works at Shell, BP, Exxon, Marathon, and thousands of independent stations. Link any debit or credit card — no new card needed.",
    ES: "Funciona en Shell, BP, Exxon, Marathon y miles de gasolineras independientes. Vincula cualquier tarjeta de débito o crédito — no necesitas una tarjeta nueva.",
  },
  fuelcard_personal_cta: {
    EN: "Activate fuel rewards",
    ES: "Activar recompensas de combustible",
  },
  fuelcard_fleet_title: {
    EN: "AutoCoach Fleet Card",
    ES: "Tarjeta Flotilla AutoCoach",
  },
  fuelcard_fleet_subtitle: {
    EN: "Save an average of 42¢/gal on diesel. Accepted everywhere Mastercard is.",
    ES: "Ahorra un promedio de 42¢/galón en diesel. Aceptada en todos los lugares donde se acepta Mastercard.",
  },
  fuelcard_fleet_feature_1: {
    EN: "Per-driver spend controls",
    ES: "Controles de gasto por conductor",
  },
  fuelcard_fleet_feature_2: {
    EN: "GPS transaction verification",
    ES: "Verificación de transacciones por GPS",
  },
  fuelcard_fleet_feature_3: {
    EN: "Level 3 fuel data — auto-logs to AutoCoach",
    ES: "Datos de combustible nivel 3 — se registran automáticamente en AutoCoach",
  },
  fuelcard_fleet_feature_4: {
    EN: "Up to $2.00/gal savings at partner truck stops",
    ES: "Hasta $2.00/galón de ahorro en paradas de camiones asociadas",
  },
  fuelcard_fleet_feature_5: {
    EN: "Zero fees",
    ES: "Sin cargos",
  },
  fuelcard_fleet_cta: {
    EN: "Apply for fleet card",
    ES: "Solicitar tarjeta flotilla",
  },
  fuelcard_fleet_10plus: {
    EN: "10+ vehicles? Contact us for WEX enterprise pricing.",
    ES: "¿10 o más vehículos? Contáctanos para precios empresariales WEX.",
  },
  fuelcard_monthly_savings: {
    EN: "Your fleet's estimated monthly fuel savings",
    ES: "Ahorro mensual estimado de combustible de tu flotilla",
  },
  fuelcard_savings_disclaimer: {
    EN: "Estimated based on average diesel prices and fleet card discounts. Actual savings vary.",
    ES: "Estimado basado en precios promedio de diesel y descuentos de tarjeta flotilla. El ahorro real varía.",
  },

  // ─────────────────────────────────────────────
  // FLEET DASHBOARD
  // ─────────────────────────────────────────────
  fleet_title: {
    EN: "Fleet Dashboard",
    ES: "Panel de Flotilla",
  },
  fleet_vehicles: {
    EN: "Fleet vehicles",
    ES: "Vehículos de la flotilla",
  },
  fleet_add_vehicle: {
    EN: "Add fleet vehicle",
    ES: "Agregar vehículo a la flotilla",
  },
  fleet_total_due: {
    EN: "Services due across fleet",
    ES: "Servicios pendientes en la flotilla",
  },
  fleet_assign_driver: {
    EN: "Assign driver",
    ES: "Asignar conductor",
  },
  fleet_driver_name: {
    EN: "Driver name",
    ES: "Nombre del conductor",
  },
  fleet_notify_driver: {
    EN: "Notify driver when service is due",
    ES: "Notificar al conductor cuando venza el servicio",
  },
  fleet_total_cost_mtd: {
    EN: "Maintenance cost MTD",
    ES: "Costo de mantenimiento del mes",
  },
  fleet_export_report: {
    EN: "Export fleet report",
    ES: "Exportar informe de flotilla",
  },
  fleet_pricing_label: {
    EN: "Fleet billing",
    ES: "Facturación de flotilla",
  },
  fleet_pricing_detail: {
    EN: "Solo $3.99 · Duo $6.99 · Family $7.99 · Family Plus $9.99 · Fleet Small $13.99 · Fleet Medium $19.99 · Fleet Large $29.99",
    ES: "Individual $3.99 · Dúo $6.99 · Familiar $7.99 · Familiar Plus $9.99 · Flotilla Pequeña $13.99 · Flotilla Mediana $19.99 · Flotilla Grande $29.99",
  },
  fleet_upgrade_prompt: {
    EN: "Need more vehicles? Upgrade your plan in Settings.",
    ES: "¿Necesitas más vehículos? Actualiza tu plan en Configuración.",
  },
  fleet_at_limit: {
    EN: "You've reached your vehicle limit for this plan.",
    ES: "Has alcanzado el límite de vehículos para este plan.",
  },
  fleet_at_limit_cta: {
    EN: "Upgrade to add more vehicles",
    ES: "Actualiza para agregar más vehículos",
  },

  // ─────────────────────────────────────────────
  // PUSH NOTIFICATIONS
  // ─────────────────────────────────────────────
  push_oil_due_title: {
    EN: "Oil change due",
    ES: "Cambio de aceite pendiente",
  },
  push_oil_due_body: {
    EN: "Your {vehicle} is due for an oil change in {miles} miles or {days} days.",
    ES: "Tu {vehicle} necesita un cambio de aceite en {miles} millas o {days} días.",
  },
  push_oil_overdue_title: {
    EN: "Oil change overdue",
    ES: "Cambio de aceite vencido",
  },
  push_oil_overdue_body: {
    EN: "Your {vehicle} oil change is overdue by {miles} miles. Schedule service soon.",
    ES: "El cambio de aceite de tu {vehicle} está vencido por {miles} millas. Programa el servicio pronto.",
  },
  push_recall_title: {
    EN: "Recall alert — {vehicle}",
    ES: "Alerta de retiro del mercado — {vehicle}",
  },
  push_recall_body: {
    EN: "NHTSA has an open recall for your {vehicle}. Tap to view details and schedule a free dealer repair.",
    ES: "NHTSA tiene un retiro del mercado abierto para tu {vehicle}. Toca para ver detalles y programar una reparación gratuita en el concesionario.",
  },
  push_fuel_savings_title: {
    EN: "Monthly fuel savings summary",
    ES: "Resumen mensual de ahorro en combustible",
  },
  push_fuel_savings_body: {
    EN: "Your AutoCoach Fuel Card saved you an estimated ${amount} this month across {count} fill-ups.",
    ES: "Tu Tarjeta de Combustible AutoCoach te ahorró un estimado de ${amount} este mes en {count} recargas.",
  },
  push_service_logged_title: {
    EN: "Service logged",
    ES: "Servicio registrado",
  },
  push_service_logged_body: {
    EN: "{service} logged for {vehicle}. Next due at {mileage} miles.",
    ES: "{service} registrado para {vehicle}. Próximo vencimiento a las {mileage} millas.",
  },
  push_seasonal_title: {
    EN: "Seasonal maintenance alert",
    ES: "Alerta de mantenimiento estacional",
  },
  push_mpg_drop_title: {
    EN: "MPG drop detected — {vehicle}",
    ES: "Caída de MPG detectada — {vehicle}",
  },
  push_mpg_drop_body: {
    EN: "Your {vehicle} MPG dropped {pct}% vs. your last 5 fill-ups. This may indicate a maintenance issue.",
    ES: "El MPG de tu {vehicle} cayó un {pct}% en comparación con tus últimas 5 recargas. Esto puede indicar un problema de mantenimiento.",
  },

  // ─────────────────────────────────────────────
  // SETTINGS SCREEN
  // ─────────────────────────────────────────────
  settings_title: {
    EN: "Settings",
    ES: "Configuración",
  },
  settings_account: {
    EN: "Account",
    ES: "Cuenta",
  },
  settings_subscription: {
    EN: "Subscription",
    ES: "Suscripción",
  },
  settings_notifications: {
    EN: "Notifications",
    ES: "Notificaciones",
  },
  settings_language: {
    EN: "Language",
    ES: "Idioma",
  },
  settings_units: {
    EN: "Units",
    ES: "Unidades",
  },
  settings_units_miles: {
    EN: "Miles",
    ES: "Millas",
  },
  settings_units_km: {
    EN: "Kilometers",
    ES: "Kilómetros",
  },
  settings_location: {
    EN: "Location (for seasonal alerts)",
    ES: "Ubicación (para alertas estacionales)",
  },
  settings_location_enabled: {
    EN: "Location access enabled",
    ES: "Acceso a ubicación habilitado",
  },
  settings_location_disabled: {
    EN: "Enable location for seasonal alerts",
    ES: "Habilitar ubicación para alertas estacionales",
  },
  settings_privacy: {
    EN: "Privacy Policy",
    ES: "Política de Privacidad",
  },
  settings_terms: {
    EN: "Terms of Service",
    ES: "Términos de Servicio",
  },
  settings_support: {
    EN: "Contact Support",
    ES: "Contactar Soporte",
  },
  settings_restore: {
    EN: "Restore Purchase",
    ES: "Restaurar Compra",
  },
  settings_sign_out: {
    EN: "Sign out",
    ES: "Cerrar sesión",
  },
  settings_version: {
    EN: "Version",
    ES: "Versión",
  },
  settings_mileage_interval: {
    EN: "Remind me when service is due within",
    ES: "Recordarme cuando el servicio venza dentro de",
  },
  settings_mileage_500: {
    EN: "500 miles",
    ES: "500 millas",
  },
  settings_mileage_1000: {
    EN: "1,000 miles",
    ES: "1,000 millas",
  },
  settings_mileage_2000: {
    EN: "2,000 miles",
    ES: "2,000 millas",
  },

  // ─────────────────────────────────────────────
  // GENERAL UI
  // ─────────────────────────────────────────────
  btn_save: {
    EN: "Save",
    ES: "Guardar",
  },
  btn_cancel: {
    EN: "Cancel",
    ES: "Cancelar",
  },
  btn_confirm: {
    EN: "Confirm",
    ES: "Confirmar",
  },
  btn_done: {
    EN: "Done",
    ES: "Listo",
  },
  btn_edit: {
    EN: "Edit",
    ES: "Editar",
  },
  btn_delete: {
    EN: "Delete",
    ES: "Eliminar",
  },
  btn_back: {
    EN: "Back",
    ES: "Atrás",
  },
  btn_close: {
    EN: "Close",
    ES: "Cerrar",
  },
  btn_continue: {
    EN: "Continue",
    ES: "Continuar",
  },
  btn_apply: {
    EN: "Apply",
    ES: "Aplicar",
  },
  loading: {
    EN: "Loading...",
    ES: "Cargando...",
  },
  error_generic: {
    EN: "Something went wrong. Please try again.",
    ES: "Algo salió mal. Por favor intenta de nuevo.",
  },
  error_network: {
    EN: "No internet connection. Some features may be unavailable.",
    ES: "Sin conexión a internet. Algunas funciones pueden no estar disponibles.",
  },
  error_camera: {
    EN: "Camera access required for odometer photo. Please enable in Settings.",
    ES: "Se requiere acceso a la cámara para la foto del odómetro. Por favor habilita en Configuración.",
  },
  error_location: {
    EN: "Location access required for seasonal alerts and car wash deals.",
    ES: "Se requiere acceso a la ubicación para alertas estacionales y ofertas de lavado de autos.",
  },
  empty_state_title: {
    EN: "Nothing here yet",
    ES: "Nada aquí todavía",
  },
  miles_abbrev: {
    EN: "mi",
    ES: "mi",
  },
  gallons_abbrev: {
    EN: "gal",
    ES: "gal",
  },
  verified: {
    EN: "Verified",
    ES: "Verificado",
  },
  optional: {
    EN: "optional",
    ES: "opcional",
  },
  yes: {
    EN: "Yes",
    ES: "Sí",
  },
  no: {
    EN: "No",
    ES: "No",
  },
};

// ============================================================
// T() HELPER — place this in App.js alongside lang state
// Usage: T('key') returns the correct language string
// ============================================================

// const [lang, setLang] = useState('EN');
// const T = (key) => TRANSLATIONS[key]?.[lang] ?? key;

// ============================================================
// LANG TOGGLE BUTTON — paste into header JSX
// ============================================================

// <TouchableOpacity onPress={() => setLang(lang === 'EN' ? 'ES' : 'EN')}>
//   <Text>EN | ES</Text>
// </TouchableOpacity>

// ============================================================
// COMPONENTS OUTSIDE APP.JS
// Must receive lang as explicit prop — never import lang state
// Example:
//   <BuyButtons lang={lang} />
//   <ShopScreen lang={lang} />
//   <FleetDashboard lang={lang} />
// ============================================================
