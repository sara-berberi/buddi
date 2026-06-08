import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { BlobMascot } from '../../components/brand/BlobMascot';
import { colors, fonts, radius, spacing } from '../../lib/constants';

export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!token) {
      setError('Missing reset token. Open the link from your email.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.resetPassword(String(token), password);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl }]}
    >
      <View style={styles.mascot}>
        <BlobMascot size={96} mood={done ? 'excited' : 'happy'} />
      </View>
      <Text style={styles.heading}>{done ? 'All set!' : 'New password'}</Text>

      {done ? (
        <>
          <Text style={styles.sub}>Your password has been updated. Log in with your new password.</Text>
          <Button label="Go to login" variant="primary" onPress={() => router.replace('/auth')} style={{ marginTop: spacing.lg }} />
        </>
      ) : (
        <>
          <Text style={styles.sub}>Choose a new password (at least 8 characters).</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Update password" variant="accent" loading={loading} disabled={password.length < 8} onPress={submit} style={{ marginTop: spacing.md }} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  mascot: { alignItems: 'center', marginBottom: spacing.md },
  heading: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.ink, textAlign: 'center' },
  sub: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  error: { fontFamily: fonts.body, color: '#C44A3A', marginTop: spacing.sm },
});
