import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import Chip from '../components/Chip';
import { CATEGORIES } from '../constants/categories';
import { colors } from '../constants/theme';
import { documentService } from '../services/documentService';
import { isValidInputDate, toInputDate } from '../utils/date';
import { fieldErrors, getErrorMessage } from '../utils/errors';

export default function EditDocumentScreen({ route, navigation }) {
  const { doc } = route.params;
  const [f, setF] = useState({
    title: doc.title || '',
    documentType: doc.documentType || '',
    category: doc.category || 'Other',
    holderName: doc.holderName || '',
    documentNumber: doc.documentNumber || '',
    issueDate: toInputDate(doc.issueDate),
    expiryDate: toInputDate(doc.expiryDate),
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    const e = {};
    if (!f.title.trim()) e.title = 'Title is required.';
    if (!f.documentType.trim()) e.documentType = 'Type is required.';
    if (f.issueDate && !isValidInputDate(f.issueDate)) e.issueDate = 'Use format YYYY-MM-DD.';
    if (f.expiryDate && !isValidInputDate(f.expiryDate)) e.expiryDate = 'Use format YYYY-MM-DD.';
    if (!e.issueDate && !e.expiryDate && f.issueDate && f.expiryDate && f.expiryDate < f.issueDate) e.expiryDate = 'Expiry cannot be before the issue date.';
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      await documentService.update(doc.id, {
        title: f.title.trim(),
        documentType: f.documentType.trim(),
        category: f.category,
        holderName: f.holderName.trim() || null,
        documentNumber: f.documentNumber.trim() || null,
        issueDate: f.issueDate || null,
        expiryDate: f.expiryDate || null,
      });
      navigation.goBack();
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Screen>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <Input label="Title" value={f.title} onChangeText={set('title')} error={errors.title} autoCapitalize="sentences" />
      <Input label="Document type" value={f.documentType} onChangeText={set('documentType')} error={errors.documentType} autoCapitalize="words" placeholder="e.g. Passport" />

      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {CATEGORIES.map((c) => <Chip key={c.key} label={c.key} active={f.category === c.key} onPress={() => set('category')(c.key)} />)}
      </ScrollView>

      <Input label="Holder name" value={f.holderName} onChangeText={set('holderName')} autoCapitalize="words" error={errors.holderName} />
      <Input label="Document number" value={f.documentNumber} onChangeText={set('documentNumber')} autoCapitalize="characters" error={errors.documentNumber} />
      <Input label="Issue date (YYYY-MM-DD)" value={f.issueDate} onChangeText={set('issueDate')} keyboardType="numbers-and-punctuation" placeholder="2024-01-31" maxLength={10} error={errors.issueDate} />
      <Input label="Expiry date (YYYY-MM-DD)" value={f.expiryDate} onChangeText={set('expiryDate')} keyboardType="numbers-and-punctuation" placeholder="Leave empty if it never expires" maxLength={10} error={errors.expiryDate} />

      <View style={{ marginTop: 8 }}>
        <Button title="Save changes" onPress={save} loading={saving} />
        <Button title="Cancel" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: 6 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  error: { backgroundColor: '#FEE2E2', color: colors.danger, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 },
});
