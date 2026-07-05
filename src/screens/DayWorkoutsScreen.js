import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import WorkoutCard from '../components/WorkoutCard';
import { useAuth } from '../context/AuthContext';
import { subscribeToWorkouts } from '../services/workouts';
import { colors, spacing, typography } from '../theme/colors';

function toDate(value) {
  return value?.toDate ? value.toDate() : new Date(value);
}

export default function DayWorkoutsScreen({ navigation, route }) {
  const { user } = useAuth();
  const { dateKey } = route.params;
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    if (!user) return undefined;
    return subscribeToWorkouts(user.uid, setWorkouts, () => {});
  }, [user]);

  const dayWorkouts = useMemo(
    () => workouts.filter((w) => toDate(w.date).toDateString() === dateKey),
    [workouts, dateKey]
  );

  const totalSets = dayWorkouts.reduce((sum, w) => sum + Number(w.sets || 0), 0);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>
          {new Date(dateKey).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.subtitle}>
          {dayWorkouts.length} exercise{dayWorkouts.length === 1 ? '' : 's'} · {totalSets} sets
        </Text>
      </View>

      <FlatList
        data={dayWorkouts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <WorkoutCard
            workout={item}
            onPress={() => navigation.navigate('WorkoutDetail', { workout: item })}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xl * 2,
  },
});
