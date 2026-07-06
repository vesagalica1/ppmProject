import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import KeyboardDoneBar, { KEYBOARD_DONE_BAR_ID } from '../components/KeyboardDoneBar';
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
  const [editingEntry, setEditingEntry] = useState(null);

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

  function handleSave() {
    const value = parseDecimal(weight);
    if (!weight || Number.isNaN(value) || value <= 0) {
      Alert.alert('Check your input', 'Weight must be a positive number.');
      return;
    }

    if (editingEntry) {
      saveWeight(value);
      return;
    }

    const existing = entries.find((e) => toDate(e.date).toDateString() === date.toDateString());
    if (existing) {
      Alert.alert(
        'Replace existing entry?',
        `You already logged ${existing.weight} kg for ${date.toDateString()}. Replace it with ${value} kg?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', style: 'destructive', onPress: () => saveWeight(value) },
        ]
      );
      return;
    }

    saveWeight(value);
  }

  async function saveWeight(value) {
    setSaving(true);
    try {
      await logWeightEntry(user.uid, { weight: value, date });
      setWeight('');
      setEditingEntry(null);
    } catch (error) {
      Alert.alert('Could not save weight', error.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(entry) {
    setEditingEntry(entry);
    setWeight(String(entry.weight));
    setDate(toDate(entry.date));
    setShowDatePicker(false);
  }

  function cancelEdit() {
    setEditingEntry(null);
    setWeight('');
    setDate(new Date());
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
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
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

            {editingEntry ? (
              <View style={styles.editBanner}>
                <Text style={styles.editBannerText}>
                  Editing {toDate(editingEntry.date).toDateString()}
                </Text>
                <Pressable onPress={cancelEdit} hitSlop={8}>
                  <Text style={styles.editBannerCancel}>Cancel</Text>
                </Pressable>
              </View>
            ) : null}

            <TextField
              label="Weight (kg)"
              placeholder="75.5"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              inputAccessoryViewID={KEYBOARD_DONE_BAR_ID}
            />

            <Text style={styles.label}>Date</Text>
            <Pressable
              style={[styles.dateButton, editingEntry && styles.dateButtonDisabled]}
              disabled={Boolean(editingEntry)}
              onPress={() => {
                Keyboard.dismiss();
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateButtonText}>{date.toDateString()}</Text>
            </Pressable>
            {showDatePicker && !editingEntry ? (
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
              title={editingEntry ? 'Update Weight' : 'Save Weight'}
              onPress={handleSave}
              loading={saving}
              style={styles.saveButton}
            />

            {sortedDescending.length > 0 ? (
              <>
                <Text style={styles.historyTitle}>History</Text>
                <Text style={styles.historyHint}>Swipe left to delete, tap the pencil to edit.</Text>
              </>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.entryWrapper}>
            <Swipeable
              renderRightActions={() => (
                <Pressable style={styles.deleteAction} onPress={() => confirmDelete(item)}>
                  <Ionicons name="trash" size={20} color="#FFFFFF" />
                </Pressable>
              )}
              overshootRight={false}
            >
              <View style={styles.entryRow}>
                <Text style={styles.entryDate}>
                  {toDate(item.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <View style={styles.entryRight}>
                  <Text style={styles.entryWeight}>{item.weight} kg</Text>
                  <Pressable onPress={() => startEdit(item)} hitSlop={8}>
                    <Ionicons name="pencil" size={18} color={colors.textOnCardMuted} />
                  </Pressable>
                </View>
              </View>
            </Swipeable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyBody}>No entries yet — log your weight above.</Text>
        }
      />
      <KeyboardDoneBar />
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
  dateButtonDisabled: {
    opacity: 0.6,
  },
  dateButtonText: {
    ...typography.body,
    color: colors.textOnCard,
  },
  editBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  editBannerText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  editBannerCancel: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
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
  entryWrapper: {
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
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deleteAction: {
    width: 72,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
