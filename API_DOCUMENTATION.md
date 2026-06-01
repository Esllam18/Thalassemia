# API DOCUMENTATION
## Railway AI API — Thalassemia Diagnosis

---

## Base URL

```
Production: https://thalassemia-api-production-1e64.up.railway.app
Local dev:  http://localhost:8000
```

The base URL is configured in `js/config.js` under `API_URL`.

---

## Authentication

The API is **open** — no API key is required. Rate limiting is applied per IP address.

---

## Endpoints

---

### GET `/health`

Check if the API and ML model are running.

**Response (200 OK):**
```json
{
  "status": "ok",
  "model_loaded": true,
  "encoder_loaded": true,
  "version": "3.1.0"
}
```

If the model failed to load:
```json
{
  "status": "degraded",
  "model_loaded": false,
  "encoder_loaded": false,
  "version": "3.1.0"
}
```

**When to call:** Use this to check if the API is available before making predictions.

---

### POST `/predict/manual`

Predict thalassemia from manually entered CBC values.

**Rate limit:** 10 requests per minute per IP

**Request body (JSON):**
```json
{
  "hgb": 11.2,
  "mcv": 65.0,
  "mch": 20.0,
  "rbc": 5.8
}
```

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `hgb` | float | 3–25 | Hemoglobin (g/dL) |
| `mcv` | float | 40–130 | Mean Corpuscular Volume (fL) |
| `mch` | float | 10–50 | Mean Corpuscular Hemoglobin (pg) |
| `rbc` | float | 1–8 | Red Blood Cell Count (×10¹²/L) — must be > 0 |

**Response (200 OK):**
```json
{
  "prediction": "Beta-Thalassemia Minor",
  "thalassemia_score": 5,
  "confidence": 0.991,
  "recommendation": "Beta thalassemia minor (trait) detected. Hemoglobin electrophoresis and genetic counselling recommended.",
  "explanation": "CBC values: HGB=11.2 g/dL, MCV=65.0 fL, MCH=20.0 pg, RBC=5.8 x10^12/L. Mentzer Index: 11.21 (supports thalassemia). Shine-Lal Index: 845.00. Model confidence: 99%.",
  "indicators": {
    "mentzer_index": 11.21,
    "shine_lal": 845.00
  }
}
```

**Error responses:**
```json
// 422 — Invalid values
{ "detail": "value is not a valid float" }

// 503 — Model not loaded
{ "detail": "ML model is not available. Check server logs." }
```

---

### POST `/predict/file`

Batch predict from a CSV or Excel file.

**Rate limit:** 5 requests per minute per IP

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | CSV or Excel (.csv, .xlsx, .xls) |

**File format requirements:**
- Must have columns: `HGB`, `MCV`, `MCH`, `RBC` (case-insensitive)
- Optional column: `NAME` (patient identifier)
- Max file size: 10 MB

**Example CSV:**
```csv
NAME,HGB,MCV,MCH,RBC
Patient A,11.2,65,20,5.8
Patient B,13.5,85,28,4.9
```

**Response (200 OK):**
```json
[
  {
    "patient": "Patient A",
    "result": {
      "prediction": "Beta-Thalassemia Minor",
      "thalassemia_score": 5,
      "confidence": 0.991,
      "recommendation": "...",
      "explanation": "...",
      "indicators": { "mentzer_index": 11.21, "shine_lal": 845.0 }
    }
  },
  {
    "patient": "Patient B",
    "result": {
      "prediction": "Normal",
      "thalassemia_score": 1,
      ...
    }
  }
]
```

If a row has an error:
```json
{
  "patient": "Patient C",
  "result": { "prediction": "ERROR: RBC cannot be zero." }
}
```

**Error responses:**
```json
// 415 — Wrong file type
{ "detail": "Unsupported type '.pdf'. Use: ['.csv', '.xls', '.xlsx']" }

// 422 — Missing columns
{ "detail": "Missing columns: ['HGB', 'RBC']" }

// 413 — File too large
{ "detail": "File exceeds 10 MB limit." }
```

---

### POST `/predict/image`

Extract CBC values from a lab report image using OCR, then predict.

**Rate limit:** 3 requests per minute per IP

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Image file (.png, .jpg, .jpeg, .webp, .gif, .bmp) |

**Tips for best OCR results:**
- Use clear, well-lit photos
- Ensure text is not blurry
- Higher resolution is better
- Printed lab reports work better than handwritten

**Response — Success (200 OK):**
```json
{
  "status": "success",
  "diagnosis": "Beta-Thalassemia Minor",
  "result": {
    "prediction": "Beta-Thalassemia Minor",
    "thalassemia_score": 5,
    "confidence": 0.991,
    "recommendation": "...",
    "explanation": "...",
    "indicators": { "mentzer_index": 11.21, "shine_lal": 845.0 }
  },
  "extracted_values": {
    "HGB": 11.2,
    "MCV": 65.0,
    "MCH": 20.0,
    "RBC": 5.8
  }
}
```

**Response — Partial extraction (200 OK):**
If OCR could not read all 4 values:
```json
{
  "status": "partial",
  "message": "Could not extract: ['MCH']. Try manual entry instead.",
  "detected": { "HGB": 11.2, "MCV": 65.0, "RBC": 5.8 },
  "missing_fields": ["MCH"]
}
```

The app shows this as a warning and suggests manual entry.

---

## Risk Score Reference

| Score | Category | Color | Meaning |
|-------|----------|-------|---------|
| 1–2 | Normal | 🟢 Green | No signs of thalassemia |
| 3–4 | Borderline | 🟡 Yellow-green | Borderline results, recheck |
| 5–6 | Possible | 🟠 Orange | Possible thalassemia, specialist advised |
| 7–8 | Likely | 🔴 Red | Likely thalassemia, urgent evaluation |
| 9–10 | Strong | 🔴 Dark Red | Strong thalassemia indication |

## Diagnosis Values

The `prediction` field can return these values:

| Diagnosis | Score |
|-----------|-------|
| Normal | 1 |
| Iron Deficiency Anemia | 2 |
| Borderline | 3 |
| Possible Thalassemia | 5 |
| Alpha/Beta Thalassemia Trait/Minor | 6 |
| Thalassemia Intermedia | 7 |
| Beta Thalassemia / Beta-Thalassemia Major | 8–9 |
| Thalassemia Major | 10 |

---

## Clinical Indices

The API computes two clinical indices from CBC values:

### Mentzer Index
```
Mentzer = MCV / RBC
```
- < 13 → Suggests thalassemia
- ≥ 13 → Suggests Iron Deficiency Anemia or Normal

### Shine-Lal Index
```
Shine-Lal = (MCV² × MCH) / 100
```
- Lower values suggest thalassemia

### MCV Override
If MCV ≥ 81.0 fL and the model predicts a non-Normal result, the API overrides the prediction to "Normal". This threshold is configurable via the `MCV_NORMAL_THRESHOLD` environment variable on Railway.

---

## JavaScript Integration Example

```javascript
// Manual prediction
const response = await fetch(`${CONFIG.API_URL}/predict/manual`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ hgb: 11.2, mcv: 65, mch: 20, rbc: 5.8 }),
});

if (!response.ok) {
  const err = await response.json();
  throw new Error(err.detail);
}

const result = await response.json();
console.log(result.prediction);       // "Beta-Thalassemia Minor"
console.log(result.thalassemia_score); // 5
console.log(result.confidence);        // 0.991
```
