### Predict quality scores using the model.

import json
from sentence_transformers import SentenceTransformer
import pandas as pd
import numpy as np
from pathlib import Path
from dotenv import load_dotenv
from os import environ

load_dotenv()
encoder = SentenceTransformer(environ["BASE_MODEL"])
with open("weights.json", "r", encoding="utf-8") as f:
    weights = json.load(f)

coef = np.array(weights["coef"], dtype=np.float32)
intercept = float(weights["intercept"])


def predict(text):
    embedding = encoder.encode([text])
    score = np.dot(embedding, coef) + intercept
    score = max(0.0, min(1.0, float(score[0])))
    score *= 10
    return score


def predict_dataframe(file_path: Path, prediction_file_path: Path):
    comments = pd.read_csv(file_path)
    scores = []
    for comment in list(comments["Comment"]):
        score = predict(str(comment))
        scores.append(round(float(score), 2))
    comments["Quality"] = scores
    comments.to_csv(prediction_file_path, index=False)
    print("Done!")


if __name__ == "__main__":
    pass
