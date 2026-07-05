import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { addWorkout, updateWorkout } from '../services/workouts';
import { colors, radius, spacing, typography } from '../theme/colors';

const emptyForm = {
  exerciseName: '',
  sets: '',
  reps: '',
  weight: '',
  notes: '',
  date: new Date(),
};

export default function AddEditWorkoutScreen({ navigation, route }) {
  const { user } = useAuth();
  const editingWorkout = route.params?.workout;
  const isEditing = Boolean(editingWorkout);

  const [form, setForm] = useState(emptyForm);
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
      setForm(emptyForm);
    }
  }, [editingWorkout?.id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (!isEditing) setForm(emptyForm);
    });
    return unsubscribe;
  }, [navigation, isEditing]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    if (!form.exerciseName.trim()) return 'Please enter an exercise name.';
    if (!form.sets || Number.isNaN(Number(form.sets))) return 'Sets must be a number.';
    if (!form.reps || Number.isNaN(Number(form.reps))) return 'Reps must be a number.';
    if (form.weight === '' || Number.isNaN(Number(form.weight))) return 'Weight must be a number.';
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
      weight: Number(form.weight),
      notes: form.notes.trim(),
      date: form.date,
    };

    try {
      if (isEditing) {
        await updateWorkout(user.uid, editingWorkout.id, payload);
      } else {
        await addWorkout(user.uid, payload);
      }
      setForm(emptyForm);
      if (isEditing) {
        // Pop back to the Home list (instead of the now-stale detail screen)
        // so the edited values are shown fresh from the live Firestore query.
        navigation.navigate('Home');
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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
              containerStyle={styles.thirdField}
            />
            <TextField
              label="Reps"
              placeholder="10"
              value={form.reps}
              onChangeText={(v) => update('reps', v)}
              keyboardType="number-pad"
              containerStyle={styles.thirdField}
            />
            <TextField
              label="Weight (kg)"
              placeholder="40"
              value={form.weight}
              onChangeText={(v) => update('weight', v)}
              keyboardType="decimal-pad"
              containerStyle={styles.thirdField}
            />
          </View>

          <Text style={styles.label}>Date</Text>
          <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>{form.date.toDateString()}</Text>
          </Pressable>
          {showDatePicker ? (
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
