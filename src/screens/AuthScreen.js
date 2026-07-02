import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme/colors';

export default function AuthScreen() {
  const { signUp, logIn } = useAuth();
  const [mode, setMode] = useState('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  async function handleSubmit() {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }
    if (isSignup && !displayName.trim()) {
      Alert.alert('Missing info', 'Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await signUp(email.trim(), password, displayName.trim());
      } else {
        await logIn(email.trim(), password);
      }
    } catch (error) {
      Alert.alert('Authentication error', friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>🏋️ GymLog</Text>
          <Text style={styles.title}>{isSignup ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>
            {isSignup
              ? 'Track workouts and stay on schedule.'
              : 'Log in to keep your streak going.'}
          </Text>

          <View style={styles.form}>
            {isSignup ? (
              <TextField
                label="Name"
                placeholder="Jane Doe"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            ) : null}
            <TextField
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextField
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <PrimaryButton
              title={isSignup ? 'Sign Up' : 'Log In'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />

            <PrimaryButton
              variant="outline"
              title={isSignup ? 'Already have an account? Log In' : "New here? Create an account"}
              onPress={() => setMode(isSignup ? 'login' : 'signup')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function friendlyAuthError(error) {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/email-already-in-use':
      return 'An account already exists with that email.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    default:
      return error.message;
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logo: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginBottom: spacing.md,
  },
});
