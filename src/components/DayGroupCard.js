import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/colors';

function formatDayLabel(date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function DayGroupCard({ group, onPress }) {
  const { date, workouts } = group;
  const totalSets = workouts.reduce((sum, w) => sum + Number(w.sets || 0), 0);
  const exerciseNames = workouts.map((w) => w.exerciseName).join(', ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.day}>{formatDayLabel(date)}</Text>
        <Text style={styles.count}>
          {workouts.length} exercise{workouts.length === 1 ? '' : 's'}
        </Text>
      </View>
      <Text style={styles.meta}>{totalSets} sets logged</Text>
      <Text numberOfLines={1} style={styles.exercises}>
        {exerciseNames}
      </Text>
    </Pressable>
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
    marginBottom: spacing.xs,
  },
  day: {
    ...typography.h3,
    color: colors.textOnCard,
  },
  count: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  meta: {
    ...typography.caption,
    color: colors.textOnCardMuted,
    marginBottom: spacing.xs,
  },
  exercises: {
    ...typography.body,
    color: colors.textOnCardMuted,
  },
});
