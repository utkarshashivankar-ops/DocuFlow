import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Chip from '../components/Chip';
import { colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { formatDateTime } from '../utils/date';
import { getErrorMessage } from '../utils/errors';

const WARNING_OPTIONS = [15, 30, 60, 90];
const REMINDER_PRESETS = [
  { label: '90 · 30 · 7 · 1', days: [90, 30, 7, 1] },
  { label: '30 · 7 · 1', days: [30, 7, 1] },
  { label: '60 · 14 · 3', days: [60, 14, 3] },
];
const sameDays = (a = [], b = []) => a.length === b.length && a.every((n, i) => n === b[i]);

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const prefs = user?.preferences || {};

  const save = async (body, okText = 'Saved.') => {
    setMessage(null);
    try {
      const updated = await authService.updateProfile(body);
      setUser(updated);
      setMessage({ ok: true, text: okText });
      return true;
    } catch (err) {
      setMessage({ ok: false, text: getErrorMessage(err) });
      return false;
    }
  };

  const saveName = async () => {
    if (name.trim().length < 2) return setMessage({ ok: false, text: 'Please enter your full name.' });
    setSaving(true);
    await save({ name: name.trim() }, 'Profile updated.');
    setSaving(false);
    return undefined;
  };

  const confirmLogout = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to see your documents.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  const Toggle = ({ label, field, hint }) => (
    <View style={styles.toggle}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Switch
        value={prefs[field] !== false}
        onValueChange={(v) => save({ preferences: { [field]: v } }, 'Preference saved.')}
        trackColor={{ true: colors.primary }}
      />
    </View>
  );

  return (
    <Screen title="Profile">
      <Card style={{ alignItems: 'center' }}>
        <View style={styles.avatar}><Ionicons name="person" size={34} color={colors.primary} /></View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.meta}>Member since {formatDateTime(user?.createdAt)} · {user?.role === 'admin' ? 'Administrator' : 'Personal account'}</Text>
      </Card>

      {message ? <Text style={[styles.msg, { color: message.ok ? colors.success : colors.danger }]}>{message.text}</Text> : null}

      <Text style={styles.section}>Account</Text>
      <Card>
        <Input label="Full name" value={name} onChangeText={setName} autoCapitalize="words" style={{ marginBottom: 12 }} />
        <Button title="Save name" onPress={saveName} loading={saving} disabled={name.trim() === user?.name} variant="secondary" />
      </Card>

      <Text style={styles.section}>Expiry warning</Text>
      <Card>
        <Text style={styles.hint}>Documents are marked “Expiring Soon” when they expire within:</Text>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          {WARNING_OPTIONS.map((d) => (
            <Chip key={d} label={`${d} days`} active={prefs.expiryWarningDays === d} onPress={() => save({ preferences: { expiryWarningDays: d } }, 'Warning period updated.')} />
          ))}
        </View>
      </Card>

      <Text style={styles.section}>Notification preferences</Text>
      <Card>
        <Toggle label="In-app notifications" field="inAppNotifications" />
        <Toggle label="Email alerts" field="emailNotifications" />
        <Toggle label="Push notifications" field="pushNotifications" hint="Needs a phone build with push enabled; in-app and email alerts work everywhere." />
      </Card>

      <Text style={styles.section}>Remind me (days before expiry)</Text>
      <Card>
        <Text style={styles.hint}>You get one reminder at each of these points, then one when a document has expired.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
          {REMINDER_PRESETS.map((p) => (
            <Chip key={p.label} label={p.label} active={sameDays(prefs.reminderDays, p.days)} onPress={() => save({ preferences: { reminderDays: p.days } }, 'Reminder schedule updated.')} />
          ))}
        </View>
      </Card>

      <Button title="Sign out" icon="log-out-outline" variant="danger" onPress={confirmLogout} style={{ marginTop: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 10 },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  meta: { fontSize: 12, color: colors.muted, marginTop: 6 },
  section: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 20, marginBottom: 8 },
  msg: { marginTop: 12, fontSize: 13, textAlign: 'center' },
  toggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
