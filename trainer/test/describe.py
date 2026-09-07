import pandas as pd
from pathlib import Path

DATA_FILE = Path("data/comments_combined.csv")
def main():
    df = pd.read_csv(DATA_FILE)
    print(df.describe())

if __name__ == "__main__":
    main()
