import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import TextField from '../components/TextField';
import WeightChart from '../components/WeightChart';
import { useAuth } from '../context/AuthContext';
import {
  deleteWeightEntry,
  logWeightEntry,
  subscribeToWeightEntries,
} from '../services/weightEntries';
import { colors, radius, spacing, typography } from '../theme/colors';
import { parseDecimal } from '../utils/number';

function toDate(value) {
  return value?.toDate ? value.toDate() : new Date(value);
}

export default function WeightTrackerScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    return subscribeToWeightEntries(user.uid, setEntries, () => {});
  }, [user]);

  const chartEntries = useMemo(
    () => entries.map((e) => ({ weight: e.weight, date: toDate(e.date) })),
    [entries]
  );

  const latest = entries[entries.length - 1];
  const previous = entries[entries.length - 2];
  const delta = latest && previous ? latest.weight - previous.weight : null;

  const sortedDescending = useMemo(() => [...entries].reverse(), [entries]);

  async function handleSave() {
    const value = parseDecimal(weight);
    if (!weight || Number.isNaN(value) || value <= 0) {
      Alert.alert('Check your input', 'Weight must be a positive number.');
      return;
    }

    setSaving(true);
    try {
      await logWeightEntry(user.uid, { weight: value, date });
      setWeight('');
    } catch (error) {
      Alert.alert('Could not save weight', error.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(entry) {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteWeightEntry(user.uid, entry.id),
      },
    ]);
  }

  return (
    <ScreenContainer>
      <FlatList
        data={sortedDescending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Weight Tracker</Text>
            <Text style={styles.subtitle}>Log your weight and watch the trend.</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{latest ? `${latest.weight} kg` : '—'}</Text>
                <Text style={styles.summaryLabel}>Latest</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg`}
                </Text>
                <Text style={styles.summaryLabel}>Change</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <WeightChart entries={chartEntries} height={140} />
            </View>

            <TextField
              label="Weight (kg)"
              placeholder="75.5"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Date</Text>
            <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateButtonText}>{date.toDateString()}</Text>
            </Pressable>
            {showDatePicker ? (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="dark"
                accentColor={colors.accent}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDate(selectedDate);
                }}
                maximumDate={new Date()}
              />
            ) : null}

            <PrimaryButton
              title="Save Weight"
              onPress={handleSave}
              loading={saving}
              style={styles.saveButton}
            />

            {sortedDescending.length > 0 ? (
              <>
                <Text style={styles.historyTitle}>History</Text>
                <Text style={styles.historyHint}>Tap an entry to delete it.</Text>
              </>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.entryRow, pressed && styles.pressed]}
            onPress={() => confirmDelete(item)}
          >
            <Text style={styles.entryDate}>
              {toDate(item.date).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.entryWeight}>{item.weight} kg</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyBody}>No entries yet — log your weight above.</Text>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.h2,
    color: colors.accent,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  chartCard: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  dateButton: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  dateButtonText: {
    ...typography.body,
    color: colors.textOnCard,
  },
  saveButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  historyTitle: {
    ...typography.h3,
    color: colors.text,
  },
  historyHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
  entryDate: {
    ...typography.body,
    color: colors.textOnCardMuted,
  },
  entryWeight: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textOnCard,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
