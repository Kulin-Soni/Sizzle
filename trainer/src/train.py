import pandas as pd
import json
import glob
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import Ridge
from sklearn.utils.class_weight import compute_sample_weight
from dotenv import load_dotenv
from os import environ

load_dotenv()


def main():
    dfs = []
    for file in glob.glob("output/*.csv"):
        df = pd.read_csv(file)
        dfs.append(df)
    main_df = pd.concat(dfs, ignore_index=True)

    encoder = SentenceTransformer(environ["BASE_MODEL"])

    embeddings = encoder.encode(main_df["Comments"].tolist(), show_progress_bar=True)
    weights = compute_sample_weight(class_weight="balanced", y=(main_df["Quality"] > 6))

    regressor = Ridge(alpha=1.0)
    regressor.fit(embeddings, main_df["Quality"], sample_weight=weights)

    json.dump(
        {"coef": regressor.coef_.tolist(), "intercept": float(regressor.intercept_)},
        open("weights.json", "w"),
    )


if __name__ == "__main__":
    main()
