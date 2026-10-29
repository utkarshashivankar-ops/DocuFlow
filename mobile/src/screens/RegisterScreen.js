import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { fieldErrors, getErrorMessage } from '../utils/errors';
import { isEmail, passwordProblem } from '../utils/validators';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Please enter your full name.';
    if (!isEmail(form.email)) e.email = 'Please enter a valid email address.';
    const pw = passwordProblem(form.password);
    if (pw) e.password = pw;
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not create your account.'));
      setLoading(false);
    }
  };

  return (
    <Screen safeTop>
      <View style={{ marginTop: 24, marginBottom: 24 }}>
        <Text style={styles.h1}>Create account</Text>
        <Text style={styles.sub}>Store, scan and track your important documents.</Text>
      </View>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <Input label="Full name" value={form.name} onChangeText={set('name')} autoCapitalize="words" error={errors.name} placeholder="Your full name" />
      <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" error={errors.email} placeholder="you@example.com" />
      <Input label="Password" value={form.password} onChangeText={set('password')} secure error={errors.password} placeholder="8+ characters, letters and numbers" />
      <Input label="Confirm password" value={form.confirmPassword} onChangeText={set('confirmPassword')} secure error={errors.confirmPassword} placeholder="Re-enter password" />
      <Button title="Create account" onPress={submit} loading={loading} />
      <View style={styles.footer}>
        <Text style={styles.sub}>Already have an account? </Text>
        <Pressable onPress={() => navigation.navigate('Login')}><Text style={styles.link}>Sign in</Text></Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  link: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  error: { backgroundColor: '#FEE2E2', color: colors.danger, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 },
});
