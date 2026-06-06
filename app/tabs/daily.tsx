import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToday, usePostAnswer } from '../../hooks/useDaily';
import { AnswerCard } from '../../components/daily/AnswerCard';
import { Button } from '../../components/ui/Button';
import { colors, fonts, spacing } from '../../lib/constants';

export default function DailyScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError } = useToday();
  const post = usePostAnswer();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!draft.trim()) return;
    setError(null);
    try {
      await post.mutateAsync(draft.trim());
      setDraft('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post');
    }
  }

  if (isLoading) return <Centered><ActivityIndicator color={colors.forest} /></Centered>;
  if (isError || !data) return <Centered><Text style={styles.muted}>Couldn’t load today’s question.</Text></Centered>;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.kicker}>Today’s question</Text>
        <Text style={styles.question}>{data.question.prompt}</Text>

        {!data.answered ? (
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={500}
              placeholder="Say what you actually think…"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.counter}>{draft.length}/500</Text>
            {error && <Text style={styles.error}>{error}</Text>}
            <Button
              label="Post — cannot edit"
              variant="accent"
              loading={post.isPending}
              disabled={!draft.trim()}
              onPress={submit}
            />
            <Text style={styles.note}>
              Once posted, your answer is locked. You’ll then see your friends’ answers.
            </Text>
          </View>
        ) : (
          <View style={styles.answers}>
            {data.myAnswer && (
              <AnswerCard
                name="You"
                body={data.myAnswer.body}
                timestamp={data.myAnswer.createdAt ?? data.myAnswer.created_at ?? ''}
                isMine
              />
            )}

            <Text style={styles.sectionLabel}>
              {data.friendsAnswers.length > 0
                ? 'Friends’ answers'
                : 'No friends have answered yet today'}
            </Text>

            {data.friendsAnswers.map((a) => (
              <AnswerCard
                key={a.id}
                name={a.display_name}
                emoji={a.avatar_emoji}
                body={a.body}
                timestamp={a.created_at}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  kicker: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber, textTransform: 'uppercase', letterSpacing: 1 },
  question: { fontFamily: fonts.headerItalic, fontSize: 30, lineHeight: 38, color: colors.ink, marginTop: spacing.sm },
  composer: { marginTop: spacing.xl },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    minHeight: 120,
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  counter: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, alignSelf: 'flex-end', marginTop: spacing.xs, marginBottom: spacing.md },
  note: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: spacing.md, textAlign: 'center' },
  answers: { marginTop: spacing.xl },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted, marginTop: spacing.md, marginBottom: spacing.md },
  muted: { fontFamily: fonts.body, color: colors.muted },
  error: { fontFamily: fonts.body, color: '#C44A3A', marginBottom: spacing.sm },
});
