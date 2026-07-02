import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/colors';

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function WorkoutCard({ workout, onPress }) {
  const date = workout.date?.toDate ? workout.date.toDate() : new Date(workout.date);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.exercise}>{workout.exerciseName}</Text>
        <Text style={styles.date}>{formatDate(date)}</Text>
      </View>
      <View style={styles.statsRow}>
        <Stat label="Sets" value={workout.sets} />
        <Stat label="Reps" value={workout.reps} />
        <Stat label="Weight" value={`${workout.weight} kg`} />
      </View>
      {workout.notes ? (
        <Text numberOfLines={1} style={styles.notes}>
          {workout.notes}
        </Text>
      ) : null}
    </Pressable>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exercise: {
    ...typography.h3,
    color: colors.textOnCard,
  },
  date: {
    ...typography.caption,
    color: colors.textOnCardMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statValue: {
    ...typography.h3,
    color: colors.accent,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textOnCardMuted,
  },
  notes: {
    marginTop: spacing.sm,
    ...typography.caption,
    color: colors.textOnCardMuted,
    fontStyle: 'italic',
  },
});
