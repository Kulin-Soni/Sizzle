### Merge data using this command. You may modify the path to other directories if needed.

from os import listdir
import pathlib
from pandas import concat, read_csv

def merge(dir: pathlib.Path):
  files = listdir(dir)
  concat(read_csv(pathlib.Path(dir / file)) for file in files).to_csv(pathlib.Path(dir / "merged.csv"))

if __name__ == "__main__":
  merge(pathlib.Path("labeled_data"))