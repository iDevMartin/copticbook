import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types';
import { FixedHeader } from '@/components/FixedHeader';

type BibleChaptersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BibleChapters'>;
type BibleChaptersScreenRouteProp = RouteProp<RootStackParamList, 'BibleChapters'>;

interface Props {
  navigation: BibleChaptersScreenNavigationProp;
  route: BibleChaptersScreenRouteProp;
}

export const BibleChaptersScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookName, chapterCount } = route.params;
  const { width } = useWindowDimensions();

  // Generate array of chapter numbers
  const chapters = Array.from({ length: chapterCount }, (_, i) => i + 1);

  // Calculate number of columns and button size based on screen width
  const { numColumns, buttonWidth } = useMemo(() => {
    // Account for container padding (16px on each side = 32px total)
    const containerPadding = 32;
    const buttonMargin = 5; // margin on each side of button
    const availableWidth = width - containerPadding;

    // Calculate optimal columns (each button needs minimum ~80px)
    const calculated = Math.floor(availableWidth / 80);
    const cols = Math.max(3, Math.min(10, calculated));

    // Calculate button width to ensure consistent sizing
    // Formula: (availableWidth - (cols * margin * 2)) / cols
    const btnWidth = (availableWidth - (cols * buttonMargin * 2)) / cols;

    return { numColumns: cols, buttonWidth: btnWidth };
  }, [width]);

  useEffect(() => {
    // Hide React Navigation header on web, use custom header instead
    if (Platform.OS === 'web') {
      navigation.setOptions({
        headerShown: false,
      });
    } else {
      // Add settings button to header on mobile
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
    }
  }, [navigation]);

  const handleChapterPress = (chapter: number) => {
    navigation.navigate('BibleChapterReader', {
      bookName: bookName,
      chapter: chapter
    });
  };

  const renderChapterItem = ({ item }: { item: number }) => (
    <TouchableOpacity
      style={[
        styles.chapterButton,
        {
          width: buttonWidth,
          height: buttonWidth, // Keep square aspect ratio
        }
      ]}
      onPress={() => handleChapterPress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.chapterText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <FixedHeader
          title={bookName}
          navigation={navigation}
          showBack={true}
          showSettings={true}
        />
      )}
      <FlatList
        key={numColumns} // Force re-render when columns change
        data={chapters}
        renderItem={renderChapterItem}
        keyExtractor={(item) => item.toString()}
        numColumns={numColumns}
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
  listContainer: {
    padding: 16,
  },
  chapterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  headerButton: {
    paddingHorizontal: 15,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});
