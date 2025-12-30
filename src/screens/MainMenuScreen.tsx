import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList, LiturgicalInfo } from '@/types';
import { CopticBookSettings } from '@/services/CopticBookSettings';
import { DatabaseService } from '@/services/DatabaseService';
import { MainMenuHeader } from '@/components/MainMenuHeader';

type MainMenuScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainMenu'>;

interface Props {
  navigation: MainMenuScreenNavigationProp;
}

export const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
  const [liturgicalInfo, setLiturgicalInfo] = useState<LiturgicalInfo>({
    copticDate: '',
    season: '',
    isSimulating: false
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateInputYear, setDateInputYear] = useState('');
  const [dateInputMonth, setDateInputMonth] = useState('');
  const [dateInputDay, setDateInputDay] = useState('');
  const [showOtherMenu, setShowOtherMenu] = useState(false);

  const settings = CopticBookSettings.getInstance();
  const databaseService = DatabaseService.getInstance();

  const mainMenuItems = [
    { title: 'Bible', screen: 'Bible' as keyof RootStackParamList },
    { title: 'Agpeya', screen: 'Agpeya' as keyof RootStackParamList },
    { title: 'Liturgies', screen: 'Liturgies' as keyof RootStackParamList },
    { title: 'Readings', screen: 'Readings' as keyof RootStackParamList },
    { title: 'Psalmody', screen: 'Praises' as keyof RootStackParamList },
  ];

  const otherMenuItems = [
    { title: 'Antiphonary', screen: 'Antiphonary' as keyof RootStackParamList },
    { title: 'Baptism', screen: 'Baptism' as keyof RootStackParamList },
    { title: 'Clergy', screen: 'Clergy' as keyof RootStackParamList },
    { title: 'Consecrations', screen: 'Consecrations' as keyof RootStackParamList },
    { title: 'Crowning', screen: 'Crowning' as keyof RootStackParamList },
    { title: 'Funeral', screen: 'Funeral' as keyof RootStackParamList },
    { title: 'Lakkan', screen: 'Lakkan' as keyof RootStackParamList },
    { title: 'Melodies', screen: 'Melodies' as keyof RootStackParamList },
    { title: 'Papal', screen: 'Papal' as keyof RootStackParamList },
    { title: 'Pascha', screen: 'Pascha' as keyof RootStackParamList },
    { title: 'Prostration', screen: 'Prostration' as keyof RootStackParamList },
    { title: 'Raising of Incense', screen: 'RaisingOfIncense' as keyof RootStackParamList },
    { title: 'Unction', screen: 'Unction' as keyof RootStackParamList },
    { title: 'Veneration', screen: 'Veneration' as keyof RootStackParamList },
  ];

  useEffect(() => {
    initializeApp();
    updateLiturgicalInfo();
    
    const handleSettingsChange = () => {
      updateLiturgicalInfo();
    };

    settings.addChangeListener(handleSettingsChange);

    return () => {
      settings.removeChangeListener(handleSettingsChange);
    };
  }, []);

  const initializeApp = async () => {
    try {
      await settings.initialize();
      await databaseService.initialize();
      
      // Test database connectivity
      console.log('Testing database connectivity...');
      const books = await databaseService.getBibleBooks();
      console.log(`Database test: Found ${books.length} Bible books`);
      
    } catch (error) {
      console.error('Error initializing app:', error);
    }
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

  const handleMenuItemPress = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };

  const handleOtherPress = () => {
    setShowOtherMenu(true);
  };

  const handleBackPress = () => {
    setShowOtherMenu(false);
  };

  const handleDateContainerPress = () => {
    // Use current simulated date if available, otherwise use today
    const dateToUse = settings.simulatedDate || new Date();
    setDateInputYear(dateToUse.getFullYear().toString());
    setDateInputMonth((dateToUse.getMonth() + 1).toString().padStart(2, '0'));
    setDateInputDay(dateToUse.getDate().toString().padStart(2, '0'));
    setShowDatePicker(true);
  };

  const handleDateConfirm = () => {
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
      setShowDatePicker(false);
      updateLiturgicalInfo();
    } catch (error) {
      Alert.alert('Error', 'Invalid date format');
    }
  };

  const handleUseTodayPress = () => {
    settings.isDateSimulationEnabled = false;
    settings.simulatedDate = undefined;
    setShowDatePicker(false);
    updateLiturgicalInfo();
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const renderMenuButton = (item: { title: string; screen: keyof RootStackParamList }, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.menuButton}
      onPress={() => handleMenuItemPress(item.screen)}
      activeOpacity={0.7}
    >
      <Text style={styles.menuButtonText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'web' && (
        <MainMenuHeader
          liturgicalInfo={liturgicalInfo}
          onDatePress={handleDateContainerPress}
        />
      )}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS === 'web' && styles.scrollContentWeb
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Show title and date only on mobile */}
        {Platform.OS !== 'web' && (
          <>
            {/* Title */}
            <Text style={styles.title}>CopticBook</Text>

            {/* Date and Season Display */}
            <TouchableOpacity style={styles.dateSeasonContainer} onPress={handleDateContainerPress}>
              <Text style={styles.copticDateLabel}>{liturgicalInfo.copticDate}</Text>
              <Text style={styles.seasonLabel}>{liturgicalInfo.season}</Text>
              <Text style={[
                styles.simulationIndicator,
                { color: liturgicalInfo.isSimulating ? '#FF9900' : '#33CC33' }
              ]}>
                {liturgicalInfo.isSimulating ? '📅 Custom Date' : 'Live'}
              </Text>
            </TouchableOpacity>

            {/* Separator */}
            <View style={styles.separator} />
          </>
        )}

        {/* Menu Buttons */}
        <View style={styles.menuContainer}>
          {showOtherMenu ? (
            <>
              {otherMenuItems.map((item, index) => renderMenuButton(item, index))}
              <TouchableOpacity
                style={[styles.menuButton, styles.backButton]}
                onPress={handleBackPress}
                activeOpacity={0.7}
              >
                <Text style={styles.menuButtonText}>Back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {mainMenuItems.map((item, index) => renderMenuButton(item, index))}
              <TouchableOpacity
                style={styles.menuButton}
                onPress={handleOtherPress}
                activeOpacity={0.7}
              >
                <Text style={styles.menuButtonText}>More...</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuButton, styles.settingsButton]}
                onPress={() => handleMenuItemPress('Settings')}
                activeOpacity={0.7}
              >
                <Text style={styles.menuButtonText}>Settings</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDateCancel}
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
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.modalButtonText}>Use Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleDateCancel}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleDateConfirm}
              >
                <Text style={styles.modalButtonText}>Set Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  scrollContentWeb: {
    paddingTop: 10, // Reduced padding on web since header is separate
  },
  title: {
    fontSize: 52,
    fontWeight: '100',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System', // Will need to be updated with custom font
  },
  dateSeasonContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginBottom: 20,
  },
  copticDateLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  seasonLabel: {
    fontSize: 16,
    fontWeight: '300',
    color: '#CCAA33',
    textAlign: 'center',
    marginBottom: 4,
  },
  simulationIndicator: {
    fontSize: 14,
    fontWeight: '300',
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.33)',
    marginHorizontal: 0,
    marginBottom: 30,
  },
  menuContainer: {
    gap: 8,
  },
  menuButton: {
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
  menuButtonText: {
    fontSize: 28,
    fontWeight: '100',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  settingsButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
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