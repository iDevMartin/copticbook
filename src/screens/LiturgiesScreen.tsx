import React, { useLayoutEffect, useState } from 'react';
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

type LiturgiesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Liturgies'>;

interface Props {
  navigation: LiturgiesScreenNavigationProp;
}

type MenuItem = {
  title: string;
  path?: string;
  submenu?: string;
};

const mainMenuItems: MenuItem[] = [
  { title: 'St. Basil', submenu: 'basil' },
  { title: 'St. Gregory', submenu: 'gregory' },
  { title: 'St. Cyril', submenu: 'cyril' },
  { title: 'Matins', path: 'include/ProcessionOfIncense_Matins' },
  { title: 'Vespers', path: 'include/ProcessionOfIncense_Vespers' },
];

const basilSubmenu: MenuItem[] = [
  { title: 'Offering of the Lamb', path: 'basil/Offering of the Lamb' },
  { title: 'Liturgy of the Word', path: 'basil/Liturgy of the Word' },
  { title: 'Liturgy of the Faithful', path: 'basil/Liturgy of the Faithful' },
  { title: 'Distribution', path: 'basil/Distribution of the Holy Mysteries' },
];

const gregorySubmenu: MenuItem[] = [
  { title: 'Offering of the Lamb', path: 'gregory/Offering of the Lamb' },
  { title: 'Liturgy of the Word', path: 'gregory/Liturgy of the Word' },
  { title: 'Liturgy of the Faithful', path: 'gregory/Liturgy of the Faithful' },
  { title: 'Distribution', path: 'gregory/Distribution of the Holy Mysteries' },
];

const cyrilSubmenu: MenuItem[] = [
  { title: 'Offering of the Lamb', path: 'cyril/Offering of the Lamb' },
  { title: 'Liturgy of the Word', path: 'cyril/Liturgy of the Word' },
  { title: 'Liturgy of the Faithful', path: 'cyril/Liturgy of the Faithful' },
  { title: 'Distribution', path: 'cyril/Distribution of the Holy Mysteries' },
];

export const LiturgiesScreen: React.FC<Props> = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  useLayoutEffect(() => {
    if (Platform.OS === 'web') {
      navigation.setOptions({
        headerShown: false,
      });
    } else {
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
    }
  }, [navigation]);

  const handleMenuItemPress = (item: MenuItem) => {
    if (item.submenu) {
      // Toggle dropdown
      setExpandedSection(expandedSection === item.submenu ? null : item.submenu);
    } else if (item.path) {
      // Navigate to content
      navigation.navigate('ReadContent', {
        fileName: item.path,
        title: item.title,
        readerType: 'liturgies',
      });
    }
  };

  const getSubmenuItems = (submenuKey: string): MenuItem[] => {
    switch (submenuKey) {
      case 'basil':
        return basilSubmenu;
      case 'gregory':
        return gregorySubmenu;
      case 'cyril':
        return cyrilSubmenu;
      default:
        return [];
    }
  };

  const renderMenuItem = (item: MenuItem, isSubmenuItem: boolean = false) => {
    const isExpanded = expandedSection === item.submenu;
    const hasSubmenu = !!item.submenu;

    return (
      <View key={item.title}>
        <TouchableOpacity
          style={[
            styles.fileButton,
            isSubmenuItem && styles.submenuItem,
          ]}
          onPress={() => handleMenuItemPress(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.fileButtonText}>
            {hasSubmenu && (isExpanded ? '▼ ' : '▶ ')}
            {item.title}
          </Text>
        </TouchableOpacity>

        {hasSubmenu && isExpanded && (
          <View style={styles.submenuContainer}>
            {getSubmenuItems(item.submenu!).map((subItem) =>
              renderMenuItem(subItem, true)
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'web' && (
        <FixedHeader
          title="Liturgies"
          navigation={navigation}
          showBack={true}
          showSettings={true}
        />
      )}
      <FlatList
        data={mainMenuItems}
        renderItem={({ item }) => renderMenuItem(item, false)}
        keyExtractor={(item) => item.title}
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
  submenuContainer: {
    marginLeft: 16,
    marginTop: 4,
  },
  submenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 4,
  },
});