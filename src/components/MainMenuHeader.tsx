import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LiturgicalInfo } from '@/types';

interface MainMenuHeaderProps {
  liturgicalInfo: LiturgicalInfo;
  onDatePress: () => void;
}

export const MainMenuHeader: React.FC<MainMenuHeaderProps> = ({
  liturgicalInfo,
  onDatePress,
}) => {
  return (
    <View style={styles.header}>
      {/* Title */}
      <Text style={styles.title}>CopticBook</Text>

      {/* Date and Season Display */}
      <TouchableOpacity style={styles.dateSeasonContainer} onPress={onDatePress}>
        <Text style={styles.copticDateLabel}>{liturgicalInfo.copticDate}</Text>
        <Text style={styles.seasonLabel}>{liturgicalInfo.season}</Text>
        <Text style={[
          styles.simulationIndicator,
          { color: liturgicalInfo.isSimulating ? '#FF9900' : '#33CC33' }
        ]}>
          {liturgicalInfo.isSimulating ? '📅 Custom Date' : 'Live'}
        </Text>
      </TouchableOpacity>

      {/* Separator */}
      <View style={styles.separator} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    ...(Platform.OS === 'web' && {
      position: 'sticky' as any,
      top: 0,
      zIndex: 1000,
    }),
  },
  title: {
    fontSize: 52,
    fontWeight: '100',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
  },
  dateSeasonContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginBottom: 20,
  },
  copticDateLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  seasonLabel: {
    fontSize: 16,
    fontWeight: '300',
    color: '#CCAA33',
    textAlign: 'center',
    marginBottom: 4,
  },
  simulationIndicator: {
    fontSize: 14,
    fontWeight: '300',
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.33)',
    marginHorizontal: 0,
    marginBottom: 10,
  },
});
