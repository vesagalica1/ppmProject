import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import KeyboardDoneBar, { KEYBOARD_DONE_BAR_ID } from '../components/KeyboardDoneBar';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { addWorkout, updateWorkout } from '../services/workouts';
import { colors, radius, spacing, typography } from '../theme/colors';
import { parseDecimal } from '../utils/number';

function createEmptyForm(presetDate) {
  return {
    exerciseName: '',
    sets: '',
    reps: '',
    weight: '',
    notes: '',
    date: presetDate ? new Date(presetDate) : new Date(),
  };
}

export default function AddEditWorkoutScreen({ navigation, route }) {
  const { user } = useAuth();
  const editingWorkout = route.params?.workout;
  const presetDate = route.params?.presetDate;
  const isEditing = Boolean(editingWorkout);
  const isDateLocked = !isEditing && Boolean(presetDate);

  const [form, setForm] = useState(() => createEmptyForm(presetDate));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingWorkout) {
      setForm({
        exerciseName: editingWorkout.exerciseName,
        sets: String(editingWorkout.sets),
        reps: String(editingWorkout.reps),
        weight: String(editingWorkout.weight),
        notes: editingWorkout.notes || '',
        date: editingWorkout.date?.toDate ? editingWorkout.date.toDate() : new Date(editingWorkout.date),
      });
    } else {
      setForm(createEmptyForm(presetDate));
    }
  }, [editingWorkout?.id, presetDate]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (!isEditing) setForm(createEmptyForm(presetDate));
    });
    return unsubscribe;
  }, [navigation, isEditing, presetDate]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    if (!form.exerciseName.trim()) return 'Please enter an exercise name.';
    if (!form.sets || Number.isNaN(Number(form.sets))) return 'Sets must be a number.';
    if (!form.reps || Number.isNaN(Number(form.reps))) return 'Reps must be a number.';
    if (form.weight === '' || Number.isNaN(parseDecimal(form.weight))) return 'Weight must be a number.';
    return null;
  }

  async function handleSave() {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Check your input', validationError);
      return;
    }

    setSaving(true);
    const payload = {
      exerciseName: form.exerciseName.trim(),
      sets: Number(form.sets),
      reps: Number(form.reps),
      weight: parseDecimal(form.weight),
      notes: form.notes.trim(),
      date: form.date,
    };

    try {
      if (isEditing) {
        await updateWorkout(user.uid, editingWorkout.id, payload);
      } else {
        await addWorkout(user.uid, payload);
      }
      setForm(createEmptyForm(presetDate));
      if (isEditing) {
        // Pop back to the Home list (instead of the now-stale detail screen)
        // so the edited values are shown fresh from the live Firestore query.
        navigation.navigate('Home');
      } else if (presetDate) {
        // Return to the Day view we came from; it's live-subscribed so the new entry shows up right away.
        navigation.goBack();
      } else {
        navigation.navigate('HomeTab', { screen: 'Home' });
      }
    } catch (error) {
      Alert.alert('Could not save workout', error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
        >
          <Text style={styles.title}>{isEditing ? 'Edit Workout' : 'Log Workout'}</Text>
          <Text style={styles.subtitle}>
            {isEditing ? 'Update the details below.' : 'Fill in today’s session.'}
          </Text>

          <TextField
            label="Exercise name"
            placeholder="Bench Press"
            value={form.exerciseName}
            onChangeText={(v) => update('exerciseName', v)}
          />

          <View style={styles.row}>
            <TextField
              label="Sets"
              placeholder="3"
              value={form.sets}
              onChangeText={(v) => update('sets', v)}
              keyboardType="number-pad"
              inputAccessoryViewID={KEYBOARD_DONE_BAR_ID}
              containerStyle={styles.thirdField}
            />
            <TextField
              label="Reps"
              placeholder="10"
              value={form.reps}
              onChangeText={(v) => update('reps', v)}
              keyboardType="number-pad"
              inputAccessoryViewID={KEYBOARD_DONE_BAR_ID}
              containerStyle={styles.thirdField}
            />
            <TextField
              label="Weight (kg)"
              placeholder="40"
              value={form.weight}
              onChangeText={(v) => update('weight', v)}
              keyboardType="decimal-pad"
              inputAccessoryViewID={KEYBOARD_DONE_BAR_ID}
              containerStyle={styles.thirdField}
            />
          </View>

          <Text style={styles.label}>Date</Text>
          <Pressable
            style={[styles.dateButton, isDateLocked && styles.dateButtonDisabled]}
            disabled={isDateLocked}
            onPress={() => {
              Keyboard.dismiss();
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.dateButtonText}>{form.date.toDateString()}</Text>
          </Pressable>
          {showDatePicker && !isDateLocked ? (
            <DateTimePicker
              value={form.date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              themeVariant="dark"
              accentColor={colors.accent}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) update('date', selectedDate);
              }}
              maximumDate={new Date()}
            />
          ) : null}

          <TextField
            label="Notes (optional)"
            placeholder="Felt strong today, increase weight next time"
            value={form.notes}
            onChangeText={(v) => update('notes', v)}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />

          <PrimaryButton
            title={isEditing ? 'Save Changes' : 'Add Workout'}
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <KeyboardDoneBar />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  thirdField: {
    flex: 1,
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
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
