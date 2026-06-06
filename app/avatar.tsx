import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersonAvatar } from '../components/avatar/PersonAvatar';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useUpdateProfile } from '../hooks/useProfile';
import { colors, fonts, radius, spacing } from '../lib/constants';
import {
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  ACCESSORIES,
  BG_COLORS,
  HAIR_LABEL,
  ACCESSORY_LABEL,
  randomAvatar,
} from '../lib/avatar';
import { DEFAULT_AVATAR, type AvatarConfig } from '../types';

export default function AvatarEditor() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const update = useUpdateProfile();
  const [cfg, setCfg] = useState<AvatarConfig>(user?.avatar ?? DEFAULT_AVATAR);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<AvatarConfig>) => setCfg((c) => ({ ...c, ...patch }));

  async function save() {
    setError(null);
    try {
      await update.mutateAsync({ avatar: cfg });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.cream }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <Text style={styles.title}>Style your buddy</Text>

      <View style={styles.preview}>
        <PersonAvatar config={cfg} size={160} ring />
      </View>

      <Pressable onPress={() => setCfg(randomAvatar())} style={styles.shuffle}>
        <Text style={styles.shuffleText}>🎲  Surprise me</Text>
      </Pressable>

      <Section label="Skin tone">
        <Swatches values={SKIN_TONES} selected={cfg.skin} onPick={(skin) => set({ skin })} />
      </Section>

      <Section label="Hair style">
        <Chips
          values={HAIR_STYLES as readonly string[]}
          labels={HAIR_LABEL as Record<string, string>}
          selected={cfg.hair}
          onPick={(hair) => set({ hair })}
        />
      </Section>

      <Section label="Hair color">
        <Swatches values={HAIR_COLORS} selected={cfg.hairColor} onPick={(hairColor) => set({ hairColor })} />
      </Section>

      <Section label="Accessory">
        <Chips
          values={ACCESSORIES as readonly string[]}
          labels={ACCESSORY_LABEL as Record<string, string>}
          selected={cfg.accessory}
          onPick={(accessory) => set({ accessory })}
        />
      </Section>

      <Section label="Background">
        <Swatches values={BG_COLORS} selected={cfg.bg} onPick={(bg) => set({ bg })} />
      </Section>

      {error && <Text style={styles.error}>{error}</Text>}

      <Button label="Save buddy" variant="accent" loading={update.isPending} onPress={save} style={{ marginTop: spacing.lg }} />
      <Button label="Cancel" variant="ghost" onPress={() => router.back()} style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Swatches({
  values,
  selected,
  onPick,
}: {
  values: string[];
  selected: string;
  onPick: (v: string) => void;
}) {
  return (
    <View style={styles.row}>
      {values.map((v) => (
        <Pressable
          key={v}
          onPress={() => onPick(v)}
          style={[styles.swatch, { backgroundColor: v }, selected === v && styles.swatchSelected]}
        />
      ))}
    </View>
  );
}

function Chips({
  values,
  labels,
  selected,
  onPick,
}: {
  values: readonly string[];
  labels: Record<string, string>;
  selected: string;
  onPick: (v: string) => void;
}) {
  return (
    <View style={styles.row}>
      {values.map((v) => {
        const active = selected === v;
        return (
          <Pressable key={v} onPress={() => onPick(v)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{labels[v] ?? v}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  title: { fontFamily: fonts.headerItalic, fontSize: 30, color: colors.ink, textAlign: 'center' },
  preview: { alignItems: 'center', marginTop: spacing.lg },
  shuffle: { alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  shuffleText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  section: { marginTop: spacing.lg },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: colors.forest, transform: [{ scale: 1.1 }] },
  chip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  chipTextActive: { color: colors.cream },
  error: { fontFamily: fonts.body, color: '#C44A3A', marginTop: spacing.md, textAlign: 'center' },
});
