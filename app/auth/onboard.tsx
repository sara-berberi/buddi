import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useUpdateProfile } from '../../hooks/useProfile';
import { Button } from '../../components/ui/Button';
import { CompanionPicker } from '../../components/plants/CompanionPicker';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import type { CompanionType } from '../../types';

// 5 questions to build a personality profile (used for future quest personalization).
const QUESTIONS = [
  { key: 'ideal_evening', prompt: 'Your ideal evening with a friend?' },
  { key: 'recharge', prompt: 'After a long week, you recharge by…' },
  { key: 'conversation', prompt: 'The kind of conversation you love most?' },
  { key: 'city_spot', prompt: 'Your go-to spot in the city?' },
  { key: 'reaching_out', prompt: 'What stops you from reaching out to friends?' },
];

export default function OnboardScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const updateProfile = useUpdateProfile();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [companion, setCompanion] = useState<CompanionType>('plant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = QUESTIONS.filter((q) => answers[q.key]?.trim()).length;

  async function finish() {
    setError(null);
    setLoading(true);
    try {
      // Save the companion choice first (completeOnboarding flips the auth gate).
      await updateProfile.mutateAsync({ companionType: companion });
      const payload = QUESTIONS.filter((q) => answers[q.key]?.trim()).map((q) => ({
        questionKey: q.key,
        answer: answers[q.key].trim(),
      }));
      await completeOnboarding(payload);
      // Auth gate routes to tabs once onboarded flips true.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save answers');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <Text style={styles.heading}>Pick your buddy</Text>
      <Text style={styles.sub}>
        Every friendship grows as a companion. Choose how yours looks — you can change it later.
      </Text>
      <CompanionPicker value={companion} onChange={setCompanion} />

      <Text style={[styles.heading, { marginTop: spacing.xl }]}>A few questions</Text>
      <Text style={styles.sub}>
        This helps us suggest the right quests later. Answer what you like — you can skip any.
      </Text>

      {QUESTIONS.map((q) => (
        <View key={q.key} style={styles.field}>
          <Text style={styles.prompt}>{q.prompt}</Text>
          <TextInput
            style={styles.input}
            value={answers[q.key] ?? ''}
            onChangeText={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))}
            multiline
            placeholder="Type your answer…"
            placeholderTextColor={colors.muted}
          />
        </View>
      ))}

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        label={answeredCount === 0 ? 'Skip for now' : 'Finish'}
        variant="primary"
        loading={loading}
        onPress={finish}
        style={{ marginTop: spacing.md }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  heading: { fontFamily: fonts.headerItalic, fontSize: 32, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.lg },
  field: { marginBottom: spacing.lg },
  prompt: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 60,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  error: { fontFamily: fonts.body, color: '#C44A3A', marginTop: spacing.sm },
});
