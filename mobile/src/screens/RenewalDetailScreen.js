import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Chip from '../components/Chip';
import Input from '../components/Input';
import StatusBadge from '../components/StatusBadge';
import { ErrorState, LoadingView } from '../components/States';
import { RENEWAL_STATUSES } from '../constants/renewal';
import { colors } from '../constants/theme';
import { renewalService } from '../services/renewalService';
import { daysText, formatDate } from '../utils/date';
import { getErrorMessage } from '../utils/errors';

export default function RenewalDetailScreen({ route, navigation }) {
  const { documentId } = route.params;
  const [r, setR] = useState(null);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const latest = useRef(null);

  const apply = (renewal) => { latest.current = renewal; setR(renewal); setNotes(renewal.notes); setUrl(renewal.officialUrl); };

  const load = useCallback(async () => {
    try { apply(await renewalService.forDocument(documentId)); setError(null); }
    catch (err) { setError(getErrorMessage(err)); }
  }, [documentId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (r) navigation.setOptions({ title: 'Renewal guide' }); }, [r, navigation]);

  const save = async (body, { quiet = false } = {}) => {
    const before = latest.current;
    try {
      const next = await renewalService.update(before.id, body);
      latest.current = next; setR(next);
      return next;
    } catch (err) {
      if (!quiet) Alert.alert('Could not save', getErrorMessage(err));
      setR(before); // roll the optimistic change back
      return null;
    }
  };

  const toggle = (index) => {
    const checklist = latest.current.checklist.map((c, i) => (i === index ? { ...c, done: !c.done } : c));
    setR({ ...latest.current, checklist }); // optimistic
    save({ checklist: checklist.map(({ label, done }) => ({ label, done })) });
  };

  const setStatus = (status) => {
    if (status === r.status) return;
    setR({ ...r, status });
    save({ status });
  };

  const saveDetails = async () => {
    setSaving(true);
    const out = await save({ notes: notes.trim(), officialUrl: url.trim() });
    setSaving(false);
    if (out) Alert.alert('Saved', 'Your notes and link were saved.');
  };

  const openLink = async () => {
    const target = (r.officialUrl || '').trim();
    try { await Linking.openURL(target); } catch (_e) { Alert.alert('Cannot open link', 'This address could not be opened on your phone.'); }
  };

  if (!r && !error) return <LoadingView label="Loading renewal guide…" />;
  if (!r) return <ErrorState message={error} onRetry={load} />;

  const { document: doc, progress } = r;
  const dirty = notes.trim() !== r.notes || url.trim() !== r.officialUrl;

  return (
    <Screen>
      <Card>
        <View style={styles.head}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.title}>{doc.title}</Text>
            <Text style={styles.sub}>{doc.expiryDate ? `Expires ${formatDate(doc.expiryDate)} · ${daysText(doc.daysRemaining)}` : 'No expiry date'}</Text>
          </View>
          <StatusBadge status={doc.status} />
        </View>
        <View style={styles.action}>
          <Ionicons name="flash" size={16} color={colors.primary} />
          <Text style={styles.actionText}>{r.recommendedAction}</Text>
        </View>
      </Card>

      <Text style={styles.section}>Status</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {RENEWAL_STATUSES.map((s) => <Chip key={s} label={s} active={r.status === s} onPress={() => setStatus(s)} />)}
      </View>
      {r.status === 'Completed' && r.completedAt ? <Text style={styles.done}>Completed on {formatDate(r.completedAt)}</Text> : null}

      <View style={styles.rowBetween}>
        <Text style={styles.section}>What you need</Text>
        <Text style={styles.progress}>{progress.done}/{progress.total} ready</Text>
      </View>
      <Card style={{ paddingVertical: 6 }}>
        {r.checklist.map((c, i) => (
          <Pressable key={`${c.label}-${i}`} onPress={() => toggle(i)} style={styles.check}>
            <Ionicons name={c.done ? 'checkbox' : 'square-outline'} size={24} color={c.done ? colors.success : colors.muted} />
            <Text style={[styles.checkText, c.done && styles.checkDone]}>{c.label}</Text>
          </Pressable>
        ))}
      </Card>

      <Text style={styles.section}>Step by step</Text>
      <Card>
        {r.steps.map((s, i) => (
          <View key={`${s}-${i}`} style={styles.step}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
            <Text style={styles.stepText}>{s}</Text>
          </View>
        ))}
      </Card>

      <Text style={styles.section}>Official resource</Text>
      <Card>
        {r.officialUrl ? (
          <Button title="Open official website" icon="open-outline" variant="secondary" onPress={openLink} style={{ marginBottom: 12 }} />
        ) : (
          <Text style={styles.hint}>No official website is set for this document type. Add the provider’s link below.</Text>
        )}
        <Input label="Link (https://…)" value={url} onChangeText={setUrl} keyboardType="url" placeholder="https://" style={{ marginTop: 8 }} />
        <Input label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Appointment time, reference number…" autoCapitalize="sentences" style={{ marginBottom: 12 }} />
        <Button title="Save notes & link" onPress={saveDetails} loading={saving} disabled={!dirty} />
      </Card>

      <Card style={{ marginTop: 16, backgroundColor: colors.primaryLight }}>
        <Text style={styles.cardTitle}>Got the renewed document?</Text>
        <Text style={styles.hint}>Upload it as a new version. DocuFlow reads the new expiry date and marks this renewal completed.</Text>
        <Button title="Upload renewed document" icon="cloud-upload-outline" onPress={() => navigation.navigate('VersionHistory', { id: doc.id, title: doc.title })} style={{ marginTop: 12 }} />
        <Button title="View document" variant="ghost" onPress={() => navigation.navigate('DocumentDetail', { id: doc.id })} style={{ marginTop: 6 }} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  action: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  actionText: { marginLeft: 6, fontSize: 14, fontWeight: '700', color: colors.primary },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  progress: { fontSize: 12, color: colors.textSecondary, marginBottom: 10, fontWeight: '600' },
  done: { fontSize: 12, color: colors.success, marginTop: 8, fontWeight: '600' },
  check: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkText: { marginLeft: 12, fontSize: 14, color: colors.text, flex: 1 },
  checkDone: { color: colors.muted, textDecorationLine: 'line-through' },
  step: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  stepText: { marginLeft: 12, fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },
  hint: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
});
