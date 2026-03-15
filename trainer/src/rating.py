### 
# This file is to be used independently. This introduces a manual labeling method
# which can be used to easily modify predictions made by model or manually rating.
###

import tkinter as tk
import pandas as pd
from pathlib import Path
from json_util import load, save

PROGRESS_FILE = Path("progress.json") # A progress logger file which stores the row you are on in the progress, useful if you close the program and wanna continue from your last position.
COMMENTS_FILE = Path("predicted_data/predicted_1.csv") # The file to be labeled.
LABELED_FILE = Path("labeled_data/comments_labeled_6.csv") # Where to store the labeled data.
data = pd.read_csv(COMMENTS_FILE)
prog = int(load(PROGRESS_FILE).get("ROW") or 0)
e = prog

def save_score(score: float | int):
    global prog, e
    df = pd.DataFrame([data.iloc[prog]])
    df["Quality"] = score
    save(PROGRESS_FILE, {"ROW": prog+1})
    df.to_csv(LABELED_FILE, header=(True if e==0 else False), index=False, mode='a')
    e+=1

def show_comment():
    comment_text.delete("1.0", tk.END)
    current = data.iloc[prog]
    comment_text.insert(tk.END, f"{current["Comment"]}\n\nModel Prediction: {current["Quality"]}\nLikes: {current["Likes"]}")
    index_label.config(text=f"{prog+1}/{len(data)}")

def on_key(event):
    global prog
    
    if event.char.isdigit():
        save_score(round(int(event.char) * 0.1, 1))
        if prog < len(data) - 1:
            prog += 1
            show_comment()

    elif event.keysym == "Return":
        save_score(data.iloc[prog]["Quality"])
        if prog < len(data) - 1:
            prog += 1
            show_comment()

    elif event.keysym == "Delete":
        if prog < len(data) - 1:
            prog += 1
            show_comment()


if __name__ == "__main__":
    root = tk.Tk()
    root.title("Comment Labeler")
    root.geometry("800x400")
    root.configure(bg="#2b2b2b")
    root.bind("<Key>", on_key)

    index_label = tk.Label(root, text="", bg="#2b2b2b", fg="white")
    index_label.pack()

    comment_text = tk.Text(root, wrap="word", font=("Arial", 20), fg="white", bg="#2b2b2b")
    comment_text.pack(expand=True, fill="both")

    show_comment()
    root.mainloop()