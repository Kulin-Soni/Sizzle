# Sizzle (Model)

This directory contains all the code that was used to build the data, model and other back-end stuff for Sizzle.

## Installing Dependencies

Use [`uv`](https://docs.astral.sh/uv) or `pip` to install dependencies

```sh
pip install -r requirements.txt # pip
uv sync # uv
```

## Collecting Data

Comments can be easily extracted using Google Cloud API using the [src/extract.py](/src/extract.py) script. We used many sources to get variety of comments in multiple languages.

Required Columns:

|Comments               |Quality  |
|-----------------------|---------|
|The comment comes here |0.5      |
|Second comment here    |9.0      |

- **Comments**: Can be of any length.
- **Quality**: `10.0 <= n <= 0.0`

Additional telemetry columns like **Video Title** and **Likes** can also be added, not needed for training.

You can use [src/pretrain.py](/src/pretrain.py) to use an LLM for rating comments. In our case we used **[ibm-granite/granite-3.1-8b-instruct](https://huggingface.co/ibm-granite/granite-3.1-8b-instruct)** to rate our data (can be updated in future).

## Training

1. Use the [src/train.py](/src/train.py) script to get model weights.
2. `weights.json` file is generated which can used in the extension by copying the file to [extension/src/workers/model](../extension/src/workers/model).
3. [Bundle the extension](../extension/README.md) and reload the extension.
