import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import { isFuture, isSameDay } from 'date-fns';
import Clip from '../../database/models/Clip';

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  clip?: Clip;
  onPress: (date: Date) => void;
}

export default function DayCell({ date, isCurrentMonth, clip, onPress }: DayCellProps) {
  const future = isFuture(date);
  const today = isSameDay(date, new Date());
  
  const content = () => {
    if (clip && clip.thumbnailPath) {
      return <Image source={{ uri: clip.thumbnailPath }} style={styles.image} contentFit="cover" />;
    }
    if (future) {
      return <Text style={styles.futureText}>{date.getDate()}</Text>;
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.dayText, today && styles.todayText]}>{date.getDate()}</Text>
        <Plus color={today ? "#007AFF" : "#A0A0A0"} size={16} />
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !isCurrentMonth && styles.hidden,
        !clip && !future && styles.dashedBorder,
      ]}
      disabled={future || !isCurrentMonth}
      onPress={() => onPress(date)}
    >
      {isCurrentMonth ? content() : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '13.5%',
    aspectRatio: 1,
    margin: '0.35%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hidden: {
    opacity: 0,
  },
  dashedBorder: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  todayText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  futureText: {
    fontSize: 12,
    color: '#ccc',
  },
});
