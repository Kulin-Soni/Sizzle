import pandas as pd
import json
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import Ridge
from sklearn.utils.class_weight import compute_sample_weight
import joblib

df = pd.read_csv("labeled_data/merged.csv")

embedder = SentenceTransformer("all-MiniLM-L6-v2")

embeddings = embedder.encode(
    df["Comment"].tolist(),
    show_progress_bar=True
)
weights = compute_sample_weight(
    class_weight='balanced',
    y=(df["Quality"] > 0.6)
)

regressor = Ridge(alpha=1.0)
regressor.fit(embeddings, df["Quality"], sample_weight=weights)

joblib.dump(regressor, "regressor.pkl")
json.dump(
  {"coef": regressor.coef_.tolist(), "intercept": float(regressor.intercept_)},
  open("regressor.json", "w")
)

print("Initial model trained.")