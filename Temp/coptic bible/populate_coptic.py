#!/usr/bin/env python3
"""
Script to populate Bohairic Coptic verses from JSON files into the Bible database.
"""

import json
import sqlite3
import os
import re
from pathlib import Path

# Mapping from JSON file names to database book names
BOOK_MAPPING = {
    "Acts of the Apostles.json": "Acts",
    "Amos.json": "Amos",
    "Apocalypse.json": "Revelation",
    "Baruch.json": "Baruch",
    "Daniel.json": "Daniel",
    "Deuteronomy.json": "Deuteronomy",
    "Ecclesiastes.json": "Ecclesiastes",
    "Epistle of Jeremiah.json": None,  # Not in database
    "Epistle of St. James.json": "James",
    "Epistle of St. Jude.json": "Jude",
    "Epistle to Philemon.json": "Philemon",
    "Epistle to the Colossians.json": "Colossians",
    "Epistle to the Ephesians.json": "Ephesians",
    "Epistle to the Galatians.json": "Galatians",
    "Epistle to the Hebrews.json": "Hebrews",
    "Epistle to the Philippians.json": "Philippians",
    "Epistle to the Romans.json": "Romans",
    "Epistle to Titus.json": "Titus",
    "Esther.json": "Esther",
    "Exodus.json": "Exodus",
    "Ezekiel.json": "Ezekiel",
    "First Chronicles.json": "1 Chronicles",
    "First Epistle of St. John.json": "1 John",
    "First Epistle of St. Peter.json": "1 Peter",
    "First Epistle to the Corinthians.json": "1 Corinthians",
    "First Epistle to the Thessalonians.json": "1 Thessalonians",
    "First Epistle to Timothy.json": "1 Timothy",
    "First Kings.json": "1 Kings",
    "First Samuel.json": "1 Samuel",
    "Genesis.json": "Genesis",
    "Gospel of St. John.json": "John",
    "Gospel of St. Luke.json": "Luke",
    "Gospel of St. Mark.json": "Mark",
    "Gospel of St. Matthew.json": "Matthew",
    "Habakkuk.json": "Habakkuk",
    "Haggai.json": "Haggai",
    "Hosea.json": "Hosea",
    "Isaiah.json": "Isaiah",
    "Jeremiah.json": "Jeremiah",
    "Job.json": "Job",
    "Joel.json": "Joel",
    "Jonah.json": "Jonah",
    "Joshua.json": "Joshua",
    "Judges.json": "Judges",
    "Judith.json": "Judith",
    "Lamentations of Jeremiah.json": "Lamentations",
    "Leviticus.json": "Leviticus",
    "Malachi.json": "Malachi",
    "Micah.json": "Micah",
    "Nahum.json": "Nahum",
    "Numbers.json": "Numbers",
    "Obadiah.json": "Obadiah",
    "Proverbs.json": "Proverbs",
    "Psalms.json": "Psalms",
    "Ruth.json": "Ruth",
    "Second Chronicles.json": "2 Chronicles",
    "Second Epistle of St. John.json": "2 John",
    "Second Epistle of St. Peter.json": "2 Peter",
    "Second Epistle to the Corinthians.json": "2 Corinthians",
    "Second Epistle to the Thessalonians.json": "2 Thessalonians",
    "Second Epistle to Timothy.json": "2 Timothy",
    "Second Kings.json": "2 Kings",
    "Second Samuel.json": "2 Samuel",
    "Song of Songs.json": "Song of Solomon",
    "Third Epistle of St. John.json": "3 John",
    "Tobit.json": "Tobit",
    "Wisdom of Jesus son of Sirach.json": "Sirach",
    "Wisdom of Solomon.json": "Wisdom",
    "Zechariah.json": "Zechariah",
    "Zephaniah.json": "Zephaniah",
}


def parse_verse_reference(verse_ref):
    """
    Parse a verse reference like 'Jude 1' or 'Matthew 1:1' into (book, chapter, verse).
    Returns None if the verse reference doesn't match the expected format.
    """
    if not verse_ref or verse_ref == "Jude":
        return None

    # Handle format: "BookName Chapter:Verse" or "BookName Chapter"
    # Examples: "Jude 1", "Matthew 1:1", "Genesis 1:1"

    # Try to match: Book Chapter:Verse or Book Chapter
    match = re.match(r'^(.+?)\s+(\d+)(?::(\d+))?$', verse_ref)
    if match:
        book = match.group(1)
        chapter = match.group(2)
        verse = match.group(3) if match.group(3) else None
        return (book, chapter, verse)

    return None


def load_json_file(json_path):
    """Load and parse a JSON file."""
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def extract_verses_from_json(json_data, db_book_name):
    """
    Extract Bohairic Coptic verses from JSON data.
    Returns a list of tuples: (book, chapter, verse, coptic_text)
    """
    verses = []

    for section in json_data:
        if 'data' not in section:
            continue

        for verse_data in section['data']:
            bohairic = verse_data.get('Bohairic', '').strip()
            verse_ref = verse_data.get('verseNumber', '').strip()

            # Skip if no Bohairic text or if it's just a title
            if not bohairic or not verse_ref:
                continue

            # Parse the verse reference
            parsed = parse_verse_reference(verse_ref)
            if not parsed:
                continue

            book, chapter, verse = parsed

            # For single-chapter books like Jude, the chapter might be missing
            if verse is None:
                verse = chapter
                chapter = "1"

            verses.append((db_book_name, chapter, verse, bohairic))

    return verses


