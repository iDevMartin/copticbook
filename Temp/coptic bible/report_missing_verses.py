#!/usr/bin/env python3
"""
Script to generate a detailed report of verses found in JSON but not in the database.
"""

import json
import sqlite3
import re
from pathlib import Path
from collections import defaultdict

# Mapping from JSON file names to database book names
BOOK_MAPPING = {
    "Acts of the Apostles.json": "Acts",
    "Amos.json": "Amos",
    "Apocalypse.json": "Revelation",
    "Baruch.json": "Baruch",
    "Daniel.json": "Daniel",
    "Deuteronomy.json": "Deuteronomy",
    "Ecclesiastes.json": "Ecclesiastes",
    "Epistle of Jeremiah.json": None,
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
    """Parse a verse reference like 'Jude 1' or 'Matthew 1:1'."""
    if not verse_ref or verse_ref == "Jude":
        return None

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
    """Extract Bohairic Coptic verses from JSON data."""
    verses = []

    for section in json_data:
        if 'data' not in section:
            continue

        for verse_data in section['data']:
            bohairic = verse_data.get('Bohairic', '').strip()
            verse_ref = verse_data.get('verseNumber', '').strip()

            if not bohairic or not verse_ref:
                continue

            parsed = parse_verse_reference(verse_ref)
            if not parsed:
                continue

            book, chapter, verse = parsed

            if verse is None:
                verse = chapter
                chapter = "1"

            verses.append((db_book_name, chapter, verse, bohairic, verse_ref))

    return verses


def main():
    script_dir = Path(__file__).parent
    json_dir = script_dir / "json"
    db_path = script_dir / "db" / "bible_psalms.db"

    print("Generating Missing Verses Report...")
    print("=" * 80)
    print()

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    missing_by_book = defaultdict(list)
    total_missing = 0

    for json_filename, db_book_name in sorted(BOOK_MAPPING.items()):
        if db_book_name is None:
            continue

        json_path = json_dir / json_filename
        if not json_path.exists():
            continue

        try:
            json_data = load_json_file(json_path)
            verses = extract_verses_from_json(json_data, db_book_name)

            book_missing = []
            for book, chapter, verse, coptic_text, original_ref in verses:
                cursor.execute(
                    "SELECT _id FROM Bible WHERE Book = ? AND Chapter = ? AND Verse = ?",
                    (book, chapter, verse)
                )
                result = cursor.fetchone()

                if not result:
                    book_missing.append({
                        'chapter': chapter,
                        'verse': verse,
                        'original_ref': original_ref,
                        'coptic_preview': coptic_text[:60] + '...' if len(coptic_text) > 60 else coptic_text
                    })

            if book_missing:
                missing_by_book[db_book_name] = book_missing
                total_missing += len(book_missing)

        except Exception as e:
            print(f"Error processing {json_filename}: {str(e)}")

    conn.close()

    # Generate report
    print(f"MISSING VERSES REPORT")
    print("=" * 80)
    print(f"Total verses not found in database: {total_missing}")
    print()

    if total_missing == 0:
        print("All verses were successfully matched!")
    else:
        print("Breakdown by book:")
        print("-" * 80)
        print()

        for book_name in sorted(missing_by_book.keys()):
            missing_verses = missing_by_book[book_name]
            print(f"\n{book_name}: {len(missing_verses)} verses not found")
            print("-" * 40)

            # Group by chapter
            by_chapter = defaultdict(list)
            for v in missing_verses:
                by_chapter[v['chapter']].append(v)

            for chapter in sorted(by_chapter.keys(), key=int):
                verses_in_chapter = by_chapter[chapter]
                verse_numbers = [v['verse'] for v in verses_in_chapter]
                print(f"  Chapter {chapter}: verses {', '.join(verse_numbers)}")

                # Show first 2 examples
                for v in verses_in_chapter[:2]:
                    print(f"    - {v['original_ref']}: {v['coptic_preview']}")

        print()
        print("=" * 80)
        print("\nPossible reasons for missing verses:")
        print("  1. Different chapter/verse numbering between Bible editions")
        print("  2. Apocryphal books or chapters not in the database")
        print("  3. Alternative verse numbering systems")
        print("  4. Verses in JSON with non-standard formatting")

    # Save detailed report to file
    report_path = script_dir / "missing_verses_report.txt"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("DETAILED MISSING VERSES REPORT\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Total verses not found: {total_missing}\n\n")

        for book_name in sorted(missing_by_book.keys()):
            missing_verses = missing_by_book[book_name]
            f.write(f"\n{book_name}: {len(missing_verses)} verses\n")
            f.write("-" * 40 + "\n")

            for v in missing_verses:
                f.write(f"{v['original_ref']} (Ch:{v['chapter']}, V:{v['verse']})\n")
                f.write(f"  {v['coptic_preview']}\n\n")

    print(f"\nDetailed report saved to: {report_path}")


if __name__ == "__main__":
    main()
