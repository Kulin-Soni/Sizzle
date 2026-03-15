### 
# This file is to be used independently. 
# Do not execute functions from here in other file unless you want your code to blast like watermelon.
###

from googleapiclient.discovery import build
from pandas import DataFrame
from typing import List, Dict
from dotenv import dotenv_values
from pathlib import Path
from json_util import load, save
from time import sleep
from os import makedirs
from html import unescape
from re import sub
from argparse import ArgumentParser

# Argument parsing
parser = ArgumentParser()
g = parser.add_mutually_exclusive_group(required=True, )
g.add_argument("--cache", dest="cache", action="store_true")
g.add_argument("--new", dest="new", metavar="YOUTUBE_VIDEO_ID")
parser.add_argument("--o", choices=["relevance", "time"], required=True)
parser.add_argument("--progress", action="store_true", required=False)
args = parser.parse_args()

# Setting up constants
PARENT = Path("raw_data")
DATA_FILE = Path(PARENT / "comments_5.csv")
TOKEN_FILE = Path(PARENT / "progress_data.json")
COL_ORDER = ["Video Id", "Comment", "Likes", "Quality"]
ENV = dotenv_values(".env")
client = build("youtube", version="v3", developerKey=ENV["DEV_KEY"])
makedirs(PARENT, exist_ok=True)

# Removes html from text and replaces numeric character references.
def clean_text(text: str):
    return unescape(sub(r'<[^>]+>', '', text))

# Saves video id and token to token file.
def save_token(video_id, token):
    save(TOKEN_FILE, {"VIDEO_ID": video_id, "TOKEN": token})
        
# Loads video id and token from token file. 
def load_token():
    try:
        return load(TOKEN_FILE)
    except FileExistsError:
        return None


# Gets comments from Google and returns data
def extract_comments(id: str, nToken):
    res = (
        client.commentThreads()
        .list(
            part="snippet",
            videoId=id,
            order=args.o,
            pageToken=nToken,
            maxResults=100,
        )
        .execute()
    )
    comments = []
    for item in res["items"]:

        comment = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
        like_count = item["snippet"]["topLevelComment"]["snippet"]["likeCount"]

        comments.append([id, clean_text(comment), like_count, "0"])

    nToken = res.get("nextPageToken")
    return (comments, nToken)


# Writes comments to csv file
def write_to_csv(file: Path, comments: List[Dict]):
    if not file.is_file():
        col_df = DataFrame(columns=COL_ORDER)
        col_df.to_csv(file, index=False)
    df = DataFrame(comments)
    df.to_csv(file, header=False, index=False, mode="a")


def main():
    
    data: None | Dict = load_token() if args.cache else None
    nToken = data["TOKEN"] if data else None
    video_id = data["VIDEO_ID"] if data else args.new

    print("-> Extract Started ...")

    while True:
        comments, nToken = extract_comments(video_id, nToken)
        write_to_csv(DATA_FILE, comments)

        if nToken and (args.progress or args.cache):
            save_token(video_id=video_id, token=nToken)
        else:
            print("-> Next Page Token Unavailable")
            break
        sleep(2)

    client.close()


if __name__ == "__main__":
    main()
    print("-> Extract Done!")
