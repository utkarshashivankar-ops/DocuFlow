import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';
import { isEmail } from '../utils/validators';

export default function LoginScreen({ navigation }) {
  const { login, notice, setNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const submit = async () => {
    const e = {};
    if (!isEmail(email)) e.email = 'Please enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;
    setLoading(true);
    setNotice(null);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not sign in.'));
      setLoading(false);
    }
  };

  return (
    <Screen safeTop>
      <View style={{ marginTop: 40, marginBottom: 28 }}>
        <Text style={styles.h1}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to manage your documents.</Text>
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {formError ? <Text style={styles.error}>{formError}</Text> : null}

      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" error={errors.email} placeholder="you@example.com" />
      <Input label="Password" value={password} onChangeText={setPassword} secure error={errors.password} placeholder="Your password" />

      <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: 18 }}>
        <Text style={styles.link}>Forgot password?</Text>
      </Pressable>

      <Button title="Sign in" onPress={submit} loading={loading} />

      <View style={styles.footer}>
        <Text style={styles.sub}>New to DocuFlow? </Text>
        <Pressable onPress={() => navigation.navigate('Register')}><Text style={styles.link}>Create an account</Text></Pressable>
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
  notice: { backgroundColor: '#FEF3C7', color: '#92400E', padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 },
});
