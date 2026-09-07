import pandas as pd
from glob import glob
import re
import emoji # pip install emoji / uv add emoji
import os

def main():
    for file in glob("input/*.csv"):
        try:
            df = pd.read_csv(file)
        except Exception:
            os.remove(file)
            continue
        final = []
        for _, row in df.iterrows():
            comment = str(row["Comments"]).strip()
            no_emoji = emoji.replace_emoji(comment, "")
            if no_emoji == "":
                continue
            if len(no_emoji) < len(comment)*.5:
                continue
            if re.match(r'^https?:\/\/\S+$', no_emoji):
                continue
            if len(no_emoji) < 10:
                continue
            final.append(row)
        final_df = pd.DataFrame(final)
        final_df.drop_duplicates(subset=["Comments"], inplace=True)
        final_df.to_csv(file, index=False)
        print(f"Processed file: {file} | Left Rows: {final_df.shape[0]}")

if __name__ == "__main__":
    main()
