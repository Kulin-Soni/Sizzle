import json
from os import makedirs
from pathlib import Path
from typing import Dict

def save(file: Path, data: Dict):
  makedirs(file.parent, exist_ok=True)
  with open(file, "w") as f:
    json.dump(data, f)

def load(file: Path) -> Dict:
  try:
    with open(file, "r") as f:
      return json.load(f)
  except FileNotFoundError:
    open(file, "w").close()
    return {}