import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { BlobMascot } from '../../components/brand/BlobMascot';
import { colors, fonts, spacing } from '../../lib/constants';

export default function VerifyEmail() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }
    api
      .verifyEmail(String(token))
      .then(() => setState('ok'))
      .catch(() => setState('error'));
  }, [token]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl }]}
    >
      <View style={styles.mascot}>
        <BlobMascot size={110} mood={state === 'ok' ? 'excited' : state === 'error' ? 'sleepy' : 'happy'} />
      </View>

      {state === 'loading' && (
        <>
          <ActivityIndicator color={colors.forest} />
          <Text style={styles.sub}>Verifying your email…</Text>
        </>
      )}
      {state === 'ok' && (
        <>
          <Text style={styles.heading}>You’re verified! 🎉</Text>
          <Text style={styles.sub}>Thanks for confirming your email.</Text>
          <Button label="Continue" variant="primary" onPress={() => router.replace('/tabs')} style={{ marginTop: spacing.lg }} />
        </>
      )}
      {state === 'error' && (
        <>
          <Text style={styles.heading}>Link expired</Text>
          <Text style={styles.sub}>This verification link is invalid or has expired. You can resend it from your profile.</Text>
          <Button label="Go to app" variant="ghost" onPress={() => router.replace('/tabs')} style={{ marginTop: spacing.lg }} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, alignItems: 'center' },
  mascot: { marginBottom: spacing.md },
  heading: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink, textAlign: 'center' },
  sub: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: spacing.sm },
});
