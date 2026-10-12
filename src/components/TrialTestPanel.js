import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// Hidden tester panel for the trial notification sequence (unlocked by
// tapping the version number 7 times in Settings). English-only on purpose:
// it's a testing tool, not something customers see.
function fmtTime(ms) {
  return ms ? new Date(ms).toLocaleTimeString() : '-';
}

function fmtIn(ms, now) {
  const diff = Math.round((ms - now) / 1000);
  if (diff <= 0) return 'due now';
  const m = Math.floor(diff / 60);
  const sec = String(diff % 60).padStart(2, '0');
  return `in ${m}:${sec}`;
}

export default function TrialTestPanel({ debug, onStart, onStop, onRefresh, colors }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const c = colors;
  const row = (label, value) => (
    <Text style={{ color: c.text, fontSize: 13, marginBottom: 4 }}>
      <Text style={{ color: c.muted }}>{label}: </Text>{String(value)}
    </Text>
  );
  const button = (label, onPress) => (
    <TouchableOpacity onPress={onPress}
      style={{ borderWidth: 1, borderColor: c.accent, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginTop: 8 }}>
      <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, marginTop: 12, backgroundColor: c.bg }}>
      <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 8 }}>Trial notification test</Text>
      {!debug ? (
        <Text style={{ color: c.muted, fontSize: 13 }}>Loading… tap Refresh.</Text>
      ) : (
        <>
          {row('Test mode', debug.testMode ? 'ON (1 min, then 2 min per day)' : 'off')}
          {row('Notification permission', debug.permission)}
          {'enabled' in debug && row('Notifications toggle', debug.enabled ? 'on' : 'OFF — turn it on above')}
          {row('RevenueCat loaded', debug.customerInfoLoaded ? 'yes' : 'no')}
          {row('In free trial (RevenueCat)', debug.isTrial ? 'yes' : 'no')}
          {row('Subscribed (RevenueCat)', debug.isPro ? 'yes' : 'no')}
          {row(debug.testMode ? 'Test start' : 'Trial start', fmtTime(debug.trialStart))}
          <Text style={{ color: c.muted, fontSize: 13, marginTop: 6, marginBottom: 4 }}>
            Scheduled trial notifications ({debug.scheduled.length}):
          </Text>
          {debug.scheduled.length === 0 ? (
            <Text style={{ color: c.text, fontSize: 13 }}>none</Text>
          ) : debug.scheduled.map(n => (
            <Text key={n.step} style={{ color: c.text, fontSize: 13, marginBottom: 2 }}>
              • {n.step} — {fmtTime(n.at)} ({fmtIn(n.at, now)})
            </Text>
          ))}
        </>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {button(debug?.testMode ? 'Restart test' : 'Start test', onStart)}
        {debug?.testMode && button('Stop test', onStop)}
        {button('Refresh', onRefresh)}
      </View>
      <Text style={{ color: c.muted, fontSize: 11, marginTop: 8 }}>
        Switch the app language to check the Spanish text, then tap Restart test.
        Notifications show even while the app is open.
      </Text>
    </View>
  );
}
