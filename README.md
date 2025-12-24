# CopticBook React Native Web App

A React Native web application for browsing and reading Coptic Orthodox liturgical content. Built with Expo, React Navigation, and AsyncStorage for persistent settings.

## Features

- 📱 **Progressive Web App (PWA)** - Works in browser and mobile web
- 🌍 **Multilingual** - English, Arabic, and Coptic support
- 🎨 **Dark Theme** - Professional dark interface (#000000 background)
- 📖 **Rich Content** - Complete liturgical texts with proper formatting
- 📅 **Liturgical Calendar** - Coptic calendar with automatic season detection
- ⚡ **XML Parsing** - Dynamic document loading with InsertDocument resolution
- 🔤 **Custom Fonts** - Authentic Coptic and Arabic typography
- ⚙️ **Customizable** - Font size, language preferences, themes, and date simulation

## Project Structure

```
CopticBookReact/
├── App.tsx                    # Main app with React Navigation Stack
├── index.js                   # React Native entry point
├── src/
│   ├── screens/              # All screen components (23 screens)
│   │   ├── MainMenuScreen.tsx       # Home screen with liturgical calendar
│   │   ├── ReadContentScreen.tsx    # XML content viewer
│   │   ├── SettingsScreen.tsx       # User preferences
│   │   ├── AgpeyaScreen.tsx         # Hours of prayer
│   │   ├── LiturgiesScreen.tsx      # Liturgy selection
│   │   ├── BibleScreen.tsx          # Bible navigation
│   │   └── ... (18 more category screens)
│   ├── services/             # Core business logic
│   │   ├── CopticXMLParser.ts       # XML parsing engine
│   │   ├── CopticBookSettings.ts    # Settings management
│   │   ├── CopticLiturgicalCalendar.ts  # Coptic calendar & seasons
│   │   └── DatabaseService.ts       # Bible database service
│   └── types/                # TypeScript type definitions
│       └── index.ts
├── public/                   # Static files served by static-server.js
│   └── assets/
│       └── xml/              # 2,206 XML liturgical files
├── assets/                   # App icons and fonts
└── static-server.js         # HTTP server for XML files (port 8082)
```

## Tech Stack

- **Framework**: React Native + Expo (~52.0.0)
- **Navigation**: React Navigation Stack (v6.3.17)
- **XML Parsing**: fast-xml-parser (v4.5.0)
- **Storage**: AsyncStorage (v2.1.0)
- **Styling**: React Native StyleSheet (inline styles)
- **Language**: TypeScript (v5.3.0)

## Installation

```bash
npm install
```

## Running the App

### Web (Recommended)
```bash
npm run web
```

This will:
1. Start static file server on port 8082 (serves XML files)
2. Start Expo dev server on port 8081
3. Open browser at http://localhost:8081

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Key Features

### 1. Liturgical Calendar
- Automatic Coptic date conversion (Gregorian → Coptic)
- Season detection (Great Fast, Holy Week, Resurrection, etc.)
- Date simulation for testing seasonal content

### 2. XML Content System
- Dynamic XML parsing with `<InsertDocument>` resolution
- Collapsible sections with expand/collapse
- Role-based content (Priest, Deacon, People, Reader)
- Season-conditional content with `<Season>` tags
- Multilingual support with `<Language>` elements

### 3. Settings
- Font size adjustment (12-36pt)
- Primary language selection
- Multi-language toggle (enable/disable each language)
- Color theme switching (Dark/Light)
- Silent role styling (Hidden/Grayed/Normal)
- Date simulation for testing

### 4. Content Categories
- Bible
- Agpeya (Hours of Prayer)
- Liturgies (Basil, Gregory, Cyril)
- Antiphonary
- Baptism
- Clergy Services
- Consecrations
- Crowning
- Funeral Rites
- Lakkan/Synaxarium
- Melodies
- Papal Services
- Pascha (Holy Week)
- Praises
- Prostration Prayers
- Raising of Incense
- Readings
- Unction
- Veneration

## XML Structure

The app parses 2,206+ XML files with the following structure:

```xml
<Document xmlns="http://book.copticlingo.com/">
  <Title>
    <Language id="English">Prime</Language>
    <Language id="Arabic">الساعة الأولى</Language>
  </Title>

  <Section expanded="true">
    <Title>
      <Language id="English">Introduction</Language>
    </Title>
    <Text>
      <Language id="English">In the Name of the Father...</Language>
    </Text>
  </Section>

  <Role id="Priest">
    <Text>
      <Language id="English">Lord have mercy.</Language>
    </Text>
  </Role>

  <InsertDocument path="include/CommonPrayers"/>
</Document>
```

## Styling

The app uses a **reverent dark theme**:

- **Background**: #000000 (pure black)
- **Text**: #FFFFFF (white)
- **Priest**: #FFD700 (gold)
- **Deacon**: #87CEEB (sky blue)
- **People**: #FFFFFF (white)
- **Reader**: #90EE90 (light green)
- **Fonts**: Thin weight (100) for elegant appearance
- **Transparency**: Subtle rgba(255, 255, 255, 0.05-0.3) for UI elements

## License

This project contains liturgical content from the Coptic Orthodox Church.

## Credits

Built with ❤️ for the Coptic Orthodox community.
