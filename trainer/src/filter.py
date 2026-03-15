### The following filters were used in some cases to filter the incoming data.

import pandas as pd

def likes_threshold_filter(df: pd.DataFrame, threshold: float):
  max_likes = df["Likes"].max()
  filtered = df[ df["Likes"]>int(max_likes*threshold) ]
  return filtered

def word_threshold_filter(df: pd.DataFrame, min_threshold: int, max_threshold: int = 0):
  length = df["Comment"].str.split().str.len()
  filtered = df[ ((length<=max_threshold) | (max_threshold==0)) & (length>min_threshold) ]
  return filtered