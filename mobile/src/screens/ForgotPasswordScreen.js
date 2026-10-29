import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors } from '../constants/theme';
import { authService } from '../services/authService';
import { getErrorMessage } from '../utils/errors';
import { isEmail } from '../utils/validators';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!isEmail(email)) return setError('Please enter a valid email address.');
    setError(null);
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      navigation.navigate('ResetPassword', { email: email.trim() });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={{ marginTop: 16, marginBottom: 24 }}>
        <Text style={styles.h1}>Forgot password?</Text>
        <Text style={styles.sub}>Enter your email and we will send you a 6-digit reset code.</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@example.com" />
      <Button title="Send reset code" onPress={submit} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 },
  error: { backgroundColor: '#FEE2E2', color: colors.danger, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 },
});
