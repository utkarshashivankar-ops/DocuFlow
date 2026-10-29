import React, { useCallback, useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Chip from '../components/Chip';
import { colors } from '../constants/theme';
import { documentService } from '../services/documentService';
import { formatDateTime } from '../utils/date';
import { getErrorMessage } from '../utils/errors';

const DURATIONS = [
  { label: '1 hour', hours: 1 },
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
];

const timeLeft = (iso) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3600000);
  return h >= 48 ? `${Math.floor(h / 24)} days left` : h >= 1 ? `${h} h left` : `${Math.max(1, Math.round(ms / 60000))} min left`;
};

export default function ShareScreen({ route }) {
  const { id, title } = route.params;
  const [hours, setHours] = useState(24);
  const [creating, setCreating] = useState(false);
  const [fresh, setFresh] = useState(null); // the link just created (its URL is only available now)
  const [links, setLinks] = useState(null);
  const [revoking, setRevoking] = useState(null);

  const load = useCallback(async () => {
    try { setLinks(await documentService.shares(id)); } catch (_e) { setLinks((l) => l || []); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const send = (url) => Share.share({ message: `${title} — secure link from DocuFlow:\n${url}`, url }).catch(() => {});

  const create = async () => {
    setCreating(true);
    try {
      const res = await documentService.createShare(id, hours);
      setFresh(res.share);
      load();
      send(res.share.url);
    } catch (err) {
      Alert.alert('Could not create link', getErrorMessage(err));
    } finally { setCreating(false); }
  };

  const revoke = (link) =>
    Alert.alert('Revoke this link?', 'Anyone using it will immediately lose access.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke', style: 'destructive',
        onPress: async () => {
          setRevoking(link.id);
          try {
            await documentService.revokeShare(id, link.id);
            if (fresh?.id === link.id) setFresh(null);
            await load();
          } catch (err) { Alert.alert('Could not revoke', getErrorMessage(err)); }
          finally { setRevoking(null); }
        },
      },
    ]);

  return (
    <Screen>
      <Card>
        <View style={styles.head}>
          <Ionicons name="lock-closed" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Share securely</Text>
        </View>
        <Text style={styles.hint}>Creates a private link that stops working on its own. Your document stays private — only people with the link can open it, and you can revoke it any time.</Text>

        <Text style={styles.label}>Link works for</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {DURATIONS.map((d) => <Chip key={d.hours} label={d.label} active={hours === d.hours} onPress={() => setHours(d.hours)} />)}
        </View>
        <Button title="Create secure link" icon="link-outline" onPress={create} loading={creating} style={{ marginTop: 16 }} />
      </Card>

      {fresh ? (
        <Card style={{ marginTop: 14, backgroundColor: colors.primaryLight }}>
          <Text style={styles.cardTitle}>Your new link</Text>
          <Text selectable style={styles.url}>{fresh.url}</Text>
          <Text style={styles.hint}>For security this link is shown only now. Expires {formatDateTime(fresh.expiresAt)}.</Text>
          <Button title="Share link" icon="share-social-outline" variant="secondary" onPress={() => send(fresh.url)} style={{ marginTop: 10 }} />
        </Card>
      ) : null}

      <Text style={styles.section}>Active links</Text>
      {links === null ? <Text style={styles.hint}>Loading…</Text> : !links.length ? <Text style={styles.hint}>No active links. This document is not shared with anyone.</Text> : links.map((l) => (
        <Card key={l.id} style={{ marginBottom: 10 }}>
          <View style={styles.linkRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>Created {formatDateTime(l.createdAt)}</Text>
              <Text style={styles.hint}>{timeLeft(l.expiresAt)} · opened {l.accessCount} time{l.accessCount === 1 ? '' : 's'}</Text>
            </View>
            <Button title="Revoke" small variant="danger" onPress={() => revoke(l)} loading={revoking === l.id} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginLeft: 6 },
  hint: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8 },
  url: { fontSize: 12, color: colors.primary, marginTop: 8, lineHeight: 18 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 20, marginBottom: 10 },
  linkRow: { flexDirection: 'row', alignItems: 'center' },
  linkTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
});
