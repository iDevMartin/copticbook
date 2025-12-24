import AsyncStorage from '@react-native-async-storage/async-storage';
import { CopticLanguage, SilentRoleStyle, ColorTheme, AppSettings, LiturgicalInfo } from '@/types';
import { CopticLiturgicalCalendar } from './CopticLiturgicalCalendar';

// Default color themes
const defaultThemes: ColorTheme[] = [
  {
    name: 'Dark',
    colors: {
      background: '#000000',
      text: '#FFFFFF',
      priest: '#FFD700',
      deacon: '#87CEEB',
      people: '#FFFFFF',
      reader: '#90EE90',
      introduction: '#DDA0DD',
      title: '#FFD700',
      comment: '#C0C0C0',
      bibleReference: '#FFA500',
      roleHeader: '#FFD700',
      verseNumber: '#FFD700'
    }
  },
  {
    name: 'Light',
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      priest: '#B8860B',
      deacon: '#4682B4',
      people: '#000000',
      reader: '#006400',
      introduction: '#8B008B',
      title: '#B8860B',
      comment: '#696969',
      bibleReference: '#FF4500',
      roleHeader: '#B8860B',
      verseNumber: '#B8860B'
    }
  }
];

export class CopticBookSettings {
  private static instance: CopticBookSettings;
  private settings: AppSettings;
  private liturgicalCalendar: CopticLiturgicalCalendar;
  private listeners: Array<() => void> = [];

  private constructor() {
    this.liturgicalCalendar = CopticLiturgicalCalendar.getInstance();
    // Default settings
    this.settings = {
      fontSize: 18,
      primaryLanguage: CopticLanguage.English,
      enabledLanguages: [CopticLanguage.English, CopticLanguage.Arabic, CopticLanguage.Coptic],
      currentTheme: defaultThemes[0], // Dark theme by default
      silentRoleStyle: SilentRoleStyle.Normal,
      isDateSimulationEnabled: false,
      simulatedDate: undefined
    };
  }

  public static getInstance(): CopticBookSettings {
    if (!CopticBookSettings.instance) {
      CopticBookSettings.instance = new CopticBookSettings();
    }
    return CopticBookSettings.instance;
  }

  // Async initialization to load settings from storage
  public async initialize(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem('copticBookSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        this.settings = {
          ...this.settings,
          ...parsed,
          simulatedDate: parsed.simulatedDate ? new Date(parsed.simulatedDate) : undefined
        };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('copticBookSettings', JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Settings getters and setters
  public get fontSize(): number {
    return this.settings.fontSize;
  }

  public set fontSize(value: number) {
    this.settings.fontSize = Math.max(12, Math.min(36, value));
    this.saveSettings();
  }

  public get primaryLanguage(): CopticLanguage {
    return this.settings.primaryLanguage;
  }

  public set primaryLanguage(value: CopticLanguage) {
    this.settings.primaryLanguage = value;
    this.saveSettings();
  }

  public get enabledLanguages(): CopticLanguage[] {
    return this.settings.enabledLanguages;
  }

  public toggleLanguage(language: CopticLanguage): void {
    const index = this.settings.enabledLanguages.indexOf(language);
    if (index > -1) {
      // Don't allow removing all languages
      if (this.settings.enabledLanguages.length > 1) {
        this.settings.enabledLanguages.splice(index, 1);
      }
    } else {
      this.settings.enabledLanguages.push(language);
    }
    this.saveSettings();
  }

  public isLanguageEnabled(language: CopticLanguage): boolean {
    return this.settings.enabledLanguages.includes(language);
  }

  public get currentTheme(): ColorTheme {
    return this.settings.currentTheme;
  }

  public set currentTheme(value: ColorTheme) {
    this.settings.currentTheme = value;
    this.saveSettings();
  }

  public get availableThemes(): ColorTheme[] {
    return defaultThemes;
  }

  public get silentRoleStyle(): SilentRoleStyle {
    return this.settings.silentRoleStyle;
  }

  public set silentRoleStyle(value: SilentRoleStyle) {
    this.settings.silentRoleStyle = value;
    this.saveSettings();
  }

  public get isDateSimulationEnabled(): boolean {
    return this.settings.isDateSimulationEnabled;
  }

  public set isDateSimulationEnabled(value: boolean) {
    this.settings.isDateSimulationEnabled = value;
    if (!value) {
      this.settings.simulatedDate = undefined;
    }
    this.saveSettings();
  }

  public get simulatedDate(): Date | undefined {
    return this.settings.simulatedDate;
  }

  public set simulatedDate(value: Date | undefined) {
    this.settings.simulatedDate = value;
    this.settings.isDateSimulationEnabled = value !== undefined;
    this.saveSettings();
  }

  // Helper methods for UI styling
  public colorFor(contentType: string, role?: string, isSilent?: boolean): string {
    const theme = this.settings.currentTheme;
    
    if (role && !isSilent) {
      const roleKey = role.toLowerCase();
      return theme.colors[roleKey] || theme.colors.text;
    }
    
    if (isSilent && this.settings.silentRoleStyle === SilentRoleStyle.Grayed) {
      return '#808080'; // Gray color for silent roles
    }
    
    const typeKey = contentType.toLowerCase();
    return theme.colors[typeKey] || theme.colors.text;
  }

  public backgroundColorFor(role?: string, isSilent?: boolean): string {
    // Most content uses transparent background, but some roles might have special backgrounds
    return this.settings.currentTheme.colors.background;
  }

  public fontFor(type: string, textType?: string, isSilent?: boolean): { size: number; weight: string } {
    let weight = 'normal';
    let sizeMultiplier = 1;

    switch (type) {
      case 'Title':
        weight = 'bold';
        sizeMultiplier = 1.2;
        break;
      case 'RoleHeader':
        weight = 'bold';
        break;
      case 'Text':
        if (textType?.toLowerCase() === 'refrain') {
          weight = 'bold';
        }
        break;
      case 'Comment':
        sizeMultiplier = 0.9;
        break;
    }

    if (isSilent && this.settings.silentRoleStyle === SilentRoleStyle.Grayed) {
      sizeMultiplier *= 0.9;
    }

    return {
      size: this.settings.fontSize * sizeMultiplier,
      weight
    };
  }

  // Liturgical calendar integration
  public getCurrentLiturgicalInfo(): LiturgicalInfo {
    const currentDate = this.settings.isDateSimulationEnabled && this.settings.simulatedDate
      ? this.settings.simulatedDate
      : new Date();

    const copticDate = this.liturgicalCalendar.formatCopticDate(currentDate);
    const season = this.liturgicalCalendar.getCurrentSeason(currentDate);

    return {
      copticDate,
      season,
      isSimulating: this.settings.isDateSimulationEnabled && this.settings.simulatedDate !== undefined
    };
  }

  // Observer pattern for settings changes
  public addChangeListener(listener: () => void): void {
    this.listeners.push(listener);
  }

  public removeChangeListener(listener: () => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}