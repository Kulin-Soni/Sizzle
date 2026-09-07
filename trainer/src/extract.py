"""
Re-written using Claude, check diff if you want to see the original.

    python extract_youtube_comments.py --new [YOUTUBE_VIDEO_ID] --sort relevance
    python extract_youtube_comments.py --cache --sort time --save_cache
"""

from argparse import ArgumentParser
from html import unescape
from json import JSONDecodeError, dump, load
from os import makedirs
from pathlib import Path
from re import sub
from time import sleep
from typing import List, Optional, Tuple
from logging import Logger, basicConfig

from dotenv import dotenv_values
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from pandas import DataFrame

basicConfig(level="INFO")
logger = Logger(__name__)

# CLI arguments
parser = ArgumentParser(description="Extract YouTube comments to a CSV file.")

source_group = parser.add_mutually_exclusive_group(required=True)
source_group.add_argument(
    "--cache",
    action="store_true",
    help="Resume extraction using the video ID and page token stored in progress.json.",
)
source_group.add_argument(
    "--new",
    dest="video_id",
    metavar="YOUTUBE_VIDEO_ID",
    help="Start a fresh extraction for the given video ID.",
)

parser.add_argument(
    "--sort",
    choices=["relevance", "time"],
    required=True,
    help="Comment ordering to request from the YouTube API.",
)
parser.add_argument(
    "--output",
    default="output.csv",
    help="CSV filename (written inside the 'raw' directory). Default: output.csv",
)
parser.add_argument(
    "--save_cache",
    action="store_true",
    help="Persist the next page token after every page, so extraction can be resumed with --cache.",
)

args = parser.parse_args()


# Constants / setup
OUTPUT_DIR = Path("raw")
OUTPUT_FILE = OUTPUT_DIR / args.output
PROGRESS_FILE = OUTPUT_DIR / "progress.json"
CSV_COLUMNS = ["Comments", "Quality"]
REQUEST_DELAY_SECONDS = 2

makedirs(OUTPUT_DIR, exist_ok=True)

env = dotenv_values(".env")
api_key = env.get("DEV_KEY")
if not api_key:
    raise SystemExit(
        "Missing DEV_KEY in .env file. Cannot authenticate with the YouTube API."
    )

youtube = build("youtube", "v3", developerKey=api_key)


# Helpers
def clean_text(raw_html: str) -> str:
    return unescape(sub(r"<[^>]+>", "", raw_html))


def save_progress(video_id: str, page_token: str):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        dump({"VIDEO_ID": video_id, "TOKEN": page_token}, f)


def load_progress() -> Optional[dict]:
    try:
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return load(f)
    except (FileNotFoundError, JSONDecodeError):
        return None


def fetch_comment_page(
    video_id: str, page_token: Optional[str]
) -> Tuple[List[List[str]], Optional[str]]:
    response = (
        youtube.commentThreads()
        .list(
            part="snippet",
            videoId=video_id,
            order=args.sort,
            pageToken=page_token,
            maxResults=100,
        )
        .execute()
    )

    rows = []
    for item in response["items"]:
        comment_text = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
        rows.append([clean_text(comment_text), "0"])

    next_page_token = response.get("nextPageToken")
    return rows, next_page_token


def write_rows_to_csv(file: Path, rows: List[List[str]]):
    if not file.is_file():
        DataFrame(columns=CSV_COLUMNS).to_csv(file, index=False)

    DataFrame(rows).to_csv(file, header=False, index=False, mode="a")


def main():
    if args.cache:
        progress = load_progress()
        if not progress:
            raise SystemExit(
                "--cache was given but no progress.json was found (or it's corrupted). "
                "Start a new extraction with --new <VIDEO_ID> instead."
            )
        video_id = progress["VIDEO_ID"]
        page_token = progress["TOKEN"]
    else:
        video_id = args.video_id
        page_token = None

    logger.info("Extract started for video '%s' (sort=%s) ...", video_id, args.sort)

    page_count = 0
    try:
        while True:
            try:
                rows, page_token = fetch_comment_page(video_id, page_token)
            except HttpError:
                logger.info("YouTube API error, stopping extraction.", exc_info=True)
                break

            write_rows_to_csv(OUTPUT_FILE, rows)
            page_count += 1
            logger.info("Page %s: wrote %s comments", page_count, len(rows))

            if page_token and args.save_cache:
                save_progress(video_id, page_token)

            if not page_token:
                logger.info("No more pages available.")
                break

            sleep(REQUEST_DELAY_SECONDS)
    except KeyboardInterrupt:
        if page_token and args.save_cache:
            save_progress(video_id, page_token)
    finally:
        youtube.close()


if __name__ == "__main__":
    main()
    logger.info("Extract Done!")
