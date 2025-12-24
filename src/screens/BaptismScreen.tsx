import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import { FixedHeader } from '@/components/FixedHeader';

type BaptismScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Baptism'>;

interface Props {
  navigation: BaptismScreenNavigationProp;
}

const baptismFiles = [
  'Baptism - Holy Baptism',
  'Baptism - Consecrating the Water',
  'Baptism - Holy Myron',
  'Baptism - Bathing Prayer',
  'Baptism - Absolution of the Woman (Boy)',
  'Baptism - Absolution of the Woman (Girl)',
  'Baptism - Loosing the Girdle',
];

export const BaptismScreen: React.FC<Props> = ({ navigation }) => {
  useLayoutEffect(() => {
    if (Platform.OS === 'web') {
      navigation.setOptions({
        headerShown: false,
      });
    } else {
      navigation.setOptions({
        title: 'Baptism',
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '300',
          fontSize: 18,
        },
        headerRight: () => (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsButtonText}>⚙</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation]);

  const handleFilePress = (fileName: string) => {
    navigation.navigate('ReadContent', {
      fileName: fileName,
      title: fileName,
      readerType: 'baptism',
    });
  };

  const renderFileItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.fileButton}
      onPress={() => handleFilePress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.fileButtonText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'web' && (
        <FixedHeader
          title="Baptism"
          navigation={navigation}
          showBack={true}
          showSettings={true}
        />
      )}
      <FlatList
        data={baptismFiles}
        renderItem={renderFileItem}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  listContainer: {
    padding: 16,
    gap: 8,
  },
  fileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  fileButtonText: {
    fontSize: 18,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  settingsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});