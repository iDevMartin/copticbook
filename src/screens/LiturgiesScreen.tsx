import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';

type LiturgiesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Liturgies'>;

interface Props {
  navigation: LiturgiesScreenNavigationProp;
}

const liturgiesFiles = [
  { name: 'St Basil - Offering of the Lamb', path: 'basil/Offering of the Lamb' },
  { name: 'St Basil - Liturgy of the Word', path: 'basil/Liturgy of the Word' },
  { name: 'St Basil - Liturgy of the Faithful', path: 'basil/Liturgy of the Faithful' },
  { name: 'St Basil - Distribution', path: 'basil/Distribution of the Holy Mysteries' },
  { name: 'St Gregory Liturgy', path: 'St Gregory Liturgy' },
  { name: 'Standard Fractions', path: 'Standard Fractions' },
];

export const LiturgiesScreen: React.FC<Props> = ({ navigation }) => {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Liturgies',
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
  }, [navigation]);

  const handleFilePress = (fileName: string, displayName: string) => {
    navigation.navigate('ReadContent', {
      fileName: fileName,
      title: displayName,
      readerType: 'liturgies',
    });
  };

  const renderFileItem = ({ item }: { item: { name: string; path: string } }) => (
    <TouchableOpacity
      style={styles.fileButton}
      onPress={() => handleFilePress(item.path, item.name)}
      activeOpacity={0.7}
    >
      <Text style={styles.fileButtonText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={liturgiesFiles}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.path}
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
    paddingHorizontal: 15,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});