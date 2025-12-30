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
  Animated,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';

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

// Store scroll positions globally across all screen instances
const scrollPositions = new Map<string, number>();

export const ReadContentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { fileName, title, readerType } = route.params;
  const [content, setContent] = useState<CopticContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [xmlParser, setXmlParser] = useState<CopticXMLParser | null>(null);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [sidePaneVisible, setSidePaneVisible] = useState(false);
  const sidePaneAnim = React.useRef(new Animated.Value(0)).current;

  const settings = CopticBookSettings.getInstance();
  const flatListRef = React.useRef<FlatList>(null);
  const screenKey = `${readerType}::${fileName}`;
  const scrollViewRef = React.useRef<any>(null);
  const scrollHandlerRef = React.useRef<any>(null);

  // Restore scroll position when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      console.log(`[${screenKey}] Screen focused`);

      // Attach web scroll listener on focus
      if (Platform.OS === 'web') {
        const handleScroll = (e: any) => {
          const scrollTop = e.target?.scrollTop || window.pageYOffset || document.documentElement.scrollTop || 0;
          scrollPositions.set(screenKey, scrollTop);
          console.log(`[${screenKey}] WEB Scroll position saved:`, scrollTop);
        };

        scrollHandlerRef.current = handleScroll;

        // Find and attach to scroll container
        const attemptAttach = () => {
          let container = document.querySelector('[data-testid="flat-list"]');

          if (!container) {
            const allDivs = document.querySelectorAll('div');
            for (const div of Array.from(allDivs)) {
              const style = window.getComputedStyle(div);
              const hasScroll = style.overflowY === 'scroll' ||
                              style.overflowY === 'auto' ||
                              style.overflow === 'scroll' ||
                              style.overflow === 'auto';
              if (hasScroll && div.scrollHeight > 100) {
                container = div;
                console.log(`[${screenKey}] Found scrollable container by overflow check`);
                break;
              }
            }
          }

          if (!container) {
            container = document.body;
            console.log(`[${screenKey}] Falling back to document.body`);
          }

          if (container) {
            scrollViewRef.current = container;
            container.addEventListener('scroll', handleScroll, { passive: true });
            window.addEventListener('scroll', handleScroll, { passive: true });
            console.log(`[${screenKey}] Web scroll listener attached to:`, container.tagName, container.className);
          }
        };

        setTimeout(attemptAttach, 50);
      }

      const savedPosition = scrollPositions.get(screenKey);
      console.log(`[${screenKey}] Saved position:`, savedPosition);

      // Always attempt restoration if we have a saved position
      if (savedPosition && savedPosition > 0) {
        console.log(`[${screenKey}] Will attempt to restore to:`, savedPosition);

        if (Platform.OS === 'web') {
          // Web-specific restoration - try multiple strategies
          const attempts = [100, 200, 300, 400, 500];
          attempts.forEach(delay => {
            setTimeout(() => {
              // Try multiple scroll targets
              if (scrollViewRef.current) {
                console.log(`[${screenKey}] WEB Restoring via scrollViewRef to:`, savedPosition);
                scrollViewRef.current.scrollTop = savedPosition;
              }

              window.scrollTo(0, savedPosition);
              document.documentElement.scrollTop = savedPosition;
              document.body.scrollTop = savedPosition;

              // Also try any scrollable div
              const allDivs = document.querySelectorAll('div');
              for (const div of Array.from(allDivs)) {
                const style = window.getComputedStyle(div);
                const hasScroll = style.overflowY === 'scroll' || style.overflowY === 'auto';
                if (hasScroll && div.scrollHeight > savedPosition) {
                  div.scrollTop = savedPosition;
                  console.log(`[${screenKey}] WEB Restored via div.scrollTop at ${delay}ms`);
                  break;
                }
              }
            }, delay);
          });
        } else {
          // Native restoration
          const attempts = [0, 50, 100, 200, 300];
          attempts.forEach(delay => {
            setTimeout(() => {
              console.log(`[${screenKey}] NATIVE Attempt at ${delay}ms delay`);
              flatListRef.current?.scrollToOffset({
                offset: savedPosition,
                animated: false,
              });
            }, delay);
          });
        }
      }

      setSettingsVersion(prev => prev + 1);

      // Cleanup when screen loses focus
      return () => {
        if (Platform.OS === 'web' && scrollHandlerRef.current) {
          console.log(`[${screenKey}] Cleaning up scroll listeners`);
          if (scrollViewRef.current) {
            scrollViewRef.current.removeEventListener('scroll', scrollHandlerRef.current);
          }
          window.removeEventListener('scroll', scrollHandlerRef.current);
        }
      };
    }, [screenKey])
  );

  useEffect(() => {
    loadContent();

    // Hide React Navigation header on web, use custom header instead
    if (Platform.OS === 'web') {
      navigation.setOptions({
        headerShown: false,
      });
    } else {
      // Add menu button to header on mobile
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={toggleSidePane}
          >
            <Text style={styles.headerButtonText}>☰</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [fileName, readerType, navigation]);

  const toggleSidePane = () => {
    const toValue = sidePaneVisible ? 0 : 1;
    setSidePaneVisible(!sidePaneVisible);

    Animated.timing(sidePaneAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const scrollToSection = (sectionId: number) => {
    // Find the index of the first item in this section
    const sectionIndex = content.findIndex(item => item.belongsToSection === sectionId);

    if (sectionIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: sectionIndex,
        animated: true,
      });
      toggleSidePane(); // Close pane after navigation
    }
  };

  const getSectionHeaders = () => {
    const sections: { id: number; title: string }[] = [];
    const seenSections = new Set<number>();

    content.forEach(item => {
      if (item.isCollapsibleSection && item.belongsToSection !== null && !seenSections.has(item.belongsToSection)) {
        seenSections.add(item.belongsToSection);
        sections.push({
          id: item.belongsToSection,
          title: item.english || item.arabic || item.coptic || `Section ${item.belongsToSection}`,
        });
      }
    });

    return sections;
  };

  useEffect(() => {
    const handleSettingsChange = () => {
      if (xmlParser) {
        const visibleContent = xmlParser.getVisibleContent();
        setContent(visibleContent);
      }
      // Force re-render to pick up language and other settings changes
      setSettingsVersion(prev => prev + 1);
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
      // Parse the linkPath to extract readerType and fileName
      // Example: "readings/Chanted Psalm" -> readerType: "readings", fileName: "Chanted Psalm"
      const pathComponents = item.linkPath.split('/');

      let linkedReaderType = readerType; // Default to current readerType
      let linkedFileName = item.linkPath;

      if (pathComponents.length >= 2) {
        // First component is the reader type (e.g., "readings", "veneration")
        linkedReaderType = pathComponents[0];
        // Rest of the path is the file name
        linkedFileName = pathComponents.slice(1).join('/');
      } else {
        // No slash, just a file name - use current readerType
        linkedFileName = item.linkPath;
      }

      // Use the LinkDocument's language text as title if available, otherwise use fileName
      const displayTitle = item.english || item.arabic || linkedFileName;

      navigation.push('ReadContent', {
        fileName: linkedFileName,
        title: displayTitle,
        readerType: linkedReaderType
      });
    }
  };

  const renderContentItem = ({ item, index }: { item: CopticContent; index: number }) => {
    const itemStyle = getItemStyle(item);
    const textContent = getDisplayText(item);
    const enabledLangs = settings.enabledLanguages;

    if (item.type === 'LinkDocument') {
      // Use the LinkDocument's language text as the display text
      const displayText = item.english || item.arabic || item.coptic || 'Link Document';

      return (
        <TouchableOpacity
          style={[styles.contentItem, styles.linkDocumentButton]}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.linkDocumentContent}>
            <Text style={[styles.linkDocumentText, itemStyle.text]}>
              {displayText}
            </Text>
            <Text style={styles.linkDocumentArrow}>›</Text>
          </View>
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
        <View
          style={[styles.contentItem, itemStyle.container]}
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
        </View>
      );
    }

    // Single language mode
    const isArabicOnly = enabledLangs.length === 1 && enabledLangs.includes('Arabic');
    const isCopticOnly = enabledLangs.length === 1 && enabledLangs.includes('Coptic');

    return (
      <View
        style={[styles.contentItem, itemStyle.container]}
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
      </View>
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
          showSettings={false}
          onMenuPress={toggleSidePane}
        />
      )}
      <FlatList
        ref={flatListRef}
        testID="flat-list"
        data={content}
        renderItem={renderContentItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={null}
        onScroll={(event) => {
          const yOffset = event.nativeEvent.contentOffset.y;
          scrollPositions.set(screenKey, yOffset);
          console.log(`[${screenKey}] NATIVE Scroll position saved:`, yOffset);
        }}
        scrollEventThrottle={100}
      />

      {/* Side Pane */}
      {sidePaneVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleSidePane}
        />
      )}
      <Animated.View
        style={[
          styles.sidePane,
          {
            transform: [
              {
                translateX: sidePaneAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.sidePaneHeader}>
          <Text style={styles.sidePaneTitle}>Contents</Text>
          <TouchableOpacity onPress={toggleSidePane} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.sidePaneContent}>
          {getSectionHeaders().map((section) => (
            <TouchableOpacity
              key={section.id}
              style={styles.sectionItem}
              onPress={() => scrollToSection(section.id)}
            >
              <Text style={styles.sectionItemText}>{section.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sidePaneFooter}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              toggleSidePane();
              navigation.navigate('Settings');
            }}
          >
            <Text style={styles.settingsButtonText}>⚙ Settings</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    userSelect: 'text',
    WebkitUserSelect: 'text',
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
    userSelect: 'text',
    WebkitUserSelect: 'text',
  },
  contentItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
    userSelect: 'text',
    WebkitUserSelect: 'text',
  },
  contentText: {
    lineHeight: 22,
    userSelect: 'text',
    WebkitUserSelect: 'text',
    cursor: 'text',
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    userSelect: 'text',
    WebkitUserSelect: 'text',
  },
  languageColumn: {
    flex: 1,
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    userSelect: 'text',
    WebkitUserSelect: 'text',
  },
  headerButton: {
    paddingHorizontal: 15,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  linkDocumentButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.4)',
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  linkDocumentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkDocumentText: {
    flex: 1,
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    userSelect: 'text',
    WebkitUserSelect: 'text',
  },
  linkDocumentArrow: {
    color: '#007AFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
    ...(Platform.OS === 'web' && {
      position: 'fixed' as any,
      height: '100vh',
    }),
  },
  sidePane: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#1C1C1E',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'column',
    ...(Platform.OS === 'web' && {
      position: 'fixed' as any,
      height: '100vh',
    }),
  },
  sidePaneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidePaneTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
  },
  sidePaneContent: {
    flex: 1,
  },
  sectionItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  sidePaneFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
  },
  settingsButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
