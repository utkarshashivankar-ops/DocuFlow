import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { ErrorState, LoadingView } from '../components/States';
import { POLL_INTERVAL_MS, POLL_TIMEOUT_MS } from '../constants/config';
import { colors, radius } from '../constants/theme';
import { documentService, uploadVersion } from '../services/documentService';
import { pickFromCamera, pickFromFiles, pickFromGallery } from '../utils/pickFile';
import { formatDate, formatDateTime } from '../utils/date';
import { getErrorMessage } from '../utils/errors';

const kb = (n) => (n ? (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`) : '');
const BUSY = ['processing', 'extracting', 'classifying', 'uploading'];

export default function VersionHistoryScreen({ route, navigation }) {
  const { id } = route.params;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | uploading | reading
  const [busyVersion, setBusyVersion] = useState(null);
  const timer = useRef(null);
  const alive = useRef(true);

  useEffect(() => { alive.current = true; return () => { alive.current = false; clearTimeout(timer.current); }; }, []);

  const load = useCallback(async () => {
    try { const res = await documentService.versions(id); if (alive.current) { setData(res); setError(null); } }
    catch (err) { if (alive.current) setError(getErrorMessage(err)); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  /** Wait for OCR of the new file, then tell the user what was found. */
  const waitForReading = (announce) => {
    const started = Date.now();
    const tick = async () => {
      if (!alive.current) return;
      try {
        const d = await documentService.get(id);
        if (!BUSY.includes(d.processingStatus)) {
          setPhase('idle'); await load();
          if (announce) {
            Alert.alert(
              d.processingStatus === 'failed' ? 'Uploaded, but text could not be read' : 'New version ready',
              d.expiryDate ? `Expiry date is now ${formatDate(d.expiryDate)}. Please check that it is correct.` : 'No expiry date was found. You can enter it by editing the document.',
              [{ text: 'Edit details', onPress: () => navigation.navigate('EditDocument', { doc: d }) }, { text: 'OK' }]
            );
          }
          return;
        }
      } catch (_e) { /* transient - keep polling */ }
      if (Date.now() - started > POLL_TIMEOUT_MS) { setPhase('idle'); load(); return; }
      timer.current = setTimeout(tick, POLL_INTERVAL_MS);
    };
    timer.current = setTimeout(tick, POLL_INTERVAL_MS);
  };

  const upload = async (picker) => {
    const file = await picker();
    if (!file) return;
    setPhase('uploading');
    try {
      await uploadVersion(id, file);
      setPhase('reading');
      await load();
      waitForReading(true);
    } catch (err) {
      setPhase('idle');
      Alert.alert('Upload failed', getErrorMessage(err));
    }
  };

  const restore = (v) =>
    Alert.alert(`Restore version ${v.versionNumber}?`, 'It becomes the current file and its expiry date and number are restored. Your other versions are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: async () => {
          setBusyVersion(v.versionNumber);
          try { await documentService.restoreVersion(id, v.versionNumber); setPhase('reading'); await load(); waitForReading(false); }
          catch (err) { Alert.alert('Could not restore', getErrorMessage(err)); }
          finally { setBusyVersion(null); }
        },
      },
    ]);

  const openFile = (v) => v.fileUrl && Linking.openURL(v.fileUrl).catch(() => Alert.alert('Cannot open file'));

  if (!data && !error) return <LoadingView label="Loading versions…" />;
  if (!data) return <ErrorState message={error} onRetry={load} />;

  const working = phase !== 'idle';

  return (
    <Screen>
      <Card>
        <Text style={styles.cardTitle}>Upload a new version</Text>
        <Text style={styles.hint}>For a renewed or updated copy. The previous file stays in the history so you can go back.</Text>
        {working ? (
          <View style={styles.working}>
            <Ionicons name="sync" size={18} color={colors.primary} />
            <Text style={styles.workingText}>{phase === 'uploading' ? 'Uploading…' : 'Reading the new file…'}</Text>
          </View>
        ) : (
          <View style={{ marginTop: 12 }}>
            <Button title="Scan with camera" icon="camera-outline" onPress={() => upload(pickFromCamera)} />
            <Button title="Choose a photo" icon="image-outline" variant="secondary" onPress={() => upload(pickFromGallery)} style={{ marginTop: 8 }} />
            <Button title="Choose a PDF / file" icon="document-outline" variant="outline" onPress={() => upload(pickFromFiles)} style={{ marginTop: 8 }} />
          </View>
        )}
      </Card>

      <Text style={styles.section}>History ({data.count})</Text>
      {!data.versions.length ? <Text style={styles.hint}>No file has been uploaded for this document yet.</Text> : null}
      {data.versions.map((v) => (
        <Card key={v.versionNumber} style={{ marginBottom: 10 }}>
          <View style={styles.row}>
            <View style={styles.thumb}>
              {v.thumbnailUrl ? <Image source={{ uri: v.thumbnailUrl }} style={styles.img} resizeMode="cover" /> : <Ionicons name="document-text" size={26} color={colors.primary} />}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.titleRow}>
                <Text style={styles.vTitle}>Version {v.versionNumber}</Text>
                {v.isCurrent ? <View style={styles.current}><Text style={styles.currentText}>Current</Text></View> : null}
              </View>
              <Text style={styles.meta}>{formatDateTime(v.uploadedAt)}{v.fileSize ? ` · ${kb(v.fileSize)}` : ''}</Text>
              <Text style={styles.meta}>{v.expiryDate ? `Expiry ${formatDate(v.expiryDate)}` : 'No expiry date'}{v.documentNumber ? ` · ${v.documentNumber}` : ''}</Text>
            </View>
          </View>
          <View style={styles.btnRow}>
            <Button title="Open" small variant="outline" icon="open-outline" onPress={() => openFile(v)} style={{ flex: 1, marginRight: 8 }} />
            {!v.isCurrent ? <Button title="Restore" small variant="secondary" icon="arrow-undo-outline" onPress={() => restore(v)} loading={busyVersion === v.versionNumber} disabled={working} style={{ flex: 1 }} /> : <View style={{ flex: 1 }} />}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 20, marginBottom: 10 },
  working: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  workingText: { marginLeft: 8, color: colors.primary, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  img: { width: 56, height: 56 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  vTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  current: { marginLeft: 8, backgroundColor: '#D1FAE5', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  currentText: { color: colors.success, fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  btnRow: { flexDirection: 'row', marginTop: 12 },
});
