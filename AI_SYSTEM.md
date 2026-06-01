# AI SYSTEM DOCUMENTATION
## How the Thalassemia AI Model Works

---

## Overview

The AI system is a **machine learning model** trained to classify thalassemia types from 4 blood test values. It runs as a Python API on Railway.

Think of it like this:
```
You give it: HGB, MCV, MCH, RBC values
It gives back: diagnosis + confidence + risk score
```

---

## The 4 Input Values (CBC)

| Value | Full Name | Unit | What it measures |
|-------|-----------|------|-----------------|
| HGB | Hemoglobin | g/dL | Oxygen-carrying protein in red blood cells |
| MCV | Mean Corpuscular Volume | fL | Average size of red blood cells |
| MCH | Mean Corpuscular Hemoglobin | pg | Average hemoglobin per red blood cell |
| RBC | Red Blood Cell Count | ×10¹²/L | Number of red blood cells |

Thalassemia causes red blood cells to be **smaller** and **fewer** than normal. The AI detects these patterns.

---

## Step-by-Step: What Happens When You Click "Analyze"

### Step 1 — Validation
The app checks that all 4 values are:
- Present (not empty)
- Numbers (not text)
- Within valid medical ranges:
  - HGB: 3–25 g/dL
  - MCV: 40–130 fL
  - MCH: 10–50 pg
  - RBC: 1–8 ×10¹²/L

### Step 2 — Compute Clinical Indices
The API computes two derived values:

**Mentzer Index:**
```
Mentzer = MCV ÷ RBC
```
- If Mentzer < 13 → suggests thalassemia
- If Mentzer ≥ 13 → suggests Iron Deficiency Anemia or Normal
- This index has been used by clinicians since 1973

**Shine-Lal Index:**
```
Shine-Lal = (MCV² × MCH) ÷ 100
```
- A lower value is more associated with thalassemia

### Step 3 — ML Model Prediction
The model receives 6 features:
```python
features = [MCV, MCH, HGB, RBC, Mentzer_Index, Shine_Lal]
```

The model was trained on labeled CBC data. It outputs:
- A predicted diagnosis class (e.g., "Beta-Thalassemia Minor")
- A probability (confidence) for each possible class

### Step 4 — MCV Override
If the MCV value is ≥ 81.0 fL (normal range) and the model predicted a non-Normal result, the API **overrides the prediction to "Normal"**.

Why? High MCV strongly suggests the red blood cells are **not** microcytic (small), which rules out most thalassemias. This is a clinical safety rule.

### Step 5 — Score & Recommendation
The diagnosis is mapped to a risk score (1–10) and a clinical recommendation text.

### Step 6 — Response
The API returns all of this as a JSON response.

### Step 7 — Save to Database
The app saves the result to the `predictions` table in Supabase, linked to the logged-in user.

---

## File Upload Mode

When a CSV/Excel file is uploaded:
1. The API reads it as a table
2. Each row is processed independently through Steps 1–6
3. All results are returned as an array

This allows batch analysis of many patients at once.

---

## Image (OCR) Mode

When a lab report image is uploaded:
1. The image is decoded with OpenCV
2. The image is preprocessed (grayscale, resize ×2.5, threshold)
3. Tesseract OCR reads the text from the image
4. Regex patterns search for the 4 values:
   - Looks for "HGB" / "Hemoglobin" followed by a number
   - Looks for "MCV" followed by a number
   - Looks for "MCH" followed by a number
   - Looks for "RBC" followed by a number
5. Values are validated against normal ranges
6. If all 4 values are found → runs prediction
7. If some values are missing → returns "partial" status with which ones were found

**Why OCR sometimes fails:**
- Blurry images
- Unusual lab report formats
- Handwritten values
- Very small text

**Tip:** If OCR fails, use the extracted values as a starting point for manual entry.

---

## Model Details

| Property | Value |
|----------|-------|
| Algorithm | Expert ML model (sklearn-based) |
| File | `thalassemia_expert_model.pkl` |
| Label Encoder | `label_encoder.pkl` |
| Framework | Python + scikit-learn + FastAPI |
| Hosting | Railway (us-west region) |

The model files (`*.pkl`) are loaded once when the API starts up (at boot time). They stay in memory for the lifetime of the server process. This makes predictions fast (no disk reads per request).

---

## Rate Limits

The API protects against abuse with per-IP rate limits:

| Endpoint | Limit |
|----------|-------|
| `/predict/manual` | 10 requests per minute |
| `/predict/file` | 5 requests per minute |
| `/predict/image` | 3 requests per minute |

If you hit a rate limit, the API returns HTTP 429. The app shows the message: "Too many requests. Please wait a moment and try again."

---

## Error Handling

The API is designed to never show Python tracebacks. All errors return clean JSON:

```json
{ "detail": "Human-readable error message." }
```

Every response also includes an `X-Request-ID` header — a unique ID you can use to look up errors in the Railway logs.

---

## Changing the MCV Threshold

The MCV threshold (default 81.0 fL) is an environment variable on Railway:

1. Go to Railway Dashboard → your project → Variables
2. Change `MCV_NORMAL_THRESHOLD` to your desired value
3. Click Save — Railway redeploys automatically

---

## Adding New Diagnosis Types

If the ML model is retrained with new classes:

1. The new diagnosis labels must be added to `score_map` in `main.py`
2. The new diagnosis labels must be added to `rec_map` in `main.py`
3. Redeploy the API on Railway
4. No changes needed in the web app

---

## Testing the API Directly

You can test the API in your browser:

Open: `https://thalassemia-api-production-1e64.up.railway.app/docs`

This is the automatic Swagger UI — you can run test predictions right from the browser without any code.
