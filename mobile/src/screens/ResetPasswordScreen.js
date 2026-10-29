import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors } from '../constants/theme';
import { authService } from '../services/authService';
import { getErrorMessage } from '../utils/errors';
import { passwordProblem } from '../utils/validators';

export default function ResetPasswordScreen({ route, navigation }) {
  const email = route.params?.email || '';
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e = {};
    if (!/^\d{6}$/.test(code.trim())) e.code = 'Enter the 6-digit code from your email.';
    const pw = passwordProblem(password);
    if (pw) e.password = pw;
    if (password !== confirm) e.confirm = 'Passwords do not match.';
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      await authService.resetPassword({ email, code: code.trim(), password, confirmPassword: confirm });
      setDone(true);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <View style={{ marginTop: 40 }}>
          <Text style={styles.h1}>Password updated</Text>
          <Text style={styles.sub}>You can now sign in with your new password.</Text>
          <Button title="Go to sign in" onPress={() => navigation.popToTop()} style={{ marginTop: 24 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ marginTop: 16, marginBottom: 24 }}>
        <Text style={styles.h1}>Reset password</Text>
        <Text style={styles.sub}>If an account exists for {email}, a code was sent. It expires in 15 minutes.</Text>
      </View>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <Input label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} error={errors.code} placeholder="123456" />
      <Input label="New password" value={password} onChangeText={setPassword} secure error={errors.password} />
      <Input label="Confirm new password" value={confirm} onChangeText={setConfirm} secure error={errors.confirm} />
      <Button title="Update password" onPress={submit} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 },
  error: { backgroundColor: '#FEE2E2', color: colors.danger, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 },
});
