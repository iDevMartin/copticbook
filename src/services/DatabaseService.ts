import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CopticContent, BibleVerse } from '@/types';
import initSqlJs, { Database } from 'sql.js';

export class DatabaseService {
  private static instance: DatabaseService;
  private isWeb: boolean = Platform.OS === 'web';
  private db: Database | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing database service...');

      if (this.isWeb) {
        // Load sql.js wasm file
        const SQL = await initSqlJs({
          locateFile: (file) => `https://sql.js.org/dist/${file}`
        });

        // Load the database file
        // In development, use static server on port 8082. In production, use relative path.
        const isDevelopment = window.location.hostname === 'localhost';
        const dbUrl = isDevelopment
          ? 'http://localhost:8082/assets/databases/bible_psalms.db'
          : '/assets/databases/bible_psalms.db';
        const response = await fetch(dbUrl);
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        this.db = new SQL.Database(uint8Array);
        console.log('Database loaded successfully');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  public async getBibleReference(reference: string): Promise<CopticContent[]> {
    await this.initialize();

    if (!this.db) {
      return this.getMockBibleReference(reference);
    }

    try {
      // Parse reference like "Genesis 1:1-3" or "Matthew 5:6" or "Psalms 23:1"
      const match = reference.match(/^(\d*\s*\w+)\s+(\d+):(\d+)(?:-(\d+))?$/);
      if (!match) {
        console.warn('Invalid reference format:', reference);
        return this.getMockBibleReference(reference);
      }

      const [, book, chapter, startVerse, endVerse] = match;
      const end = endVerse || startVerse;

      // Use the Bible table for all books including Psalms
      const query = `
        SELECT Verse, English, Arabic, Coptic
        FROM Bible
        WHERE Book = ? AND Chapter = ? AND CAST(Verse AS INTEGER) BETWEEN ? AND ?
        ORDER BY CAST(Verse AS INTEGER)
      `;

      const results = this.db.exec(query, [book, chapter, startVerse, end]);

      if (!results.length || !results[0].values.length) {
        return [];
      }

      return results[0].values.map((row, index) => ({
        id: index + 1,
        section: 1,
        type: 'BibleReference',
        english: row[1] as string,
        arabic: row[2] as string,
        coptic: row[3] as string,
        isCollapsibleSection: false,
        isExpanded: true,
        isRoleHeader: false,
        isSilentRole: false,
        useHistory: true,
        hasAttributedText: false,
        belongsToSection: null,
        roleID: null,
      }));
    } catch (error) {
      console.error('Error fetching Bible reference:', error);
      return this.getMockBibleReference(reference);
    }
  }

  public async getBibleBooks(): Promise<{ name: string; chapters: number }[]> {
    await this.initialize();

    if (!this.db) {
      return this.getMockBibleBooks();
    }

    try {
      const query = `
        SELECT Book as name, MAX(CAST(Chapter AS INTEGER)) as chapters
        FROM Bible
        GROUP BY Book
        ORDER BY _id
      `;

      const results = this.db.exec(query);

      if (!results.length || !results[0].values.length) {
        console.warn('No books found in database, using mock data');
        return this.getMockBibleBooks();
      }

      return results[0].values.map(row => ({
        name: row[0] as string,
        chapters: row[1] as number
      }));
    } catch (error) {
      console.error('Error fetching Bible books:', error);
      return this.getMockBibleBooks();
    }
  }

  public async getBibleChapter(book: string, chapter: number): Promise<BibleVerse[]> {
    await this.initialize();

    if (!this.db) {
      return [{
        book,
        chapter,
        verse: 1,
        english: `This is verse 1 of ${book} chapter ${chapter} (temporary mock data)`,
        arabic: 'هذا نص تجريبي للآية الأولى',
        coptic: 'ⲑⲁⲓ ⲧⲉ ⲟⲩⲙⲉⲧⲟⲩⲱⲓ ⲛ̀ⲟⲩⲧⲉⲭⲛⲟⲥ'
      }];
    }

    try {
      // Use the Bible table for all books including Psalms
      const query = `
        SELECT CAST(Verse AS INTEGER) as verse, English, Arabic, Coptic
        FROM Bible
        WHERE Book = ? AND Chapter = ?
        ORDER BY CAST(Verse AS INTEGER)
      `;

      const results = this.db.exec(query, [book, chapter.toString()]);

      if (!results.length || !results[0].values.length) {
        return [];
      }

      return results[0].values.map(row => ({
        book,
        chapter,
        verse: row[0] as number,
        english: row[1] as string,
        arabic: row[2] as string,
        coptic: row[3] as string
      }));
    } catch (error) {
      console.error('Error fetching Bible chapter:', error);
      return [];
    }
  }

  public async getAgpeyaData(): Promise<any> {
    return { message: 'Agpeya data will be loaded from AsyncStorage' };
  }

  public async closeConnections(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
    console.log('Database connections closed');
  }

  private getMockBibleReference(reference: string): CopticContent[] {
    // Mock data for testing
    return [{
      id: 1,
      section: 1,
      description: `Mock: ${reference}`,
      type: 'BibleReference',
      english: `This is a mock Bible reference for ${reference} (temporary version)`,
      arabic: 'هذا مرجع كتابي وهمي لاختبار النسخة الإلكترونية',
      coptic: 'ⲑⲁⲓ ⲟⲩⲙⲉⲧⲟⲩⲱⲓ ⲛ̀ⲟⲩⲧⲉⲭⲱⲣ ⲙⲉ',
      isCollapsibleSection: false,
      isExpanded: true,
      isRoleHeader: false,
      isSilentRole: false,
      useHistory: true,
      hasAttributedText: false,
      belongsToSection: null,
      roleID: null,
    }];
  }

  private getMockBibleBooks(): { name: string; chapters: number }[] {
    // Old Testament (39 books)
    return [
      // Torah / Pentateuch
      { name: 'Genesis', chapters: 50 },
      { name: 'Exodus', chapters: 40 },
      { name: 'Leviticus', chapters: 27 },
      { name: 'Numbers', chapters: 36 },
      { name: 'Deuteronomy', chapters: 34 },
      // Historical Books
      { name: 'Joshua', chapters: 24 },
      { name: 'Judges', chapters: 21 },
      { name: 'Ruth', chapters: 4 },
      { name: '1 Samuel', chapters: 31 },
      { name: '2 Samuel', chapters: 24 },
      { name: '1 Kings', chapters: 22 },
      { name: '2 Kings', chapters: 25 },
      { name: '1 Chronicles', chapters: 29 },
      { name: '2 Chronicles', chapters: 36 },
      { name: 'Ezra', chapters: 10 },
      { name: 'Nehemiah', chapters: 13 },
      { name: 'Esther', chapters: 10 },
      // Wisdom Books
      { name: 'Job', chapters: 42 },
      { name: 'Psalms', chapters: 150 },
      { name: 'Proverbs', chapters: 31 },
      { name: 'Ecclesiastes', chapters: 12 },
      { name: 'Song of Solomon', chapters: 8 },
      // Major Prophets
      { name: 'Isaiah', chapters: 66 },
      { name: 'Jeremiah', chapters: 52 },
      { name: 'Lamentations', chapters: 5 },
      { name: 'Ezekiel', chapters: 48 },
      { name: 'Daniel', chapters: 12 },
      // Minor Prophets
      { name: 'Hosea', chapters: 14 },
      { name: 'Joel', chapters: 3 },
      { name: 'Amos', chapters: 9 },
      { name: 'Obadiah', chapters: 1 },
      { name: 'Jonah', chapters: 4 },
      { name: 'Micah', chapters: 7 },
      { name: 'Nahum', chapters: 3 },
      { name: 'Habakkuk', chapters: 3 },
      { name: 'Zephaniah', chapters: 3 },
      { name: 'Haggai', chapters: 2 },
      { name: 'Zechariah', chapters: 14 },
      { name: 'Malachi', chapters: 4 },
      // New Testament (27 books)
      // Gospels
      { name: 'Matthew', chapters: 28 },
      { name: 'Mark', chapters: 16 },
      { name: 'Luke', chapters: 24 },
      { name: 'John', chapters: 21 },
      // History
      { name: 'Acts', chapters: 28 },
      // Paul's Letters
      { name: 'Romans', chapters: 16 },
      { name: '1 Corinthians', chapters: 16 },
      { name: '2 Corinthians', chapters: 13 },
      { name: 'Galatians', chapters: 6 },
      { name: 'Ephesians', chapters: 6 },
      { name: 'Philippians', chapters: 4 },
      { name: 'Colossians', chapters: 4 },
      { name: '1 Thessalonians', chapters: 5 },
      { name: '2 Thessalonians', chapters: 3 },
      { name: '1 Timothy', chapters: 6 },
      { name: '2 Timothy', chapters: 4 },
      { name: 'Titus', chapters: 3 },
      { name: 'Philemon', chapters: 1 },
      // General Letters
      { name: 'Hebrews', chapters: 13 },
      { name: 'James', chapters: 5 },
      { name: '1 Peter', chapters: 5 },
      { name: '2 Peter', chapters: 3 },
      { name: '1 John', chapters: 5 },
      { name: '2 John', chapters: 1 },
      { name: '3 John', chapters: 1 },
      { name: 'Jude', chapters: 1 },
      // Apocalypse
      { name: 'Revelation', chapters: 22 }
    ];
  }
}