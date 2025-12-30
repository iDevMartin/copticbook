import { XMLParser } from 'fast-xml-parser';
import { CopticContent, ParsedXMLContent, CopticLanguage } from '@/types';
import { CopticBookSettings } from './CopticBookSettings';
import { CopticLiturgicalCalendar } from './CopticLiturgicalCalendar';
import { DatabaseService } from './DatabaseService';

export class CopticXMLParser {
  private contentArray: CopticContent[] = [];
  private currentID = 0;
  private currentSection = 0;
  private basePath: string;

  // Section tracking
  private currentCollapsibleSection: number | null = null;
  private collapsibleSections: { [key: number]: boolean } = {};
  private sectionTitles: { [key: number]: string } = {};
  private nextSectionID = 1;

  // Role tracking
  private currentRole: string | null = null;
  private currentRoleIsSilent = false;
  private hasCreatedRoleHeader = false;

  // Season tracking
  private seasonConditionStack: string[] = [];
  private skipContent = false;

  // Document context tracking (e.g., Agpeya="true", Liturgy="true", etc.)
  private documentContexts: { [key: string]: boolean } = {};

  // Current parsing state
  private currentContent: CopticContent | null = null;
  private currentElement = '';
  private currentLanguage = '';
  private foundCharacters = '';

  private settings: CopticBookSettings;
  private liturgicalCalendar: CopticLiturgicalCalendar;
  private databaseService: DatabaseService;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.settings = CopticBookSettings.getInstance();
    this.liturgicalCalendar = CopticLiturgicalCalendar.getInstance();
    this.databaseService = DatabaseService.getInstance();
  }

  // Helper to get the current date (respects simulated date)
  private getCurrentDate(): Date {
    return this.settings.isDateSimulationEnabled && this.settings.simulatedDate
      ? this.settings.simulatedDate
      : new Date();
  }

  // Reset parser for new document
  public resetForNewDocument(): void {
    this.contentArray = [];
    this.collapsibleSections = {};
    this.sectionTitles = {};
    this.currentID = 0;
    this.currentSection = 0;
    this.nextSectionID = 1;
    this.currentCollapsibleSection = null;
    this.currentRole = null;
    this.currentRoleIsSilent = false;
    this.hasCreatedRoleHeader = false;

    console.log('DEBUG: Reset parser for new document - all state cleared');
  }

  // Helper method to create role header when needed
  private createRoleHeaderIfNeeded(): void {
    if (!this.currentRole || this.hasCreatedRoleHeader || this.currentRole.toLowerCase() === 'introduction') {
      return;
    }

    const roleHeader: CopticContent = {
      id: this.currentID,
      section: this.currentSection,
      type: 'RoleHeader',
      english: `${this.currentRole}:`,
      isCollapsibleSection: false,
      isExpanded: true,
      belongsToSection: this.currentCollapsibleSection,
      roleID: this.currentRole,
      isRoleHeader: true,
      isSilentRole: this.currentRoleIsSilent,
      useHistory: true,
      hasAttributedText: false
    };

    this.contentArray.push(roleHeader);
    this.currentID++;
    this.hasCreatedRoleHeader = true;
  }

  public async parseXMLFile(filename: string): Promise<ParsedXMLContent> {
    // Clear content array and parsing state, but keep section ID counter global
    this.contentArray = [];
    this.currentID = 0;
    this.currentSection = 0;
    this.currentCollapsibleSection = null;
    this.currentRole = null;
    this.currentRoleIsSilent = false;
    this.hasCreatedRoleHeader = false;

    console.log('DEBUG: Starting XML parse for file:', filename);
    console.log('DEBUG: Current nextSectionID:', this.nextSectionID);
    console.log('DEBUG: Existing collapsible sections:', Object.keys(this.collapsibleSections).length);

    try {
      const xmlContent = await this.loadXMLFile(`${this.basePath}/${filename}.xml`);
      await this.parseXMLContent(xmlContent);

      console.log('DEBUG: Parse completed for', filename, '. Total content items:', this.contentArray.length);
      console.log('DEBUG: Total collapsible sections now:', Object.keys(this.collapsibleSections).length);
      console.log('DEBUG: Next section ID will be:', this.nextSectionID);

      return {
        content: this.contentArray,
        collapsibleSections: this.collapsibleSections,
        sectionTitles: this.sectionTitles
      };
    } catch (error) {
      console.error('Error parsing XML file:', filename, error);
      return {
        content: [],
        collapsibleSections: {},
        sectionTitles: {}
      };
    }
  }

  private async loadXMLFile(filePath: string): Promise<string> {
    try {
      // In development, use static server on port 8082. In production, use relative path.
      const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const baseUrl = isDevelopment ? 'http://localhost:8082' : '';
      const url = `${baseUrl}/${filePath}`;

      console.log(`Loading XML file from: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load XML file: ${response.status} ${response.statusText}`);
      }

      const xmlContent = await response.text();
      return xmlContent;
    } catch (error) {
      console.error('Error loading XML file:', filePath, error);
      throw error;
    }
  }

  private async parseXMLContent(xmlContent: string): Promise<void> {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: false,
      parseAttributeValue: false,
      trimValues: true,
      preserveOrder: true, // CRITICAL: Preserve document order instead of grouping by element name
      alwaysCreateTextNode: true // Always create text nodes even if empty
    });

    try {
      const result = parser.parse(xmlContent); // fast-xml-parser's parse is synchronous
      console.log('DEBUG: Parsed XML with preserveOrder. Result is array:', Array.isArray(result));
      await this.processXMLNode(result, null);
    } catch (error) {
      console.error('XML parsing error:', error);
    }
  }

  private async processXMLNode(node: any, parentElement: string | null): Promise<void> {
    if (typeof node === 'string') {
      this.foundCharacters += node.trim();
      return;
    }

    if (typeof node !== 'object' || node === null) {
      return;
    }

    // With preserveOrder: true, result is an array of objects where each object has one key (the element name)
    if (Array.isArray(node)) {
      for (const item of node) {
        await this.processXMLNode(item, parentElement);
      }
      return;
    }

    // Process each element in the node
    for (const [elementName, elementValue] of Object.entries(node)) {
      if (elementName.startsWith(':@')) {
        continue; // Skip the attributes container itself
      }

      // Handle text content (#text from fast-xml-parser)
      if (elementName === '#text' && typeof elementValue === 'string') {
        const trimmed = elementValue.trim();
        if (trimmed.length > 0) {
          this.foundCharacters += trimmed;
        }
        continue;
      }

      // Extract attributes: check both the value and the parent node for ':@'
      let attributes: { [key: string]: string } = {};

      // If the parent node has ':@', those are the attributes for this element
      if (node[':@']) {
        const attrsObj = node[':@'];
        for (const [key, value] of Object.entries(attrsObj)) {
          // Remove @_ prefix if present
          const cleanKey = key.startsWith('@_') ? key.substring(2) : key;
          attributes[cleanKey] = String(value);
        }
      }

      // If the value is an array, it might also contain attributes
      if (Array.isArray(elementValue)) {
        const arrayAttrs = this.extractAttributesFromArray(elementValue);
        attributes = { ...attributes, ...arrayAttrs };
      }

      // With preserveOrder, element values are usually arrays
      if (Array.isArray(elementValue)) {
        // Call start element handler once
        await this.didStartElement(elementName, attributes);

        // Process each item in the array (children and text content)
        for (let i = 0; i < elementValue.length; i++) {
          const item = elementValue[i];
          // Each array item is a child element, even if it has :@ attributes
          // The processXMLNode will skip :@ when iterating entries
          if (typeof item === 'object' && item !== null) {
            await this.processXMLNode(item, elementName);
          }
        }

        // Call end element handler once
        await this.didEndElement(elementName);
      } else {
        // Non-array value (fallback for edge cases)
        if (!attributes || Object.keys(attributes).length === 0) {
          attributes = this.extractAttributes(elementValue);
        }
        await this.didStartElement(elementName, attributes);
        await this.processXMLNode(elementValue, elementName);
        await this.didEndElement(elementName);
      }
    }
  }

  private extractAttributes(elementValue: any): { [key: string]: string } {
    const attributes: { [key: string]: string } = {};

    if (typeof elementValue !== 'object' || elementValue === null) {
      return attributes;
    }

    // With preserveOrder: true, attributes are in the ':@' key
    if (elementValue[':@']) {
      const attrsObj = elementValue[':@'];
      for (const [key, value] of Object.entries(attrsObj)) {
        attributes[key] = String(value);
      }
    } else {
      // Fallback: check for @_ prefixed attributes directly on the element
      for (const [key, value] of Object.entries(elementValue)) {
        if (key.startsWith('@_')) {
          const attrName = key.substring(2);
          attributes[attrName] = String(value);
        }
      }
    }

    return attributes;
  }

  private extractAttributesFromArray(elementValue: any): { [key: string]: string } {
    const attributes: { [key: string]: string } = {};

    if (!Array.isArray(elementValue)) {
      return attributes;
    }

    // With preserveOrder, attributes can be stored in two ways:
    // 1. As an array item with ':@' key: [{':@': {id: 'English'}}, {'#text': '...'}]
    // 2. At the parent object level (handled separately)
    for (const item of elementValue) {
      if (typeof item === 'object' && item !== null && item[':@']) {
        const attrsObj = item[':@'];
        for (const [key, value] of Object.entries(attrsObj)) {
          // Remove @_ prefix if present
          const cleanKey = key.startsWith('@_') ? key.substring(2) : key;
          attributes[cleanKey] = String(value);
        }
        break; // Found attributes, no need to continue
      }
    }

    return attributes;
  }

  private async didStartElement(elementName: string, attributes: { [key: string]: string }): Promise<void> {
    this.currentElement = elementName;

    // Only reset foundCharacters for elements that create new content containers
    // Don't reset for arbitrary HTML child elements (ul, li, i, b, etc.)
    const shouldResetFoundCharacters = [
      'Title', 'Text', 'Comment', 'LinkDocument', 'Language'
    ].includes(elementName);

    if (shouldResetFoundCharacters) {
      this.foundCharacters = '';
    }

    switch (elementName) {
      case 'Document':
        await this.handleDocumentElement(attributes);
        break;
      case 'Title':
        await this.handleTitleElement(attributes);
        break;
      case 'Text':
        await this.handleTextElement(attributes);
        break;
      case 'Comment':
        await this.handleCommentElement(attributes);
        break;
      case 'Role':
        await this.handleRoleElement(attributes);
        break;
      case 'Section':
        await this.handleSectionElement(attributes);
        break;
      case 'Language':
        await this.handleLanguageElement(attributes);
        break;
      case 'InsertDocument':
        await this.handleInsertDocumentElement(attributes);
        break;
      case 'BibleReference':
        await this.handleBibleReferenceElement(attributes);
        break;
      case 'Season':
        await this.handleSeasonElement(attributes);
        break;
      case 'ForceSeason':
        await this.handleForceSeasonElement(attributes);
        break;
      case 'LinkDocument':
        await this.handleLinkDocumentElement(attributes);
        break;
    }
  }

  private async handleDocumentElement(attributes: { [key: string]: string }): Promise<void> {
    // Extract document context attributes (e.g., Agpeya="true", Liturgy="true", etc.)
    // These are used for context-aware Season filtering
    for (const [key, value] of Object.entries(attributes)) {
      // Skip xmlns and other standard attributes
      if (key === 'xmlns' || key === 'FixedDateDocument' || key === 'ExpandSections') {
        continue;
      }

      // Store boolean context flags
      if (value === 'true' || value === 'false') {
        this.documentContexts[key] = value === 'true';
      }
    }

    console.log('DEBUG: Document contexts extracted:', this.documentContexts);
  }

  private async handleTitleElement(attributes: { [key: string]: string }): Promise<void> {
    // Skip creating content if we're in a non-matching season
    if (this.skipContent) {
      return;
    }

    const content: CopticContent = {
      id: this.currentID,
      section: this.currentSection,
      type: 'Title',
      isCollapsibleSection: false,
      isExpanded: true,
      useHistory: true,
      hasAttributedText: false,
      isRoleHeader: false,
      isSilentRole: this.currentRoleIsSilent
    };

    // Check if this title belongs to a collapsible section
    if (this.currentCollapsibleSection !== null) {
      content.isCollapsibleSection = true;
      content.isExpanded = this.collapsibleSections[this.currentCollapsibleSection] ?? true;
      content.belongsToSection = this.currentCollapsibleSection;
    }

    // Set role information
    content.roleID = this.currentRole;
    content.isSilentRole = this.currentRoleIsSilent;

    this.currentContent = content;
  }

  private async handleTextElement(attributes: { [key: string]: string }): Promise<void> {
    // Skip creating content if we're in a non-matching season
    if (this.skipContent) {
      return;
    }

    const content: CopticContent = {
      id: this.currentID,
      section: this.currentSection,
      type: 'Text',
      isCollapsibleSection: false,
      isExpanded: true,
      belongsToSection: this.currentCollapsibleSection,
      roleID: this.currentRole,
      isRoleHeader: false,
      isSilentRole: this.currentRoleIsSilent,
      textType: attributes.type, // Capture the type attribute (e.g., "Refrain")
      useHistory: true,
      hasAttributedText: false
    };

    this.currentContent = content;
  }

  private async handleCommentElement(attributes: { [key: string]: string }): Promise<void> {
    console.log('DEBUG: handleCommentElement called, skipContent:', this.skipContent);

    // Skip creating content if we're in a non-matching season
    if (this.skipContent) {
      console.log('DEBUG: Skipping Comment due to skipContent');
      return;
    }

    const content: CopticContent = {
      id: this.currentID,
      section: this.currentSection,
      type: 'Comment',
      isCollapsibleSection: false,
      isExpanded: true,
      belongsToSection: this.currentCollapsibleSection,
      roleID: this.currentRole,
      isRoleHeader: false,
      isSilentRole: this.currentRoleIsSilent,
      useHistory: true,
      hasAttributedText: false
    };

    this.currentContent = content;
  }

  private async handleRoleElement(attributes: { [key: string]: string }): Promise<void> {
    const roleType = attributes.id || '';
    const isSilent = attributes.silent?.toLowerCase() === 'true';

    this.currentRole = roleType;
    this.currentRoleIsSilent = isSilent;

    // Don't create role header here - defer until we actually have content to add
  }

  private async handleSectionElement(attributes: { [key: string]: string }): Promise<void> {
    // If in a silent role, default to collapsed unless explicitly set to expanded
    let defaultExpanded = 'true';
    if (this.currentRoleIsSilent && !attributes.expanded) {
      defaultExpanded = 'false';
    }

    const isExpandedAttribute = attributes.expanded || defaultExpanded;
    const isExpanded = isExpandedAttribute.toLowerCase() === 'true';

    // Create a new unique section ID using the counter
    const newSectionID = this.nextSectionID;
    this.nextSectionID++; // Increment for next section

    this.currentCollapsibleSection = newSectionID;
    this.collapsibleSections[newSectionID] = isExpanded;

    console.log('DEBUG: ***** SECTION STARTED - ID:', newSectionID, 'expanded:', isExpanded, 'isSilentRole:', this.currentRoleIsSilent, 'at contentArray index:', this.contentArray.length);
  }

  private async handleLanguageElement(attributes: { [key: string]: string }): Promise<void> {
    this.currentLanguage = attributes.id || '';
    // Always parse all languages from XML regardless of settings
    // Display logic will filter based on enabled languages
  }

  private async handleInsertDocumentElement(attributes: { [key: string]: string }): Promise<void> {
    // Skip processing if we're in a non-matching season
    if (this.skipContent) {
      return;
    }

    const path = attributes.path;
    if (path) {
      console.log('DEBUG: ===== Processing InsertDocument:', path, 'at contentArray index', this.contentArray.length, 'currentSection:', this.currentCollapsibleSection);

      // Process InsertDocument immediately inline to maintain correct order
      try {
        const insertedContent = await this.resolveInsertDocument(path);

        console.log('DEBUG: ===== Inserting', insertedContent.length, 'items from', path);

        // Create role header if needed before inserting content
        this.createRoleHeaderIfNeeded();

        // Add the inserted content directly to the array at current position
        for (const content of insertedContent) {
          this.contentArray.push(content);
        }

        console.log('DEBUG: ===== After inserting', path, 'contentArray now has', this.contentArray.length, 'items');
      } catch (error) {
        console.error('Error processing InsertDocument:', path, error);
      }
    }
  }

  private async handleBibleReferenceElement(attributes: { [key: string]: string }): Promise<void> {
    // Skip processing if we're in a non-matching season
    if (this.skipContent) {
      return;
    }

    const reference = attributes.reference;
    if (reference) {
      const bibleContent = await this.fetchBibleReference(reference);
      if (bibleContent.length > 0) {
        this.createRoleHeaderIfNeeded(); // Create role header before adding content

        // Create a collapsible section for this Bible reference
        const sectionID = this.nextSectionID;
        this.nextSectionID++;
        this.collapsibleSections[sectionID] = true; // Start expanded

        // Create section title with the reference
        const sectionTitle: CopticContent = {
          id: this.currentID,
          section: this.currentSection,
          type: 'Title',
          english: reference,
          isCollapsibleSection: true,
          isExpanded: true,
          belongsToSection: sectionID,
          roleID: this.currentRole,
          isRoleHeader: false,
          isSilentRole: this.currentRoleIsSilent,
          useHistory: true,
          hasAttributedText: false
        };

        this.contentArray.push(sectionTitle);
        this.sectionTitles[sectionID] = reference;
        this.currentID++;

        // Add bible content items, marking them as belonging to this section
        for (const content of bibleContent) {
          content.id = this.currentID;
          content.belongsToSection = sectionID;
          content.roleID = this.currentRole;
          content.isSilentRole = this.currentRoleIsSilent;
          this.contentArray.push(content);
          this.currentID++;
        }
      }
    }
  }

  private async handleSeasonElement(attributes: { [key: string]: string }): Promise<void> {
    const seasonCondition = attributes.id;
    if (seasonCondition) {
      const shouldIncludeContent = this.liturgicalCalendar.evaluateSeasonCondition(seasonCondition, this.documentContexts, this.getCurrentDate());

      console.log('DEBUG: Season START - condition:', seasonCondition);
      console.log('DEBUG: Document contexts:', this.documentContexts);
      console.log('DEBUG: shouldIncludeContent:', shouldIncludeContent);
      console.log('DEBUG: Stack BEFORE push:', JSON.stringify(this.seasonConditionStack));

      this.seasonConditionStack.push(seasonCondition);
      console.log('DEBUG: Stack AFTER push:', JSON.stringify(this.seasonConditionStack));

      if (!shouldIncludeContent) {
        this.skipContent = true;
        console.log('DEBUG: Setting skipContent to TRUE');
      } else {
        console.log('DEBUG: Keeping skipContent as', this.skipContent);
      }
    }
  }

  private async handleForceSeasonElement(attributes: { [key: string]: string }): Promise<void> {
    // ForceSeason temporarily overrides the current liturgical context
    const forcedSeason = attributes.id;
    if (forcedSeason) {
      // This would need more complex implementation to temporarily change context
      // For now, we'll treat it similar to Season but with higher priority
      const shouldIncludeContent = this.liturgicalCalendar.evaluateSeasonCondition(forcedSeason, this.documentContexts, this.getCurrentDate());

      this.seasonConditionStack.push(forcedSeason);
      if (!shouldIncludeContent) {
        this.skipContent = true;
      }
    }
  }

  private async handleLinkDocumentElement(attributes: { [key: string]: string }): Promise<void> {
    const linkPath = attributes.path || '';
    const useHistoryString = attributes.useHistory || 'true';
    const useHistory = useHistoryString.toLowerCase() !== 'false';

    const content: CopticContent = {
      id: this.currentID,
      section: this.currentSection,
      type: 'LinkDocument',
      isCollapsibleSection: false,
      isExpanded: true,
      belongsToSection: this.currentCollapsibleSection,
      roleID: this.currentRole,
      isRoleHeader: false,
      isSilentRole: this.currentRoleIsSilent,
      linkPath,
      useHistory,
      hasAttributedText: false
    };

    this.currentContent = content;
  }

  private async didEndElement(elementName: string): Promise<void> {
    switch (elementName) {
      case 'Season':
      case 'ForceSeason':
        console.log('DEBUG: Ending Season, stack before pop:', this.seasonConditionStack);
        // Pop the season condition from the stack
        if (this.seasonConditionStack.length > 0) {
          this.seasonConditionStack.pop();
        }

        // Reset skip content flag if no more season conditions are active
        if (this.seasonConditionStack.length === 0) {
          console.log('DEBUG: Stack empty, resetting skipContent to FALSE');
          this.skipContent = false;
        } else {
          // Re-evaluate the remaining season conditions
          this.skipContent = !this.seasonConditionStack.every(condition =>
            this.liturgicalCalendar.evaluateSeasonCondition(condition, this.documentContexts, this.getCurrentDate())
          );
          console.log('DEBUG: Stack not empty, re-evaluated skipContent to', this.skipContent);
        }
        break;

      case 'Language':
        if (this.currentContent && this.foundCharacters.length > 0) {
          const hasSpanTags = this.foundCharacters.includes('<span');
          const hasHTMLTags = ['<ol', '<ul', '<li', '<i>', '<u>', '<sup>', '<br'].some(tag =>
            this.foundCharacters.includes(tag)
          );

          console.log('DEBUG: Language end - currentLanguage:', this.currentLanguage, 'foundCharacters length:', this.foundCharacters.length, 'hasHTML:', hasSpanTags || hasHTMLTags, 'content type:', this.currentContent.type);

          if (hasSpanTags || hasHTMLTags) {
            // Process HTML tags and create attributed string
            this.currentContent.hasAttributedText = true;
            const isRefrainType = this.currentContent.textType?.toLowerCase() === 'refrain';

            switch (this.currentLanguage) {
              case 'English':
                this.currentContent.englishAttributed = this.foundCharacters;
                this.currentContent.english = this.foundCharacters; // Keep original for fallback
                break;
              case 'Arabic':
                this.currentContent.arabicAttributed = this.foundCharacters;
                this.currentContent.arabic = this.foundCharacters;
                break;
              case 'Coptic':
                this.currentContent.copticAttributed = this.foundCharacters;
                this.currentContent.coptic = this.foundCharacters;
                break;
            }
          } else {
            // Regular text without spans
            switch (this.currentLanguage) {
              case 'English':
                this.currentContent.english = this.foundCharacters;
                break;
              case 'Arabic':
                this.currentContent.arabic = this.foundCharacters;
                break;
              case 'Coptic':
                this.currentContent.coptic = this.foundCharacters;
                break;
            }
          }
        } else if (this.currentContent) {
          console.log('DEBUG: Language end - NO CHARACTERS FOUND for content type:', this.currentContent.type, 'currentLanguage:', this.currentLanguage, 'contentID:', this.currentContent.id);
        }
        break;

      case 'Title':
      case 'Text':
      case 'Comment':
      case 'LinkDocument':
        if (this.currentContent) {
          // Skip adding content if we're in a non-matching season
          if (this.skipContent) {
            this.currentContent = null;
            this.foundCharacters = '';
            return;
          }

          // Create role header before adding any content to the role
          this.createRoleHeaderIfNeeded();

          // DEBUG: Log content being added
          console.log('DEBUG: Adding content to array - type:', this.currentContent.type, 'id:', this.currentContent.id, 'hasEnglish:', !!this.currentContent.english, 'hasArabic:', !!this.currentContent.arabic, 'hasCoptic:', !!this.currentContent.coptic);

          // If this is a collapsible section title, store it for reference
          if (this.currentContent.isCollapsibleSection && this.currentContent.belongsToSection && this.currentContent.english) {
            this.sectionTitles[this.currentContent.belongsToSection] = this.currentContent.english;
          }

          this.contentArray.push(this.currentContent);
          this.currentID++;
        }
        this.currentContent = null;
        break;

      case 'Section':
        console.log('DEBUG: ***** SECTION ENDED - was ID:', this.currentCollapsibleSection, 'at contentArray index:', this.contentArray.length);
        this.currentCollapsibleSection = null;
        break;

      case 'Role':
        this.currentRole = null;
        this.currentRoleIsSilent = false;
        this.hasCreatedRoleHeader = false; // Reset for next role
        break;
    }

    this.foundCharacters = '';
  }

  private async fetchBibleReference(reference: string): Promise<CopticContent[]> {
    try {
      return await this.databaseService.getBibleReference(reference);
    } catch (error) {
      console.error('Error fetching Bible reference:', reference, error);
      return [];
    }
  }

  private async resolveInsertDocument(path: string): Promise<CopticContent[]> {
    let resolvedPath = path;

    // Check if path already starts with a reader type directory (readings/, liturgies/, etc.)
    // These paths are relative to assets/xml/ base directory
    if (path.startsWith('readings/') || path.startsWith('liturgies/') || path.startsWith('agpeya/')) {
      // Use the path as-is from assets/xml base
      resolvedPath = `assets/xml/${path}`;
    } else if (path.startsWith('include/')) {
      // include/ paths always point to the global assets/xml/include/ directory
      resolvedPath = `assets/xml/${path}`;
    } else {
      // Path is relative to current basePath
      resolvedPath = `${this.basePath}/${path}`;
    }

    try {
      const xmlContent = await this.loadXMLFile(`${resolvedPath}.xml`);
      const subParser = new CopticXMLParser(this.basePath);

      // Transfer ALL current state to sub-parser to maintain context
      subParser.currentID = this.currentID;
      subParser.nextSectionID = this.nextSectionID;
      subParser.collapsibleSections = { ...this.collapsibleSections };
      subParser.sectionTitles = { ...this.sectionTitles };

      // CRITICAL: Transfer section and role context so inserted content belongs to the right section/role
      subParser.currentCollapsibleSection = this.currentCollapsibleSection;
      subParser.currentRole = this.currentRole;
      subParser.currentRoleIsSilent = this.currentRoleIsSilent;
      subParser.hasCreatedRoleHeader = this.hasCreatedRoleHeader;

      // CRITICAL: Transfer Season context so seasonal content is evaluated correctly
      subParser.skipContent = this.skipContent;
      subParser.seasonConditionStack = [...this.seasonConditionStack];

      // CRITICAL: Transfer document context so context-aware Season filtering works
      subParser.documentContexts = { ...this.documentContexts };

      console.log('DEBUG: Starting InsertDocument parse for:', path);
      console.log('DEBUG: Sub-parser context - currentID:', subParser.currentID, 'section:', subParser.currentCollapsibleSection, 'role:', subParser.currentRole);

      await subParser.parseXMLContent(xmlContent);

      // Update main parser's state with the sub-parser's final state
      this.currentID = subParser.currentID;
      this.nextSectionID = subParser.nextSectionID;
      Object.assign(this.collapsibleSections, subParser.collapsibleSections);
      Object.assign(this.sectionTitles, subParser.sectionTitles);

      // Important: Keep the hasCreatedRoleHeader state from sub-parser
      this.hasCreatedRoleHeader = subParser.hasCreatedRoleHeader;

      // Important: Restore Season context from sub-parser
      this.skipContent = subParser.skipContent;
      this.seasonConditionStack = subParser.seasonConditionStack;

      console.log('DEBUG: InsertDocument parse completed. Main parser currentID now:', this.currentID, 'nextSectionID:', this.nextSectionID);
      console.log('DEBUG: Sub-parser returned', subParser.contentArray.length, 'content items');

      return subParser.contentArray;
    } catch (error) {
      console.error('Could not resolve InsertDocument path:', resolvedPath, error);
      return [];
    }
  }

  public getVisibleContent(): CopticContent[] {
    const visibleContent: CopticContent[] = [];

    for (const content of this.contentArray) {
      // Always show content that doesn't belong to any collapsible section
      if (content.belongsToSection === null || content.belongsToSection === undefined) {
        visibleContent.push(content);
        continue;
      }

      // For content belonging to a section, check if section is expanded
      const sectionID = content.belongsToSection;
      if (content.isCollapsibleSection) {
        // Always show section headers
        visibleContent.push(content);
      } else if (this.collapsibleSections[sectionID] === true) {
        // Show content only if the section is expanded
        visibleContent.push(content);
      }
    }

    return visibleContent;
  }

  public toggleSection(sectionID: number): void {
    console.log('DEBUG: toggleSection called with sectionID:', sectionID);
    console.log('DEBUG: Current collapsibleSections state:', this.collapsibleSections);

    const currentState = this.collapsibleSections[sectionID];
    if (currentState !== undefined) {
      this.collapsibleSections[sectionID] = !currentState;
      console.log('DEBUG: Toggled section', sectionID, 'from', currentState, 'to', !currentState);

      // Update the isExpanded state of the section header
      for (let i = 0; i < this.contentArray.length; i++) {
        if (this.contentArray[i].belongsToSection === sectionID && this.contentArray[i].isCollapsibleSection) {
          this.contentArray[i].isExpanded = !currentState;
          console.log('DEBUG: Updated header at index', i, '(ID:', this.contentArray[i].id, ') isExpanded to', !currentState);
          break;
        }
      }
    } else {
      console.log('DEBUG: Section', sectionID, 'not found in collapsibleSections');
    }
  }
}