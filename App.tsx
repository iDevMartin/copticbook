import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';

import { RootStackParamList } from '@/types';
import { CopticBookSettings } from '@/services/CopticBookSettings';
import { MainMenuScreen } from '@/screens/MainMenuScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { ReadContentScreen } from '@/screens/ReadContentScreen';
import { BibleScreen } from '@/screens/BibleScreen';
import { BibleChaptersScreen } from '@/screens/BibleChaptersScreen';
import { BibleChapterReaderScreen } from '@/screens/BibleChapterReaderScreen';

// Import all the liturgical screen components
import { AgpeyaScreen } from '@/screens/AgpeyaScreen';
import { LiturgiesScreen } from '@/screens/LiturgiesScreen';
import { AntiphonaryScreen } from '@/screens/AntiphonaryScreen';
import { BaptismScreen } from '@/screens/BaptismScreen';
import { ClergyScreen } from '@/screens/ClergyScreen';
import { ConsecrationsScreen } from '@/screens/ConsecrationsScreen';
import { CrowningScreen } from '@/screens/CrowningScreen';
import { FuneralScreen } from '@/screens/FuneralScreen';
import { LakkanScreen } from '@/screens/LakkanScreen';
import { MelodiesScreen } from '@/screens/MelodiesScreen';
import { PapalScreen } from '@/screens/PapalScreen';
import { PaschaScreen } from '@/screens/PaschaScreen';
import { PraisesScreen } from '@/screens/PraisesScreen';
import { ProstrationScreen } from '@/screens/ProstrationScreen';
import { RaisingOfIncenseScreen } from '@/screens/RaisingOfIncenseScreen';
import { ReadingsScreen } from '@/screens/ReadingsScreen';
import { UnctionScreen } from '@/screens/UnctionScreen';
import { VenerationScreen } from '@/screens/VenerationScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load Coptic fonts for web
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          // In development, use static server on port 8082. In production, use relative path.
          const isDevelopment = window.location.hostname === 'localhost';
          const baseUrl = isDevelopment ? 'http://localhost:8082' : '';

          const style = document.createElement('style');
          style.textContent = `
            @font-face {
              font-family: 'Coptic';
              src: url('${baseUrl}/assets/fonts/Coptic.ttf') format('truetype');
              font-weight: normal;
              font-style: normal;
            }
            @font-face {
              font-family: 'CS New Athanasius';
              src: url('${baseUrl}/assets/fonts/CS New Athanasius.ttf') format('truetype');
              font-weight: normal;
              font-style: normal;
            }
          `;
          document.head.appendChild(style);
        }

        // Initialize settings from storage
        const settings = CopticBookSettings.getInstance();
        await settings.initialize();
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsReady(true); // Continue with defaults even if loading fails
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#000000" />
        <Stack.Navigator
          initialRouteName="MainMenu"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#000000',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            cardStyle: {
              backgroundColor: '#000000',
            },
          }}
        >
          <Stack.Screen 
            name="MainMenu" 
            component={MainMenuScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
          <Stack.Screen 
            name="ReadContent" 
            component={ReadContentScreen}
            options={({ route }) => ({ title: route.params.title })}
          />
          <Stack.Screen
            name="Bible"
            component={BibleScreen}
            options={{ title: 'Bible' }}
          />
          <Stack.Screen
            name="BibleChapters"
            component={BibleChaptersScreen}
            options={({ route }) => ({ title: route.params.bookName })}
          />
          <Stack.Screen
            name="BibleChapterReader"
            component={BibleChapterReaderScreen}
            options={({ route }) => ({ title: `${route.params.bookName} ${route.params.chapter}` })}
          />
          <Stack.Screen 
            name="Agpeya" 
            component={AgpeyaScreen}
            options={{ title: 'Agpeya' }}
          />
          <Stack.Screen 
            name="Liturgies" 
            component={LiturgiesScreen}
            options={{ title: 'Liturgies' }}
          />
          <Stack.Screen 
            name="Antiphonary" 
            component={AntiphonaryScreen}
            options={{ title: 'Antiphonary' }}
          />
          <Stack.Screen 
            name="Baptism" 
            component={BaptismScreen}
            options={{ title: 'Baptism' }}
          />
          <Stack.Screen 
            name="Clergy" 
            component={ClergyScreen}
            options={{ title: 'Clergy' }}
          />
          <Stack.Screen 
            name="Consecrations" 
            component={ConsecrationsScreen}
            options={{ title: 'Consecrations' }}
          />
          <Stack.Screen 
            name="Crowning" 
            component={CrowningScreen}
            options={{ title: 'Crowning' }}
          />
          <Stack.Screen 
            name="Funeral" 
            component={FuneralScreen}
            options={{ title: 'Funeral' }}
          />
          <Stack.Screen 
            name="Lakkan" 
            component={LakkanScreen}
            options={{ title: 'Lakkan' }}
          />
          <Stack.Screen 
            name="Melodies" 
            component={MelodiesScreen}
            options={{ title: 'Melodies' }}
          />
          <Stack.Screen 
            name="Papal" 
            component={PapalScreen}
            options={{ title: 'Papal' }}
          />
          <Stack.Screen 
            name="Pascha" 
            component={PaschaScreen}
            options={{ title: 'Pascha' }}
          />
          <Stack.Screen 
            name="Praises" 
            component={PraisesScreen}
            options={{ title: 'Praises' }}
          />
          <Stack.Screen 
            name="Prostration" 
            component={ProstrationScreen}
            options={{ title: 'Prostration' }}
          />
          <Stack.Screen 
            name="RaisingOfIncense" 
            component={RaisingOfIncenseScreen}
            options={{ title: 'Raising of Incense' }}
          />
          <Stack.Screen 
            name="Readings" 
            component={ReadingsScreen}
            options={{ title: 'Readings' }}
          />
          <Stack.Screen 
            name="Unction" 
            component={UnctionScreen}
            options={{ title: 'Unction' }}
          />
          <Stack.Screen 
            name="Veneration" 
            component={VenerationScreen}
            options={{ title: 'Veneration' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});