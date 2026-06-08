import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { BlobMascot } from '../../components/brand/BlobMascot';
import { colors, fonts, radius, spacing } from '../../lib/constants';

export default function ForgotPassword() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
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
        <BlobMascot size={96} mood={sent ? 'excited' : 'happy'} color={colors.sky} />
      </View>
      <Text style={styles.heading}>Forgot password?</Text>

      {sent ? (
        <>
          <Text style={styles.sub}>
            If an account exists for {email.trim()}, we’ve sent a reset link. Check your inbox.
          </Text>
          <Button label="Back to login" variant="primary" onPress={() => router.replace('/auth')} style={{ marginTop: spacing.lg }} />
        </>
      ) : (
        <>
          <Text style={styles.sub}>Enter your email and we’ll send you a link to reset it.</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          <Button label="Send reset link" variant="accent" loading={loading} disabled={!email.trim()} onPress={submit} style={{ marginTop: spacing.md }} />
          <Button label="Back to login" variant="ghost" onPress={() => router.replace('/auth')} style={{ marginTop: spacing.sm }} />
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
});
