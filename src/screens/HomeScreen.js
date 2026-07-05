import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import DayGroupCard from '../components/DayGroupCard';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { subscribeToWorkouts } from '../services/workouts';
import { colors, radius, spacing, typography } from '../theme/colors';

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // week starts Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDate(value) {
  return value?.toDate ? value.toDate() : new Date(value);
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return undefined;
    const unsubscribe = subscribeToWorkouts(
      user.uid,
      (data) => {
        setWorkouts(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user]);

  const { weeklyCount, streak } = useMemo(() => computeStats(workouts), [workouts]);
  const dayGroups = useMemo(() => groupByDay(workouts), [workouts]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Your Workouts</Text>
        <Text style={styles.subtitle}>Keep the streak alive 🔥</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="This week" value={weeklyCount} />
        <StatCard label="Day streak" value={streak} />
        <StatCard label="Total logged" value={workouts.length} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={dayGroups}
        keyExtractor={(item) => item.dateKey}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <DayGroupCard
            group={item}
            onPress={() => navigation.navigate('DayWorkouts', { dateKey: item.dateKey })}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No workouts yet</Text>
              <Text style={styles.emptyBody}>
                Tap "Add" below to log your first workout.
              </Text>
            </View>
          ) : null
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('AddWorkoutTab')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </ScreenContainer>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function groupByDay(workouts) {
  const groups = new Map();
  for (const workout of workouts) {
    const date = toDate(workout.date);
    const dateKey = date.toDateString();
    if (!groups.has(dateKey)) {
      groups.set(dateKey, { dateKey, date, workouts: [] });
    }
    groups.get(dateKey).workouts.push(workout);
  }
  return Array.from(groups.values());
}

function computeStats(workouts) {
  if (workouts.length === 0) return { weeklyCount: 0, streak: 0 };

  const weekStart = startOfWeek(new Date());
  const weeklyCount = workouts.filter((w) => toDate(w.date) >= weekStart).length;

  const uniqueDays = Array.from(
    new Set(workouts.map((w) => toDate(w.date).toDateString()))
  )
    .map((d) => new Date(d))
    .sort((a, b) => b - a);

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const day of uniqueDays) {
    const diffDays = Math.round((cursor - day) / (1000 * 60 * 60 * 24));
    if (diffDays === 0 || diffDays === 1) {
      streak += 1;
      cursor = day;
    } else {
      break;
    }
  }

  return { weeklyCount, streak };
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.accent,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    fontSize: 30,
    color: colors.primary,
    marginTop: -2,
  },
});
