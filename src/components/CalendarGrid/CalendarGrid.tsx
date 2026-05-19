import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import DayCell from './DayCell';
import Clip from '../../database/models/Clip';

interface CalendarGridProps {
  clips: Clip[];
  onDayPress: (date: Date) => void;
}

export default function CalendarGrid({ clips, onDayPress }: CalendarGridProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonthDate]);

  // Fix #8: Pre-build a lookup map keyed by "YYYY-MM-DD" for O(1) per cell
  // instead of O(n) clips.find() for every cell rendered
  const clipMap = useMemo(() => {
    const map = new Map<string, Clip>();
    for (const clip of clips) {
      const key = format(new Date(clip.date), 'yyyy-MM-dd');
      map.set(key, clip);
    }
    return map;
  }, [clips]);

  const nextMonth = () => setCurrentMonthDate(addMonths(currentMonthDate, 1));
  const prevMonth = () => setCurrentMonthDate(subMonths(currentMonthDate, 1));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{format(currentMonthDate, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
          <ChevronRight color="#333" size={24} />
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={styles.weekdayText}>{d}</Text>
        ))}
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === currentMonthDate.getMonth();
          const dayKey = format(day, 'yyyy-MM-dd');
          const clipForDay = clipMap.get(dayKey);
          return (
            <DayCell
              key={i}
              date={day}
              isCurrentMonth={isCurrentMonth}
              clip={clipForDay}
              onPress={onDayPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    margin: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  navButton: {
    padding: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekdayText: {
    width: '13.5%',
    textAlign: 'center',
    margin: '0.35%',
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
});
