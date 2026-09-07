#!/usr/bin/env python3

import os
import glob
import time
import pandas as pd
from openai import OpenAI
from typing import TypedDict

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------
BASE_DIR = os.environ.get("SIZZLE_BASE_DIR", "")
INPUT_DIR = os.path.join(BASE_DIR, "input")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

COMMENT_COLUMN = "Comments"
QUALITY_COLUMN = "Quality"
BATCH_SIZE = 16
MODEL_NAME = "ibm/granite-3.1-8b"


class ETE(TypedDict):
    ete: str
    rate: str
    time_now: float


# Model used for rating. Any OpenAI chat-completion-capable model works.
# Reads OPENAI_API_KEY from the environment automatically.
client = OpenAI()

os.makedirs(OUTPUT_DIR, exist_ok=True)

RUBRIC = """You are an expert YouTube comment quality rater. Rate the comment below on a
scale from 0 to 10, regardless of language, based on how much genuine value it adds
to the conversation around the video.
 
Use these anchors as a guide (you may use any decimal value in between, e.g. 6.5, 7.2):
 
0-1   Spam or noise: pure emojis, "first!", bot-like or unrelated links/ads,
      a single meaningless word, or gibberish.
2-3   Low-effort reaction with no substance: "lol", "nice video", "😂😂😂",
      a generic compliment or insult with zero context or reasoning.
4-5   Relevant but shallow: agrees or disagrees with the video/creator, but gives
      no reasoning, evidence, or elaboration ("this is so true", "I disagree").
6-7   Adds something concrete: a specific observation about the video's content,
      a clarifying question, a relevant personal anecdote, or humor that actually
      engages with the specific content (not a generic joke).
8-9   Insightful and substantive: adds new information, a well-reasoned opinion or
      critique, meaningfully extends the discussion, or corrects/fact-checks
      something in the video with clear justification.
10    Exceptional: an original, well-articulated insight that could stand on its
      own as a mini-analysis, or a significant correction backed by solid evidence.
 
Guidelines:
- Judge the comment on its substance, not on grammar or spelling — broken English
  with real substance can still score high.
- Length is not a proxy for quality: a short comment with real insight beats a
  long rant with none.
- Sarcasm or jokes that clearly engage with the video's specific content can score good; generic jokes that could apply to any video should not.
- Comments using excessive emojis should score low.
- Use the full range and be decisive rather than defaulting to the middle. Use a
  decimal when the comment falls between two anchor points.
 
Respond with ONLY a number between 0 and 10 (decimals allowed, e.g. "7.5"),
nothing else — no words, no explanation, no punctuation.
 
Comment: "{comment}"
Score:"""


def rate_comment(comment: str, retries: int = 3):
    """Ask the model to rate a single comment. Returns a float score, or None on failure."""
    prompt = RUBRIC.format(comment=comment)
    messages = [{"role": "user", "content": prompt}]

    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                max_tokens=10,
                temperature=0.0,
            )
            content = response.choices[0].message.content.strip()
            return float(content.split()[0])
        except (ValueError, IndexError):
            # Model returned something unparseable - not worth retrying.
            return None
        except Exception as exc:
            # Transient API/network error - back off and retry.
            if attempt == retries - 1:
                print(
                    f"Warning: failed to rate comment after {retries} attempts: {exc}"
                )
                return None
            time.sleep(2**attempt)

    return None


def rate_batch(comments: list[str]) -> list[float]:
    ratings = []
    for comment in comments:
        rating = rate_comment(comment)
        ratings.append(rating if rating is not None else 0)
    return ratings


def format_duration(total_seconds: float):
    days, remainder = divmod(total_seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, seconds = divmod(remainder, 60)

    return f"{int(days)}D {int(hours)}H {int(minutes)}M {int(seconds)}S"


def calc_ete(last_finished: float, batch_size: int, total: int):
    now = time.time()
    rate = batch_size / (now - last_finished)
    ete = total / rate
    return ETE(
        {"ete": format_duration(ete), "rate": f"{rate:.2f} row(s)/s", "time_now": now}
    )


def main():
    input_files = sorted(glob.glob(os.path.join(INPUT_DIR, "*.csv")))
    print(f"Found {len(input_files)} input files.")

    for file_idx, in_path in enumerate(input_files, 1):
        fname = os.path.basename(in_path)
        out_path = os.path.join(OUTPUT_DIR, fname)

        df_in = pd.read_csv(in_path)
        total_rows = len(df_in)

        # Resume: figure out how many rows are already rated for this file
        if os.path.exists(out_path):
            df_out = pd.read_csv(out_path)
            df_out = df_out.loc[:, ~df_out.columns.duplicated()]
            already_done = len(df_out)
            if already_done >= total_rows:
                print(
                    f"[{file_idx}/{len(input_files)}] {fname}: already complete, skipping."
                )
                continue
            print(
                f"[{file_idx}/{len(input_files)}] {fname}: resuming from row {already_done}/{total_rows}"
            )
        else:
            # Initialize df_out with the same columns as df_in but empty, avoiding duplicate column names.
            df_out = df_in.iloc[0:0].copy()
            already_done = 0
            print(
                f"[{file_idx}/{len(input_files)}] {fname}: starting fresh ({total_rows} rows)"
            )

        remaining = df_in.iloc[already_done:]
        last_batch = time.time()

        # Process in batches, appending + saving after each batch (crash-safe)
        for start in range(0, len(remaining), BATCH_SIZE):
            chunk = remaining.iloc[start : start + BATCH_SIZE]
            scores = rate_batch(chunk[COMMENT_COLUMN].tolist())

            chunk = chunk.copy()
            chunk[QUALITY_COLUMN] = scores

            df_out = pd.concat([df_out, chunk], ignore_index=True)
            df_out.to_csv(out_path, index=False)  # overwrite with progress so far

            done_now = already_done + start + len(chunk)
            ete = calc_ete(
                last_batch,
                min(BATCH_SIZE, len(remaining) - start),
                len(remaining) - start,
            )
            last_batch = ete["time_now"]
            print(
                f"  {fname}: {done_now}/{total_rows} rows rated (ETE: {ete["ete"]} | RATE: {ete["rate"]})",
                end="\r",
            )

        print(
            f"  {fname}: done ({total_rows}/{total_rows}) (ETE: {ete["ete"]} | RATE: {ete["rate"]})"
        )

    print("All files complete.")


def two():
    print(rate_comment("mucho gusto :)"))


if __name__ == "__main__":
    main()
