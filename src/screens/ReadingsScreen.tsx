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

type ReadingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Readings'>;

interface Props {
  navigation: ReadingsScreenNavigationProp;
}

const readingsFiles = [
  'Psalm',
  'Psalm and Gospel',
  'Chanted Psalm',
  'Catholic Epistle',
  'Pauline Epistle',
  'Praxis',
  'Synaxarion',
  'Gospel',
  'Matins Psalm',
  'Matins Psalm and Gospel',
  'Matins Gospel',
  'Vespers Psalm',
  'Vespers Psalm and Gospel',
  'Vespers Gospel',
  'Liturgy Psalm',
  'Liturgy Psalm and Gospel',
  'Liturgy Gospel',
  'Other Psalm',
  'Other Gospel',
  'Prophecies',
  'FromThePsalms',
  'ActsConclusion',
  'GospelIntro',
  'HosannaSundayFirstLiturgyPsalm',
  'StandInTheFear',
];

export const ReadingsScreen: React.FC<Props> = ({ navigation }) => {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Readings',
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

  const handleFilePress = (fileName: string) => {
    navigation.navigate('ReadContent', {
      fileName: fileName,
      title: fileName,
      readerType: 'readings',
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
      <FlatList
        data={readingsFiles}
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