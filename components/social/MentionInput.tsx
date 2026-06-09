import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../lib/api';
import { Avatar } from '../ui/Avatar';
import { colors, fonts, radius, spacing } from '../../lib/constants';
import type { UserCard } from '../../types';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  minHeight?: number;
}

// A TextInput that offers a friends-only @mention autocomplete. When the user
// types "@" followed by letters, it queries friends and shows a picker; picking
// inserts "@username ".
export function MentionInput({ value, onChangeText, placeholder, maxLength = 500, minHeight = 100 }: Props) {
  const [query, setQuery] = useState<string | null>(null);
  const [results, setResults] = useState<UserCard[]>([]);
  const tokenStart = useRef<number>(-1);

  // Detect an active "@token" at the caret end (we approximate using value end).
  function handleChange(text: string) {
    onChangeText(text);
    const m = /(^|\s)@(\w{1,20})$/.exec(text);
    if (m) {
      tokenStart.current = text.length - m[2].length - 1; // position of '@'
      setQuery(m[2]);
    } else {
      setQuery(null);
      setResults([]);
    }
  }

  useEffect(() => {
    if (query === null) return;
    let active = true;
    api
      .searchFriends(query)
      .then((r) => active && setResults(r))
      .catch(() => active && setResults([]));
    return () => {
      active = false;
    };
  }, [query]);

  function pick(u: UserCard) {
    const before = value.slice(0, tokenStart.current);
    const after = `@${u.username} `;
    onChangeText(`${before}${after}`);
    setQuery(null);
    setResults([]);
  }

  return (
    <View>
      <TextInput
        style={[styles.input, { minHeight }]}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline
        maxLength={maxLength}
      />
      {query !== null && results.length > 0 && (
        <View style={styles.popup}>
          {results.map((u) => (
            <Pressable key={u.id} style={styles.row} onPress={() => pick(u)}>
              <Avatar avatar={u.avatar} size={28} />
              <Text style={styles.name}>{u.displayName}</Text>
              <Text style={styles.handle}>@{u.username}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  popup: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  name: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  handle: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
});
