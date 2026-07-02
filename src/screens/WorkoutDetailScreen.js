import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { deleteWorkout } from '../services/workouts';
import { colors, radius, spacing, typography } from '../theme/colors';

export default function WorkoutDetailScreen({ navigation, route }) {
  const { user } = useAuth();
  const { workout } = route.params;
  const [deleting, setDeleting] = useState(false);

  const date = workout.date?.toDate ? workout.date.toDate() : new Date(workout.date);

  function confirmDelete() {
    Alert.alert('Delete workout?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: handleDelete },
    ]);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteWorkout(user.uid, workout.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not delete workout', error.message);
      setDeleting(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{workout.exerciseName}</Text>
        <Text style={styles.date}>
          {date.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        <View style={styles.card}>
          <View style={styles.statsRow}>
            <Stat label="Sets" value={workout.sets} />
            <Stat label="Reps" value={workout.reps} />
            <Stat label="Weight" value={`${workout.weight} kg`} />
          </View>
        </View>

        {workout.notes ? (
          <View style={styles.card}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesBody}>{workout.notes}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title="Edit Workout"
          onPress={() => navigation.navigate('AddEditWorkout', { workout })}
          style={styles.editButton}
        />
        <PrimaryButton
          title="Delete Workout"
          variant="danger"
          onPress={confirmDelete}
          loading={deleting}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  date: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...typography.h2,
    color: colors.accent,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textOnCardMuted,
    marginTop: spacing.xs,
  },
  notesLabel: {
    ...typography.caption,
    color: colors.textOnCardMuted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  notesBody: {
    ...typography.body,
    color: colors.textOnCard,
  },
  editButton: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});
