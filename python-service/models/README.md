# models/

This folder is intentionally empty of trained models.

The current classifier (`services/classifier.py`) is a **rule-based / keyword-scoring**
system - it is NOT a machine-learning model. It sits behind a single function,
`classify(text) -> dict`, so an ML model (for example a scikit-learn TF-IDF + Logistic
Regression pipeline, or a CNN on page images) can be added later:

1. Train and save the model into this folder (e.g. `models/doc_classifier.joblib`).
2. In `services/classifier.py`, load it and blend/replace the rule scores in `classify()`.
3. Keep the returned dict shape unchanged so the Node backend and mobile app need no edits.
