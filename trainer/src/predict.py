### Predict quality scores using the model.

import joblib
from sentence_transformers import SentenceTransformer
import pandas as pd
from pathlib import Path

embedder = SentenceTransformer("all-MiniLM-L6-v2")
regressor = joblib.load("regressor.pkl")

def predict(text):
    embedding = embedder.encode([text])
    score = regressor.predict(embedding)[0]
    return max(0, min(1, score))

def predict_df(file_path: Path, prediction_file_path: Path):
    comments = pd.read_csv(file_path)
    scores = []
    for comment in list(comments["Comment"]):
        score = predict(str(comment))
        scores.append(round(float(score), 2))
    comments["Quality"] = scores
    comments.to_csv(prediction_file_path, index=False)
    print("Done!")

if __name__=="__main__":
    # predict_df(Path("raw_data/comments_4.csv"), Path("predicted_Data/prediction_3.csv"))
    pass