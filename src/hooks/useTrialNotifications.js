import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── TRIAL NUDGE SEQUENCE ────────────────────────────────────────────────────
// Local notifications scheduled relative to the trial start date, only while
// the user is in an active free trial.
//
// Local notifications can't check anything at the moment they fire, so the
// "don't nudge people who've stopped opening the app" rule is enforced at
// schedule time instead: every time the app opens (or returns to the
// foreground) the whole sequence is cancelled and rebuilt, and only steps
// that fall within INACTIVE_CUTOFF_MS of *now* are scheduled. A user who
// keeps opening the app keeps rolling the window forward; a user who leaves
// for 4+ days simply has nothing left scheduled.

const HOUR = 3600000;
const DAY  = 24 * HOUR;

export const TRIAL_START_KEY = 'trial_start_date';
const INACTIVE_CUTOFF_MS     = 4 * DAY;
const MINUTE                 = 60000;
// Hidden test mode: holds the fake trial start (ms) while it's on.
export const TEST_MODE_KEY   = 'trial_notif_test_start';
const NOTIF_KIND             = 'trial_nudge';
// Matches the channel the maintenance reminders use (app.json defaultChannel).
const CHANNEL_ID             = 'maintenance-reminders';

// `target` is passed to onOpen when the user taps the notification.
const SEQUENCE = [
  {
    id: 'first_vehicle',
    offsetMs: 6 * HOUR,
    target: 'addVehicle',
    en: 'Add your first vehicle — AutoCoach will show you everything that\'s due right now.',
    es: 'Agrega tu primer vehículo — AutoCoach te mostrará todo lo que está pendiente ahora mismo.',
  },
  {
    id: 'schedule',
    offsetMs: 2 * DAY,
    target: 'schedule',
    en: 'Tap Schedule to see your full maintenance timeline — oil, tires, brakes, coolant, all tracked.',
    es: 'Toca Programa para ver tu calendario de mantenimiento completo — aceite, llantas, frenos, refrigerante, todo registrado.',
  },
  {
    id: 'recalls',
    offsetMs: 4 * DAY,
    target: 'garage',
    en: 'Check your vehicle for open recalls — tap Recalls in your garage.',
    es: 'Revisa si tu vehículo tiene retiros del mercado abiertos — toca Retiros en tu garaje.',
  },
  {
    id: 'trial_ending',
    offsetMs: 6 * DAY,
    target: 'paywall',
    en: 'Your free trial ends tomorrow. Your maintenance history, fuel log, and service records stay with you when you subscribe.',
    es: 'Tu prueba gratuita termina mañana. Tu historial de mantenimiento, registro de combustible y registros de servicio se quedan contigo cuando te suscribes.',
  },
];

export async function cancelTrialNotifications() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter(n => n?.content?.data?.kind === NOTIF_KIND)
        .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}))
    );
  } catch {}
}

// Silent check only — matches the rest of AutoCoach, where the OS prompt is
// only ever shown from the Settings toggle, never automatically.
async function hasPermission() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// Cancels every scheduled notification except the trial nudges, so the
// maintenance rescheduler can rebuild its own set without wiping these.
export async function cancelNonTrialNotifications() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter(n => n?.content?.data?.kind !== NOTIF_KIND)
        .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}))
    );
  } catch {}
}

async function resolveTrialStart(rcTrialStart) {
  const storedRaw = await AsyncStorage.getItem(TRIAL_START_KEY);
  const stored = storedRaw ? parseInt(storedRaw, 10) : null;
  // RevenueCat's purchase date for the trial entitlement is authoritative
  // (survives reinstalls); fall back to what we stored, then to now.
  const start = rcTrialStart || stored || Date.now();
  if (start !== stored) await AsyncStorage.setItem(TRIAL_START_KEY, String(start));
  return start;
}

// Test mode compresses the sequence: the 6-hour step fires after 1 minute
// and each "day" lasts 2 minutes (day 3 -> 6 min, day 6 -> 12 min).
function testOffset(offsetMs) {
  return offsetMs < DAY ? MINUTE : (offsetMs / DAY) * 2 * MINUTE;
}

async function getTestStart() {
  const raw = await AsyncStorage.getItem(TEST_MODE_KEY);
  return raw ? parseInt(raw, 10) : null;
}

async function scheduleSteps({ start, now, lang, skipSteps = [], test }) {
  const es = lang === 'ES';
  for (const step of SEQUENCE) {
    if (!test && skipSteps.includes(step.id)) continue;
    const fireAt = start + (test ? testOffset(step.offsetMs) : step.offsetMs);
    if (fireAt <= now) continue;                                  // already past — never send late
    if (!test && fireAt - now > INACTIVE_CUTOFF_MS) continue;     // scheduled on a later app open, if they come back
    await Notifications.scheduleNotificationAsync({
      content: {
        title: test ? 'AutoCoach (test)' : 'AutoCoach',
        body: es ? step.es : step.en,
        data: { kind: NOTIF_KIND, step: step.id, target: step.target, fireAt, test: !!test },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fireAt), channelId: CHANNEL_ID },
    });
  }
}

