// Core data types for the Coptic Book app

export enum CopticLanguage {
  English = 'English',
  Arabic = 'Arabic',
  Coptic = 'Coptic'
}

export enum SilentRoleStyle {
  Hidden = 'hidden',
  Grayed = 'grayed',
  Normal = 'normal'
}

export interface CopticContent {
  id: number;
  section?: number;
  description?: string;
  type: string;
  english?: string;
  arabic?: string;
  coptic?: string;
  
  // Section-specific properties
  isCollapsibleSection: boolean;
  isExpanded: boolean;
  sectionTitle?: string;
  belongsToSection?: number; // Track which collapsible section this content belongs to
  
  // Role-specific properties
  roleID?: string; // The role this content belongs to (Priest, Deacon, People, Reader, Introduction)
  isRoleHeader: boolean; // Whether this is a role header cell
  isSilentRole: boolean; // Whether this role has silent="true"
  
  // LinkDocument-specific properties
  linkPath?: string; // The path to navigate to when link is clicked
  useHistory: boolean; // Whether to add this navigation to history stack
  
  // Text-specific properties
  textType?: string; // Text type (e.g., "Refrain")
  
  // Mixed-font formatting (for span tags)
  hasAttributedText: boolean; // Whether this content contains span formatting
  englishAttributed?: string; // HTML-formatted English text
  arabicAttributed?: string; // HTML-formatted Arabic text
  copticAttributed?: string; // HTML-formatted Coptic text
}

export interface ColorTheme {
  name: string;
  colors: {
    [key: string]: string;
  };
}

export interface LiturgicalInfo {
  copticDate: string;
  season: string;
  isSimulating: boolean;
}

// Font and styling types
export interface FontConfig {
  size: number;
  family: string;
  weight?: 'normal' | 'bold' | 'light' | 'thin';
}

// Settings configuration
export interface AppSettings {
  fontSize: number;
  primaryLanguage: CopticLanguage;
  enabledLanguages: CopticLanguage[];
  currentTheme: ColorTheme;
  silentRoleStyle: SilentRoleStyle;
  isDateSimulationEnabled: boolean;
  simulatedDate?: Date;
}

// Navigation types
export type RootStackParamList = {
  MainMenu: undefined;
  Bible: undefined;
  BibleChapters: {
    bookName: string;
    chapterCount: number;
  };
  BibleChapterReader: {
    bookName: string;
    chapter: number;
  };
  Agpeya: undefined;
  Liturgies: undefined;
  Antiphonary: undefined;
  Baptism: undefined;
  Clergy: undefined;
  Consecrations: undefined;
  Crowning: undefined;
  Funeral: undefined;
  Lakkan: undefined;
  Melodies: undefined;
  Papal: undefined;
  Pascha: undefined;
  Praises: undefined;
  Prostration: undefined;
  RaisingOfIncense: undefined;
  Readings: undefined;
  Unction: undefined;
  Veneration: undefined;
  Settings: undefined;
  ReadContent: {
    fileName: string;
    title: string;
    readerType: string;
  };
};

// Bible-specific types
export interface Book {
  id: number;
  name: string;
  chapters: number;
}

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  english?: string;
  arabic?: string;
  coptic?: string;
}

// XML Parser types
export interface ParsedXMLContent {
  content: CopticContent[];
  collapsibleSections: { [key: number]: boolean };
  sectionTitles: { [key: number]: string };
}

export interface HTMLFormatting {
  italic?: boolean;
  underline?: boolean;
  superscript?: boolean;
  coptic?: boolean;
}

// Season and liturgical calendar types
export interface SeasonCondition {
  id: string;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface CopticCalendarDate {
  copticDay: number;
  copticMonth: string;
  copticYear: number;
  gregorianDate: Date;
}