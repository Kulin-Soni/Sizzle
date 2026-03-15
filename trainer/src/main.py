### This file can be used to execute commands from different files.


import pandas as pd
# import re
from pathlib import Path
from predict import predict_df
# from filter import likes_threshold_filter, word_threshold_filter
# df = pd.read_csv("raw_data/comments_1.csv")
# f1 = likes_threshold_filter(df, (1/8000))
# f2 = word_threshold_filter(f1, 4)
# f3 = f2[
#   (~f2["Comment"].str.contains(r'https?://[^\s]+|www\.[^\s]+', regex=True)) & 
#   (~f2["Comment"].str.contains("Watch", case=False)) &
#   (~f2["Comment"].str.contains("Kon", case=False)) &
#   (~f2["Comment"].str.contains("Keep Sharing", case=False))
# ]
# f3.to_csv("raw_data/filtered.csv", index=False)
predict_df(Path("raw_data/comments_5.csv"), Path("predicted_data/prediction_4.csv"))

df2 = pd.read_csv("predicted_data/prediction_4.csv")
print(df2.describe())