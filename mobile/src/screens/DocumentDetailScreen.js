import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { ErrorState, LoadingView } from '../components/States';
import { categoryMeta } from '../constants/categories';
import { POLL_INTERVAL_MS } from '../constants/config';
import { colors } from '../constants/theme';
import { documentService } from '../services/documentService';
import { daysText, formatDate, formatDateTime } from '../utils/date';
import { getErrorMessage } from '../utils/errors';

const BUSY = ['processing', 'extracting', 'classifying', 'uploading'];
const STAGE_TEXT = { processing: 'Preparing…', extracting: 'Extracting text…', classifying: 'Classifying…', uploading: 'Uploading…' };

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

export default function DocumentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);
  const [showText, setShowText] = useState(false);
  const [busy, setBusy] = useState(false); // delete / reprocess in flight
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const d = await documentService.get(id);
      setDoc(d);
      setError(null);
      return d;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    }
  }, [id]);

  // load on focus (so edits show up) and keep polling while OCR is still running
  useFocusEffect(useCallback(() => {
    let cancelled = false;
    const tick = async () => {
      const d = await load();
      if (cancelled) return;
      if (d && BUSY.includes(d.processingStatus)) timer.current = setTimeout(tick, POLL_INTERVAL_MS);
    };
    tick();
    return () => { cancelled = true; clearTimeout(timer.current); };
  }, [load]));

  useEffect(() => { if (doc) navigation.setOptions({ title: doc.title }); }, [doc?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmDelete = () => {
    Alert.alert('Delete document?', 'This permanently removes the document and its file. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try { await documentService.remove(id); navigation.goBack(); }
          catch (err) { Alert.alert('Could not delete', getErrorMessage(err)); setBusy(false); }
        },
      },
    ]);
  };

  const reprocess = async () => {
    setBusy(true);
    try {
      const d = await documentService.reprocess(id);
      setDoc(d);
      const tick = async () => {
        const next = await load();
        if (next && BUSY.includes(next.processingStatus)) timer.current = setTimeout(tick, POLL_INTERVAL_MS);
      };
      timer.current = setTimeout(tick, POLL_INTERVAL_MS);
    } catch (err) {
      Alert.alert('Could not start processing', getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!doc && !error) return <LoadingView label="Loading document…" />;
  if (!doc) return <ErrorState message={error} onRetry={load} />;

  const meta = categoryMeta(doc.category);
  const processing = BUSY.includes(doc.processingStatus);
  const isImage = doc.mimeType?.startsWith('image/');

  return (
    <Screen>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {doc.fileUrl && isImage ? (
          <Image source={{ uri: doc.fileUrl }} style={styles.preview} resizeMode="contain" />
        ) : (
          <View style={[styles.preview, { alignItems: 'center', justifyContent: 'center', backgroundColor: meta.bg }]}>
            <Ionicons name={doc.fileUrl ? 'document-text' : meta.icon} size={52} color={meta.color} />
            {doc.fileUrl ? <Button title="Open PDF" small variant="secondary" onPress={() => Linking.openURL(doc.fileUrl)} style={{ marginTop: 12 }} /> : <Text style={styles.noFile}>No file attached</Text>}
          </View>
        )}
      </Card>

      <View style={styles.titleRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.title}>{doc.title}</Text>
          <Text style={styles.sub}>{doc.documentType} · {doc.category}</Text>
        </View>
        {!processing ? <StatusBadge status={doc.status} /> : null}
      </View>

      {processing ? (
        <Card style={[styles.banner, { backgroundColor: colors.primaryLight }]}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>{STAGE_TEXT[doc.processingStatus] || 'Processing…'}</Text>
          <Text style={styles.bannerSub}>Details will appear here automatically.</Text>
        </Card>
      ) : null}
      {doc.processingStatus === 'failed' ? (
        <Card style={[styles.banner, { backgroundColor: '#FEE2E2' }]}>
          <Text style={{ color: colors.danger, fontWeight: '600' }}>Automatic processing failed</Text>
          <Text style={styles.bannerSub}>{doc.processingError || 'You can edit the details manually or retry.'}</Text>
          {doc.fileUrl ? <Button title="Retry processing" small variant="outline" onPress={reprocess} loading={busy} style={{ marginTop: 10, alignSelf: 'flex-start' }} /> : null}
        </Card>
      ) : null}

      <Card style={{ marginTop: 12 }}>
        <Row label="Holder name" value={doc.holderName} />
        <Row label="Document number" value={doc.documentNumber} />
        <Row label="Issue date" value={doc.issueDate ? formatDate(doc.issueDate) : null} />
        <Row label="Expiry date" value={doc.expiryDate ? `${formatDate(doc.expiryDate)}  (${daysText(doc.daysRemaining)})` : 'No expiry date'} />
        <Row label="Version" value={doc.versionCount > 1 ? `${doc.currentVersion} of ${doc.versionCount}` : '1'} />
        <Row label="Classified by" value={doc.classificationSource === 'manual' ? 'You (manual)' : `Automatic${doc.classificationConfidence != null ? ` · ${Math.round(doc.classificationConfidence * 100)}% confidence` : ''}`} />
        <Row label="Added" value={formatDateTime(doc.createdAt)} />
        <Row label="Updated" value={formatDateTime(doc.updatedAt)} />
      </Card>

      {doc.importantDates?.length ? (
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.cardTitle}>Important dates found</Text>
          {doc.importantDates.map((d, i) => <Row key={`${d.label}-${i}`} label={d.label} value={formatDate(d.date)} />)}
        </Card>
      ) : null}

      {doc.extractedText ? (
        <Card style={{ marginTop: 12 }}>
          <Pressable onPress={() => setShowText((s) => !s)} style={styles.ocrHead}>
            <Text style={styles.cardTitle}>Extracted text (OCR){doc.ocrConfidence ? ` · ${Math.round(doc.ocrConfidence)}%` : ''}</Text>
            <Ionicons name={showText ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
          </Pressable>
          {showText ? <Text selectable style={styles.ocrText}>{doc.extractedText}</Text> : null}
        </Card>
      ) : null}

      <View style={{ marginTop: 16 }}>
        {doc.status !== 'Active' ? (
          <Button title="Open renewal guide" icon="refresh-circle-outline" onPress={() => navigation.navigate('RenewalDetail', { documentId: doc.id })} style={{ marginBottom: 10 }} />
        ) : null}
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Button title="Versions" icon="layers-outline" variant="secondary" onPress={() => navigation.navigate('VersionHistory', { id: doc.id, title: doc.title })} style={{ flex: 1, marginRight: 8 }} />
          <Button title={doc.isShared ? 'Shared' : 'Share'} icon="share-social-outline" variant="secondary" onPress={() => navigation.navigate('Share', { id: doc.id, title: doc.title })} disabled={!doc.fileUrl} style={{ flex: 1 }} />
        </View>
        <Button title="Edit details" icon="create-outline" onPress={() => navigation.navigate('EditDocument', { doc })} disabled={busy} />
        {doc.fileUrl && doc.processingStatus === 'completed' ? (
          <Button title="Re-run text extraction" icon="refresh-outline" variant="outline" onPress={reprocess} loading={busy} style={{ marginTop: 10 }} />
        ) : null}
        <Button title="Delete document" icon="trash-outline" variant="danger" onPress={confirmDelete} disabled={busy} style={{ marginTop: 10 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', height: 240, backgroundColor: '#F3F4F6' },
  noFile: { color: colors.textSecondary, marginTop: 8, fontSize: 13 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  banner: { marginTop: 12, padding: 12 },
  bannerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { fontSize: 13, color: colors.textSecondary, flex: 0.9 },
  rowValue: { fontSize: 13, color: colors.text, fontWeight: '600', flex: 1.4, textAlign: 'right' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  ocrHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ocrText: { marginTop: 10, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});