export function useTrialNotifications({
  isTrial,
  isPro,
  customerInfoLoaded,
  trialStartDate,
  lang,
  enabled,          // the user's Notifications toggle in Settings
  skipSteps = [],   // step ids already accomplished (e.g. first test logged)
  onOpen,
}) {
  const latest = useRef({});
  latest.current = { isTrial, isPro, customerInfoLoaded, trialStartDate, lang, enabled, skipSteps, onOpen };
  const queue = useRef(Promise.resolve());
  const [debug, setDebug] = useState(null);

  const sync = () => {
    // Serialize runs so a foreground event and a state change can't
    // interleave their cancel/schedule steps and double-schedule.
    queue.current = queue.current.then(runSync).catch(e => console.warn('Trial notification sync failed', e));
    return queue.current;
  };

  async function runSync() {
    const { isTrial, isPro, customerInfoLoaded, trialStartDate, lang, enabled, skipSteps } = latest.current;
    const now = Date.now();

    // Hidden test mode: act as if a trial started at the stored time,
    // regardless of RevenueCat, with the sequence compressed into minutes.
    const testStart = await getTestStart();
    if (testStart) {
      await cancelTrialNotifications();
      if (enabled && (await hasPermission())) await scheduleSteps({ start: testStart, now, lang, test: true });
      await refreshDebug();
      return;
    }

    // Wait for real RevenueCat data — the defaults before the first fetch
    // would otherwise look like "not in trial" and wipe the sequence.
    if (!customerInfoLoaded) return;

    // Converted to paid (isPro && !isTrial), or trial lapsed: nothing to send.
    if (!isTrial || !isPro) {
      await cancelTrialNotifications();
      await refreshDebug();
      return;
    }

    const start = await resolveTrialStart(trialStartDate);
    await cancelTrialNotifications();
    if (enabled && (await hasPermission())) await scheduleSteps({ start, now, lang, skipSteps, test: false });
    await refreshDebug();
  }

  // Snapshot of what the app sees, for the hidden test panel in Settings.
  async function refreshDebug() {
    try {
      const { isTrial, isPro, customerInfoLoaded } = latest.current;
      const [perm, scheduled, storedStart, testStart] = await Promise.all([
        Notifications.getPermissionsAsync(),
        Notifications.getAllScheduledNotificationsAsync(),
        AsyncStorage.getItem(TRIAL_START_KEY),
        getTestStart(),
      ]);
      const next = {
        testMode: !!testStart,
        permission: perm.status,
        customerInfoLoaded,
        isTrial,
        isPro,
      enabled: latest.current.enabled,
        trialStart: testStart || (storedStart ? parseInt(storedStart, 10) : null),
        scheduled: scheduled
          .map(n => n?.content?.data)
          .filter(d => d?.kind === NOTIF_KIND)
          .map(d => ({ step: d.step, at: d.fireAt }))
          .sort((a, b) => a.at - b.at),
      };
      // Only update when something changed — a state change re-renders App,
      // which remounts the nested screens (and resets their scroll position).
      setDebug(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    } catch {}
  }

  useEffect(() => {
    sync();
  }, [customerInfoLoaded, isTrial, isPro, trialStartDate, lang, enabled, skipSteps.join(',')]);

  // Every return to the foreground counts as an app open.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, []);

  // Route taps on trial nudges to the relevant screen.
  useEffect(() => {
    const handle = response => {
      const data = response?.notification?.request?.content?.data;
      if (data?.kind === NOTIF_KIND) latest.current.onOpen?.(data.target);
    };
    // Cold start from a tap: handle once, then clear so later launches
    // don't re-route on the same stale response.
    const coldStart = Notifications.getLastNotificationResponse();
    if (coldStart) {
      handle(coldStart);
      Notifications.clearLastNotificationResponse();
    }
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, []);

  const startTest = async () => {
    // A deliberate tap in Settings, so asking for permission here is fine.
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') await Notifications.requestPermissionsAsync();
    await AsyncStorage.setItem(TEST_MODE_KEY, String(Date.now()));
    return sync();
  };

  const stopTest = async () => {
    await AsyncStorage.removeItem(TEST_MODE_KEY);
    await cancelTrialNotifications();   // the real sequence (if any) is rebuilt by sync
    return sync();
  };

  return { debug, startTest, stopTest, refreshDebug: sync };
}
