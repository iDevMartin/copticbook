import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList, Book } from '@/types';
import { DatabaseService } from '@/services/DatabaseService';
import { CopticBookSettings } from '@/services/CopticBookSettings';

type BibleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Bible'>;

interface Props {
  navigation: BibleScreenNavigationProp;
}

export const BibleScreen: React.FC<Props> = ({ navigation }) => {
  const [books, setBooks] = useState<{ name: string; chapters: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const databaseService = DatabaseService.getInstance();
  const settings = CopticBookSettings.getInstance();

  useEffect(() => {
    loadBibleBooks();
    
    // Add settings button to header
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.headerButtonText}>⚙</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const loadBibleBooks = async () => {
    try {
      setLoading(true);
      const bibleBooks = await databaseService.getBibleBooks();
      setBooks(bibleBooks);
    } catch (error) {
      console.error('Error loading Bible books:', error);
      Alert.alert('Error', 'Failed to load Bible books');
    } finally {
      setLoading(false);
    }
  };

  const handleBookPress = (book: { name: string; chapters: number }) => {
    // Navigate to chapter selection screen
    navigation.navigate('BibleChapters', {
      bookName: book.name,
      chapterCount: book.chapters
    });
  };

  const renderBookItem = ({ item }: { item: { name: string; chapters: number } }) => (
    <TouchableOpacity
      style={styles.bookItem}
      onPress={() => handleBookPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.bookContent}>
        <Text style={styles.bookName}>{item.name}</Text>
        <Text style={styles.chapterCount}>
          {item.chapters} chapter{item.chapters !== 1 ? 's' : ''}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading Bible...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  listContainer: {
    paddingVertical: 10,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 8,
  },
  bookContent: {
    flex: 1,
  },
  bookName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  chapterCount: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  chevron: {
    fontSize: 20,
    color: '#666666',
    marginLeft: 10,
  },
  headerButton: {
    paddingHorizontal: 15,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});