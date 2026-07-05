import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import {
  cancelDailyReminder,
  requestNotificationPermission,
  scheduleDailyReminder,
  scheduleOneOffReminder,
} from '../services/notifications';
import { getUserProfile, updateUserProfile } from '../services/userProfile';
import { colors, radius, spacing, typography } from '../theme/colors';

function parseTime(value) {
  const [hour, minute] = (value || '18:00').split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function ProfileScreen() {
  const { user, logOut } = useAuth();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getUserProfile(user.uid).then((profile) => {
      if (!isMounted || !profile) return;
      setReminderEnabled(Boolean(profile.reminderEnabled));
      setReminderTime(parseTime(profile.reminderTime));
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [user.uid]);

  async function handleToggleReminder(value) {
    if (value) {
      const { granted } = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications disabled',
          'Enable notifications in your device settings to get workout reminders.'
        );
        return;
      }
      await scheduleDailyReminder(reminderTime.getHours(), reminderTime.getMinutes());
    } else {
      await cancelDailyReminder();
    }
    setReminderEnabled(value);
    await persist(value, reminderTime);
  }

  async function handleTimeChange(event, selectedDate) {
    setShowPicker(Platform.OS === 'ios');
    if (!selectedDate) return;
    setReminderTime(selectedDate);
    if (reminderEnabled) {
      await scheduleDailyReminder(selectedDate.getHours(), selectedDate.getMinutes());
    }
    await persist(reminderEnabled, selectedDate);
  }

  async function persist(enabled, time) {
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        reminderEnabled: enabled,
        reminderTime: formatTime(time),
      });
    } catch (error) {
      Alert.alert('Could not save reminder', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestNotification() {
    const { granted } = await requestNotificationPermission();
    if (!granted) {
      Alert.alert('Notifications disabled', 'Enable notifications to receive a test reminder.');
      return;
    }
    await scheduleOneOffReminder(5);
    Alert.alert('Test scheduled', 'A reminder notification will arrive in about 5 seconds.');
  }

  function handleSignOut() {
    Alert.alert('Sign out?', 'You can log back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logOut },
    ]);
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user.displayName || 'GymLog Athlete'}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Reminder</Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.rowLabel}>Daily reminder</Text>
                <Text style={styles.rowHint}>Get a nudge to log your workout</Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={handleToggleReminder}
                disabled={loading}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Pressable
              style={styles.rowBetween}
              onPress={() => setShowPicker(true)}
              disabled={!reminderEnabled}
            >
              <Text style={[styles.rowLabel, !reminderEnabled && styles.disabledText]}>
                Reminder time
              </Text>
              <Text style={[styles.timeValue, !reminderEnabled && styles.disabledText]}>
                {formatTime(reminderTime)}
              </Text>
            </Pressable>
          </View>

          {showPicker ? (
            <DateTimePicker
              value={reminderTime}
              mode="time"
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              themeVariant="dark"
              accentColor={colors.accent}
              onChange={handleTimeChange}
            />
          ) : null}

          <PrimaryButton
            title="Send test reminder in 5s"
            variant="outline"
            onPress={handleTestNotification}
            style={styles.testButton}
          />
          {saving ? <Text style={styles.savingText}>Saving…</Text> : null}
        </View>

        <PrimaryButton
          title="Sign Out"
          variant="danger"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.primary,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
  },
  email: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  section: {
    width: '100%',
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textOnCard,
    fontWeight: '600',
  },
  rowHint: {
    ...typography.caption,
    color: colors.textOnCardMuted,
    marginTop: 2,
  },
  timeValue: {
    ...typography.h3,
    color: colors.accent,
  },
  disabledText: {
    opacity: 0.4,
  },
  testButton: {
    marginTop: spacing.md,
  },
  savingText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  signOutButton: {
    width: '100%',
    marginTop: spacing.xl,
  },
});
