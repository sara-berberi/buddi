import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { colors, fonts, radius, spacing } from '../../lib/constants';

type Mode = 'splash' | 'login' | 'register';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('splash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form fields
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(emailOrUsername.trim(), password);
      } else {
        await register({
          username: username.trim(),
          email: email.trim(),
          password,
          displayName: displayName.trim(),
        });
      }
      // Auth gate handles navigation.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'splash') {
    return (
      <View style={[styles.splash, { paddingTop: insets.top }]}>
        <View style={styles.splashCenter}>
          <Text style={styles.logo}>Buddi</Text>
          <Text style={styles.tagline}>Tend the friendships you already have.</Text>
        </View>
        <View style={[styles.splashActions, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Button label="Get started" variant="accent" onPress={() => setMode('register')} />
          <Button
            label="I already have an account"
            variant="ghost"
            onPress={() => setMode('login')}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.formWrap}
    >
      <ScrollView contentContainerStyle={[styles.form, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.heading}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>

        {mode === 'register' && (
          <>
            <Field label="Display name" value={displayName} onChange={setDisplayName} />
            <Field label="Username" value={username} onChange={setUsername} autoCap="none" />
            <Field label="Email" value={email} onChange={setEmail} autoCap="none" keyboard="email-address" />
          </>
        )}

        {mode === 'login' && (
          <Field
            label="Email or username"
            value={emailOrUsername}
            onChange={setEmailOrUsername}
            autoCap="none"
          />
        )}

        <Field label="Password" value={password} onChange={setPassword} secure />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          label={mode === 'login' ? 'Log in' : 'Create account'}
          variant="primary"
          loading={loading}
          onPress={submit}
          style={{ marginTop: spacing.md }}
        />
        <Button
          label={mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
          variant="ghost"
          onPress={() => {
            setError(null);
            setMode(mode === 'login' ? 'register' : 'login');
          }}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  secure,
  autoCap = 'sentences',
  keyboard = 'default',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  autoCap?: 'none' | 'sentences';
  keyboard?: 'default' | 'email-address';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        autoCapitalize={autoCap}
        autoCorrect={false}
        keyboardType={keyboard}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.forest, paddingHorizontal: spacing.lg },
  splashCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontFamily: fonts.headerItalic, fontSize: 56, color: colors.cream },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.cream,
    opacity: 0.85,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  splashActions: {},
  formWrap: { flex: 1, backgroundColor: colors.cream },
  form: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  heading: { fontFamily: fonts.headerItalic, fontSize: 32, color: colors.ink, marginBottom: spacing.lg },
  field: { marginBottom: spacing.md },
  fieldLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, marginBottom: spacing.xs },
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