def update_database(db_path, verses, dry_run=False):
    """
    Update the Bible database with Coptic verses.
    If dry_run is True, only show what would be updated without making changes.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    updated_count = 0
    not_found_count = 0
    errors = []

    for book, chapter, verse, coptic_text in verses:
        try:
            # First check if this row exists
            cursor.execute(
                "SELECT _id, Coptic FROM Bible WHERE Book = ? AND Chapter = ? AND Verse = ?",
                (book, chapter, verse)
            )
            result = cursor.fetchone()

            if result:
                row_id, existing_coptic = result

                if dry_run:
                    print(f"Would update: {book} {chapter}:{verse}")
                    if existing_coptic:
                        print(f"  Existing: {existing_coptic[:50]}...")
                    print(f"  New: {coptic_text[:50]}...")
                else:
                    # Update the Coptic column
                    cursor.execute(
                        "UPDATE Bible SET Coptic = ? WHERE _id = ?",
                        (coptic_text, row_id)
                    )
                    updated_count += 1
            else:
                not_found_count += 1
                errors.append(f"Not found in DB: {book} {chapter}:{verse}")

        except Exception as e:
            errors.append(f"Error updating {book} {chapter}:{verse}: {str(e)}")

    if not dry_run:
        conn.commit()
    conn.close()

    return updated_count, not_found_count, errors


def main():
    # Get the script's directory
    script_dir = Path(__file__).parent
    json_dir = script_dir / "json"
    db_path = script_dir / "db" / "bible_psalms.db"

    print("Starting Coptic verse population...")
    print(f"JSON directory: {json_dir}")
    print(f"Database: {db_path}")
    print()

    # First, let's do a dry run to see what would be updated
    print("=" * 80)
    print("PHASE 1: DRY RUN - Checking what will be updated")
    print("=" * 80)

    total_verses = 0
    books_processed = 0

    for json_filename, db_book_name in BOOK_MAPPING.items():
        if db_book_name is None:
            continue

        json_path = json_dir / json_filename
        if not json_path.exists():
            print(f"⚠️  JSON file not found: {json_filename}")
            continue

        print(f"\nProcessing: {json_filename} → {db_book_name}")

        try:
            json_data = load_json_file(json_path)
            verses = extract_verses_from_json(json_data, db_book_name)

            if verses:
                print(f"  Found {len(verses)} verses with Bohairic text")
                total_verses += len(verses)
                books_processed += 1

                # Show first 3 verses as sample
                print(f"  Sample verses:")
                for i, (book, chapter, verse, coptic) in enumerate(verses[:3]):
                    print(f"    {book} {chapter}:{verse} - {coptic[:40]}...")
            else:
                print(f"  No verses found")

        except Exception as e:
            print(f"  ❌ Error: {str(e)}")

    print()
    print("=" * 80)
    print(f"Summary: Found {total_verses} verses across {books_processed} books")
    print("=" * 80)

    # Ask user for confirmation
    print()
    print("Proceeding with database update...")
    # Auto-confirm for automated execution
    # response = input("Do you want to proceed with updating the database? (yes/no): ").strip().lower()
    # if response != 'yes':
    #     print("Aborted. No changes made to the database.")
    #     return

    print()
    print("=" * 80)
    print("PHASE 2: UPDATING DATABASE")
    print("=" * 80)

    total_updated = 0
    total_not_found = 0
    all_errors = []

    for json_filename, db_book_name in BOOK_MAPPING.items():
        if db_book_name is None:
            continue

        json_path = json_dir / json_filename
        if not json_path.exists():
            continue

        try:
            json_data = load_json_file(json_path)
            verses = extract_verses_from_json(json_data, db_book_name)

            if verses:
                print(f"\nUpdating {db_book_name}...")
                updated, not_found, errors = update_database(db_path, verses, dry_run=False)
                total_updated += updated
                total_not_found += not_found
                all_errors.extend(errors)

                print(f"  ✓ Updated {updated} verses")
                if not_found > 0:
                    print(f"  ⚠️  {not_found} verses not found in database")

        except Exception as e:
            print(f"  ❌ Error processing {json_filename}: {str(e)}")
            all_errors.append(f"Error processing {json_filename}: {str(e)}")

    print()
    print("=" * 80)
    print("FINAL SUMMARY")
    print("=" * 80)
    print(f"Total verses updated: {total_updated}")
    print(f"Total verses not found: {total_not_found}")
    print(f"Total errors: {len(all_errors)}")

    if all_errors and len(all_errors) <= 20:
        print("\nErrors:")
        for error in all_errors[:20]:
            print(f"  - {error}")

    print("\nDone!")


if __name__ == "__main__":
    main()
