import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

interface FixedHeaderProps {
  title: string;
  navigation: StackNavigationProp<any>;
  showBack?: boolean;
  showSettings?: boolean;
}

export const FixedHeader: React.FC<FixedHeaderProps> = ({
  title,
  navigation,
  showBack = true,
  showSettings = true,
}) => {
  return (
    <View style={styles.header}>
      {showBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
      {showSettings && (
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsButtonText}>⚙</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    height: 56,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    ...(Platform.OS === 'web' && {
      position: 'sticky' as any,
      top: 0,
      zIndex: 1000,
    }),
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  settingsButton: {
    paddingHorizontal: 15,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});
