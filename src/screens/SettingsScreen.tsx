import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';

import { RootStackParamList, LiturgicalInfo, CopticLanguage, ColorTheme, SilentRoleStyle } from '@/types';
import { CopticBookSettings } from '@/services/CopticBookSettings';
import { FixedHeader } from '@/components/FixedHeader';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [liturgicalInfo, setLiturgicalInfo] = useState<LiturgicalInfo>({
    copticDate: '',
    season: '',
    isSimulating: false
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [fontSize, setFontSize] = useState(18);
  const [enabledLanguages, setEnabledLanguages] = useState<CopticLanguage[]>([]);
  const [currentTheme, setCurrentTheme] = useState<ColorTheme | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateInputYear, setDateInputYear] = useState('');
  const [dateInputMonth, setDateInputMonth] = useState('');
  const [dateInputDay, setDateInputDay] = useState('');

  const settings = CopticBookSettings.getInstance();

  useEffect(() => {
    loadSettings();
    updateLiturgicalInfo();

    const handleSettingsChange = () => {
      loadSettings();
      updateLiturgicalInfo();
    };

    settings.addChangeListener(handleSettingsChange);

    return () => {
      settings.removeChangeListener(handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    // Hide React Navigation header on web, use custom header instead
    if (Platform.OS === 'web') {
      navigation.setOptions({
        headerShown: false,
      });
    }
  }, [navigation]);

  const loadSettings = () => {
    setFontSize(settings.fontSize);
    setEnabledLanguages(settings.enabledLanguages);
    setCurrentTheme(settings.currentTheme);
  };

  const updateLiturgicalInfo = () => {
    const info = settings.getCurrentLiturgicalInfo();
    setLiturgicalInfo(info);
    
    if (info.isSimulating && settings.simulatedDate) {
      setSelectedDate(settings.simulatedDate);
    } else {
      setSelectedDate(new Date());
    }
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(12, Math.min(36, fontSize + delta));
    setFontSize(newSize);
    settings.fontSize = newSize;
  };

  const handleThemePress = () => {
    const themes = settings.availableThemes;
    Alert.alert(
      'Color Theme',
      'Select a color theme',
      themes.map(theme => ({
        text: theme.name,
        onPress: () => {
          settings.currentTheme = theme;
        },
      })).concat([{ text: 'Cancel', style: 'cancel' }])
    );
  };

  const handleDateHeaderPress = () => {
    handleChangeDatePress();
  };

  const handleChangeDatePress = () => {
    // Use current simulated date if available, otherwise use today
    const dateToUse = settings.simulatedDate || new Date();
    setDateInputYear(dateToUse.getFullYear().toString());
    setDateInputMonth((dateToUse.getMonth() + 1).toString().padStart(2, '0'));
    setDateInputDay(dateToUse.getDate().toString().padStart(2, '0'));
    setShowDateModal(true);
  };

  const handleDateModalConfirm = () => {
    try {
      const year = parseInt(dateInputYear);
      const month = parseInt(dateInputMonth) - 1; // Month is 0-indexed
      const day = parseInt(dateInputDay);

      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        Alert.alert('Error', 'Please enter valid numbers');
        return;
      }

      if (month < 0 || month > 11) {
        Alert.alert('Error', 'Month must be between 1 and 12');
        return;
      }

      if (day < 1 || day > 31) {
        Alert.alert('Error', 'Day must be between 1 and 31');
        return;
      }

      const date = new Date(year, month, day);
      if (isNaN(date.getTime())) {
        Alert.alert('Error', 'Invalid date');
        return;
      }

      settings.simulatedDate = date;
      settings.isDateSimulationEnabled = true;
      setShowDateModal(false);
    } catch (error) {
      Alert.alert('Error', 'Invalid date format');
    }
  };

  const handleDateModalCancel = () => {
    setShowDateModal(false);
  };

  const handleUseTodayPress = () => {
    settings.isDateSimulationEnabled = false;
    settings.simulatedDate = undefined;
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <FixedHeader
          title="Settings"
          navigation={navigation}
          showBack={true}
          showSettings={false}
        />
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date and Season Header */}
        <TouchableOpacity style={styles.dateSeasonContainer} onPress={handleDateHeaderPress}>
          <Text style={styles.copticDateLabel}>{liturgicalInfo.copticDate}</Text>
          <Text style={styles.seasonLabel}>{liturgicalInfo.season}</Text>
          <Text style={[
            styles.simulationIndicator,
            { color: liturgicalInfo.isSimulating ? '#FF9900' : '#33CC33' }
          ]}>
            {liturgicalInfo.isSimulating ? '📅 Custom Date' : 'Live'}
          </Text>
        </TouchableOpacity>

        {/* Display Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>

          <View style={styles.fontSizeContainer}>
            <Text style={styles.settingLabel}>Font Size</Text>
            <View style={styles.fontSizeControls}>
              <TouchableOpacity
                style={styles.fontSizeButton}
                onPress={() => handleFontSizeChange(-2)}
              >
                <Text style={styles.fontSizeButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.fontSizeValue}>{fontSize} pt</Text>
              <TouchableOpacity
                style={styles.fontSizeButton}
                onPress={() => handleFontSizeChange(2)}
              >
                <Text style={styles.fontSizeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Language Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>

          <View style={styles.languageSwitchContainer}>
            <Text style={styles.settingLabel}>Enabled Languages</Text>
            {Object.values(CopticLanguage).map((language) => (
              <View key={language} style={styles.languageSwitchRow}>
                <Text style={styles.languageSwitchLabel}>{language}</Text>
                <Switch
                  value={enabledLanguages.includes(language)}
                  onValueChange={() => settings.toggleLanguage(language)}
                  trackColor={{ false: '#333333', true: '#007AFF' }}
                  thumbColor={enabledLanguages.includes(language) ? '#FFFFFF' : '#666666'}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Appearance Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <TouchableOpacity style={styles.settingRow} onPress={handleThemePress}>
            <Text style={styles.settingLabel}>Color Theme</Text>
            <View style={styles.settingValueContainer}>
              <Text style={styles.settingValue}>{currentTheme?.name}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Preview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewContainer}>
            <Text style={[styles.previewText, { fontSize, color: '#FFFFFF' }]}>
              {enabledLanguages.includes(CopticLanguage.English) && 'Our Father who art in heaven\n'}
              {enabledLanguages.includes(CopticLanguage.Coptic) && 'Ⲡⲉⲛⲓⲱⲧ ⲉⲧ ϧⲉⲛ ⲛⲓⲫⲏⲟⲩⲓ\n'}
              {enabledLanguages.includes(CopticLanguage.Arabic) && 'أَبَانَا الذِي فِي السَّمَاوَاتِ'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDateModalCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set Custom Date</Text>

            <View style={styles.dateInputContainer}>
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateInputLabel}>Year</Text>
                <TextInput
                  style={styles.dateInput}
                  value={dateInputYear}
                  onChangeText={setDateInputYear}
                  keyboardType="number-pad"
                  placeholder="2024"
                  placeholderTextColor="#666666"
                  maxLength={4}
                />
              </View>

              <View style={styles.dateInputGroup}>
                <Text style={styles.dateInputLabel}>Month</Text>
                <TextInput
                  style={styles.dateInput}
                  value={dateInputMonth}
                  onChangeText={setDateInputMonth}
                  keyboardType="number-pad"
                  placeholder="12"
                  placeholderTextColor="#666666"
                  maxLength={2}
                />
              </View>

              <View style={styles.dateInputGroup}>
                <Text style={styles.dateInputLabel}>Day</Text>
                <TextInput
                  style={styles.dateInput}
                  value={dateInputDay}
                  onChangeText={setDateInputDay}
                  keyboardType="number-pad"
                  placeholder="25"
                  placeholderTextColor="#666666"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  handleUseTodayPress();
                  setShowDateModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Use Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleDateModalCancel}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleDateModalConfirm}
              >
                <Text style={styles.modalButtonText}>Set Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  dateSeasonContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  copticDateLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  seasonLabel: {
    fontSize: 16,
    fontWeight: '300',
    color: '#CCAA33',
    textAlign: 'center',
    marginBottom: 8,
  },
  simulationIndicator: {
    fontSize: 14,
    fontWeight: '300',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    marginHorizontal: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  settingLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  settingValue: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'right',
    marginRight: 8,
    flexShrink: 1,
  },
  chevron: {
    fontSize: 18,
    color: '#666666',
  },
  fontSizeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 20,
  },
  fontSizeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  fontSizeValue: {
    fontSize: 18,
    color: '#FFFFFF',
    minWidth: 60,
    textAlign: 'center',
  },
  languageSwitchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  languageSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  languageSwitchLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  previewContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  previewText: {
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    textAlign: 'center',
  },
  dateInput: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#444444',
  },
  modalButtonCancel: {
    backgroundColor: '#333333',
  },
  modalButtonConfirm: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});