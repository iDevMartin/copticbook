import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { RootStackParamList, CopticContent } from '@/types';
import { CopticXMLParser } from '@/services/CopticXMLParser';
import { CopticBookSettings } from '@/services/CopticBookSettings';
import { FixedHeader } from '@/components/FixedHeader';

type ReadContentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReadContent'>;
type ReadContentScreenRouteProp = RouteProp<RootStackParamList, 'ReadContent'>;

interface Props {
  navigation: ReadContentScreenNavigationProp;
  route: ReadContentScreenRouteProp;
}

export const ReadContentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { fileName, title, readerType } = route.params;
  const [content, setContent] = useState<CopticContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [xmlParser, setXmlParser] = useState<CopticXMLParser | null>(null);

  const settings = CopticBookSettings.getInstance();

  useEffect(() => {
    loadContent();

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
  }, [fileName, readerType, navigation]);

  useEffect(() => {
    const handleSettingsChange = () => {
      if (xmlParser) {
        const visibleContent = xmlParser.getVisibleContent();
        setContent(visibleContent);
      }
    };

    settings.addChangeListener(handleSettingsChange);

    return () => {
      settings.removeChangeListener(handleSettingsChange);
    };
  }, [xmlParser]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const basePath = getBasePathForReaderType(readerType);
      const parser = new CopticXMLParser(basePath);
      parser.resetForNewDocument();
      
      const parseResult = await parser.parseXMLFile(fileName);
      const visibleContent = parser.getVisibleContent();
      
      setXmlParser(parser);
      setContent(visibleContent);
    } catch (error) {
      console.error('Error loading content:', error);
      Alert.alert('Error', 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const getBasePathForReaderType = (type: string): string => {
    // Map reader types to their respective folders
    const pathMap: { [key: string]: string } = {
      'agpeya': 'assets/xml/agpeya',
      'liturgies': 'assets/xml/liturgies',
      'antiphonary': 'assets/xml/antiphonary',
      'baptism': 'assets/xml/baptism',
      'clergy': 'assets/xml/clergy',
      'consecrations': 'assets/xml/consecrations',
      'crowning': 'assets/xml/crowning',
      'funeral': 'assets/xml/funeral',
      'lakkan': 'assets/xml/lakkan',
      'melodies': 'assets/xml/melodies',
      'papal': 'assets/xml/papal',
      'pascha': 'assets/xml/pascha',
      'praises': 'assets/xml/praises',
      'prostration': 'assets/xml/prostration',
      'raisingOfIncense': 'assets/xml/raisingOfIncense',
      'readings': 'assets/xml/readings',
      'unction': 'assets/xml/unction',
      'veneration': 'assets/xml/veneration',
    };
    
    return pathMap[type] || 'assets/xml';
  };

  const handleItemPress = (item: CopticContent) => {
    if (item.isCollapsibleSection && item.belongsToSection && xmlParser) {
      console.log('DEBUG: Toggling section', item.belongsToSection, 'for content with ID', item.id);
      xmlParser.toggleSection(item.belongsToSection);
      const visibleContent = xmlParser.getVisibleContent();
      setContent(visibleContent);
    }

    if (item.type === 'LinkDocument' && item.linkPath) {
      // Navigate to linked content
      const pathComponents = item.linkPath.split('/');
      const linkedFileName = pathComponents[pathComponents.length - 1];
      const displayTitle = linkedFileName.replace('Content', '').trim() || item.linkPath;
      
      navigation.push('ReadContent', {
        fileName: linkedFileName,
        title: displayTitle,
        readerType: readerType
      });
    }
  };

  const renderContentItem = ({ item, index }: { item: CopticContent; index: number }) => {
    const itemStyle = getItemStyle(item);
    const textContent = getDisplayText(item);
    const enabledLangs = settings.enabledLanguages;

    if (item.type === 'LinkDocument') {
      const displayText = item.linkPath
        ? item.linkPath.split('/').pop()?.replace('Content', '').trim() || 'Link Document'
        : 'Link Document';

      return (
        <TouchableOpacity
          style={[styles.contentItem, itemStyle.container]}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.7}
        >
          <Text style={[styles.contentText, itemStyle.text]}>
            {displayText} ›
          </Text>
        </TouchableOpacity>
      );
    }

    if (item.isCollapsibleSection) {
      const expandIcon = item.isExpanded ? '▼' : '▶';
      const isCopticContent = enabledLangs.length === 1 && enabledLangs.includes('Coptic') && item.coptic;

      return (
        <TouchableOpacity
          style={[styles.contentItem, itemStyle.container]}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.contentText,
            itemStyle.text,
            { fontFamily: isCopticContent ? 'Coptic' : undefined }
          ]}>
            {expandIcon} {textContent}
          </Text>
        </TouchableOpacity>
      );
    }

    // Handle silent roles that should be hidden
    if (item.isSilentRole && settings.silentRoleStyle === 'hidden') {
      return null;
    }

    // If multiple languages are enabled, show them in columns
    if (enabledLangs.length > 1) {
      const showEnglishColumn = enabledLangs.includes('English');

      return (
        <TouchableOpacity
          style={[styles.contentItem, itemStyle.container]}
          onPress={() => handleItemPress(item)}
          activeOpacity={item.isCollapsibleSection ? 0.7 : 1}
        >
          <View style={styles.columnsContainer}>
            {showEnglishColumn && (item.english || item.arabic || item.coptic) && (
              <View style={styles.languageColumn}>
                <Text
                  style={[
                    styles.contentText,
                    itemStyle.text,
                    { textAlign: 'left' }
                  ]}
                  numberOfLines={0}
                >
                  {item.english || item.arabic || item.coptic || 'No content available'}
                </Text>
              </View>
            )}
            {enabledLangs.includes('Coptic') && (item.coptic || (!showEnglishColumn && item.english)) && (
              <View style={styles.languageColumn}>
                <Text
                  style={[
                    styles.contentText,
                    itemStyle.text,
                    { textAlign: 'left', fontFamily: 'Coptic' }
                  ]}
                  numberOfLines={0}
                >
                  {item.coptic || (!showEnglishColumn && item.english) || 'No content available'}
                </Text>
              </View>
            )}
            {enabledLangs.includes('Arabic') && (item.arabic || (!showEnglishColumn && item.english)) && (
              <View style={styles.languageColumn}>
                <Text
                  style={[
                    styles.contentText,
                    itemStyle.text,
                    { textAlign: 'right' }
                  ]}
                  numberOfLines={0}
                >
                  {item.arabic || (!showEnglishColumn && item.english) || 'No content available'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    // Single language mode
    const isArabicOnly = enabledLangs.length === 1 && enabledLangs.includes('Arabic');
    const isCopticOnly = enabledLangs.length === 1 && enabledLangs.includes('Coptic');

    return (
      <TouchableOpacity
        style={[styles.contentItem, itemStyle.container]}
        onPress={() => handleItemPress(item)}
        activeOpacity={item.isCollapsibleSection ? 0.7 : 1}
      >
        <Text
          style={[
            styles.contentText,
            itemStyle.text,
            {
              textAlign: isArabicOnly ? 'right' : 'left',
              fontFamily: isCopticOnly ? 'Coptic' : undefined
            }
          ]}
          numberOfLines={0}
        >
          {textContent}
        </Text>
      </TouchableOpacity>
    );
  };

  const getDisplayText = (item: CopticContent): string => {
    // Return the first available text based on enabled languages
    const enabledLangs = settings.enabledLanguages;

    // Try to return first available enabled language, with fallback to English
    if (enabledLangs.includes('English') && item.english) return item.english;
    if (enabledLangs.includes('Arabic') && item.arabic) return item.arabic;
    if (enabledLangs.includes('Coptic') && item.coptic) return item.coptic;

    // Fallback to English even if not enabled, to avoid "No content available"
    if (item.english) return item.english;
    if (item.arabic) return item.arabic;
    if (item.coptic) return item.coptic;

    // DEBUG: Log content items with no text
    console.log('DEBUG: No content available for item:', {
      id: item.id,
      type: item.type,
      roleID: item.roleID,
      belongsToSection: item.belongsToSection,
      english: item.english,
      arabic: item.arabic,
      coptic: item.coptic,
      linkPath: item.linkPath,
      textType: item.textType
    });

    return 'No content available';
  };

  const getItemStyle = (item: CopticContent) => {
    const theme = settings.currentTheme;
    const fontConfig = settings.fontFor(item.type, item.textType, item.isSilentRole);
    
    let textColor = settings.colorFor(item.type, item.roleID, item.isSilentRole);
    let backgroundColor = settings.backgroundColorFor(item.roleID, item.isSilentRole);

    // Special styling for different content types
    if (item.type === 'Title') {
      if (item.isCollapsibleSection) {
        textColor = '#007AFF'; // Blue for collapsible titles
      } else {
        textColor = theme.colors.title;
      }
    } else if (item.type === 'RoleHeader') {
      textColor = theme.colors.roleHeader;
    }

    return {
      container: {
        backgroundColor: backgroundColor !== theme.colors.background ? backgroundColor : 'transparent',
      },
      text: {
        color: textColor,
        fontSize: fontConfig.size,
        fontWeight: fontConfig.weight as any,
        opacity: item.isSilentRole && settings.silentRoleStyle === 'grayed' ? 0.6 : 1,
      }
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading {title}...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <FixedHeader
          title={title}
          navigation={navigation}
          showBack={true}
          showSettings={true}
        />
      )}
      <FlatList
        data={content}
        renderItem={renderContentItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
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
  contentItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  contentText: {
    lineHeight: 22,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
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