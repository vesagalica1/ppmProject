import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme/colors';

const DOT_RADIUS = 4;
const PADDING = 10;

export default function WeightChart({ entries, height = 120 }) {
  const [width, setWidth] = useState(0);

  const points = useMemo(() => {
    if (!width || entries.length === 0) return [];

    const weights = entries.map((e) => e.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min || 1;

    const innerWidth = width - PADDING * 2;
    const innerHeight = height - PADDING * 2;
    const xStep = entries.length > 1 ? innerWidth / (entries.length - 1) : 0;

    return entries.map((entry, index) => {
      const x = PADDING + (entries.length > 1 ? index * xStep : innerWidth / 2);
      const ratio = (entry.weight - min) / range;
      const y = PADDING + (1 - ratio) * innerHeight;
      return { x, y };
    });
  }, [entries, width, height]);

  const segments = useMemo(() => {
    const result = [];
    for (let i = 0; i < points.length - 1; i += 1) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      result.push({
        key: `${i}`,
        length: Math.sqrt(dx * dx + dy * dy),
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
        midX: (p1.x + p2.x) / 2,
        midY: (p1.y + p2.y) / 2,
      });
    }
    return result;
  }, [points]);

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {entries.length === 0 ? (
        <Text style={styles.emptyText}>No weight logged yet</Text>
      ) : (
        <>
          {segments.map((segment) => (
            <View
              key={segment.key}
              style={[
                styles.line,
                {
                  width: segment.length,
                  left: segment.midX - segment.length / 2,
                  top: segment.midY - 1,
                  transform: [{ rotate: `${segment.angle}deg` }],
                },
              ]}
            />
          ))}
          {points.map((point, index) => (
            <View
              key={index}
              style={[styles.dot, { left: point.x - DOT_RADIUS, top: point.y - DOT_RADIUS }]}
            />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textOnCardMuted,
  },
  line: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
  dot: {
    position: 'absolute',
    width: DOT_RADIUS * 2,
    height: DOT_RADIUS * 2,
    borderRadius: DOT_RADIUS,
    backgroundColor: colors.accent,
  },
});
