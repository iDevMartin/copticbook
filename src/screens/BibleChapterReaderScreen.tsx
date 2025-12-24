import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { RootStackParamList, BibleVerse } from '@/types';
import { DatabaseService } from '@/services/DatabaseService';
import { CopticBookSettings } from '@/services/CopticBookSettings';

type BibleChapterReaderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BibleChapterReader'>;
type BibleChapterReaderScreenRouteProp = RouteProp<RootStackParamList, 'BibleChapterReader'>;

interface Props {
  navigation: BibleChapterReaderScreenNavigationProp;
  route: BibleChapterReaderScreenRouteProp;
}

export const BibleChapterReaderScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookName, chapter } = route.params;
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);

  const databaseService = DatabaseService.getInstance();
  const settings = CopticBookSettings.getInstance();

  useEffect(() => {
    loadChapter();

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

    const handleSettingsChange = () => {
      // Trigger re-render when settings change using functional update to avoid stale closure
      setVerses(currentVerses => [...currentVerses]);
    };

    settings.addChangeListener(handleSettingsChange);

    return () => {
      settings.removeChangeListener(handleSettingsChange);
    };
  }, [bookName, chapter, navigation]);

  const loadChapter = async () => {
    try {
      setLoading(true);
      const chapterVerses = await databaseService.getBibleChapter(bookName, chapter);
      setVerses(chapterVerses);
    } catch (error) {
      console.error('Error loading Bible chapter:', error);
      Alert.alert('Error', 'Failed to load Bible chapter');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayText = (verse: BibleVerse): string => {
    const enabledLangs = settings.enabledLanguages;

    // Return first available enabled language
    if (enabledLangs.includes('English') && verse.english) return verse.english;
    if (enabledLangs.includes('Arabic') && verse.arabic) return verse.arabic;
    if (enabledLangs.includes('Coptic') && verse.coptic) return verse.coptic;

    return 'No translation available';
  };

  const renderVerse = ({ item }: { item: BibleVerse }) => {
    const theme = settings.currentTheme;
    const enabledLangs = settings.enabledLanguages;

    // If multiple languages are enabled, show them in columns
    if (enabledLangs.length > 1) {
      return (
        <View style={styles.verseContainer}>
          <Text style={[styles.verseNumber, { color: theme.colors.verseNumber || '#FFD700' }]}>
            {item.verse}
          </Text>
          <View style={styles.columnsContainer}>
            {enabledLangs.includes('English') && item.english && (
              <View style={styles.languageColumn}>
                <Text
                  style={[
                    styles.verseText,
                    {
                      color: theme.colors.text || '#FFFFFF',
                      fontSize: settings.fontSize,
                      textAlign: 'left'
                    }
                  ]}
                >
                  {item.english}
                </Text>
              </View>
            )}
            {enabledLangs.includes('Coptic') && item.coptic && (
              <View style={styles.languageColumn}>
                <Text
                  style={[
                    styles.verseText,
                    {
                      color: theme.colors.text || '#FFFFFF',
                      fontSize: settings.fontSize,
                      textAlign: 'left'
                    }
                  ]}
                >
                  {item.coptic}
                </Text>
              </View>
            )}
            {enabledLangs.includes('Arabic') && item.arabic && (
              <View style={styles.languageColumn}>
                <Text
                  style={[
                    styles.verseText,
                    {
                      color: theme.colors.text || '#FFFFFF',
                      fontSize: settings.fontSize,
                      textAlign: 'right'
                    }
                  ]}
                >
                  {item.arabic}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    // Single language mode - original layout
    const verseText = getDisplayText(item);
    const isArabicOnly = enabledLangs.length === 1 && enabledLangs.includes('Arabic');

    return (
      <View style={styles.verseContainer}>
        <Text style={[styles.verseNumber, { color: theme.colors.verseNumber || '#FFD700' }]}>
          {item.verse}
        </Text>
        <Text
          style={[
            styles.verseText,
            {
              color: theme.colors.text || '#FFFFFF',
              fontSize: settings.fontSize,
              textAlign: isArabicOnly ? 'right' : 'left'
            }
          ]}
        >
          {verseText}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading {bookName} {chapter}...</Text>
      </View>
    );
  }

  if (verses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No verses found for {bookName} chapter {chapter}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={verses}
        renderItem={renderVerse}
        keyExtractor={(item) => `${item.book}-${item.chapter}-${item.verse}`}
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
  emptyContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  verseContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
    minWidth: 30,
  },
  verseText: {
    flex: 1,
    lineHeight: 24,
    fontWeight: '300',
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  languageColumn: {
    flex: 1,
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerButton: {
    paddingHorizontal: 15,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});
