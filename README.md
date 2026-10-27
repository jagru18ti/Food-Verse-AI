# Food Verse AI 🥑🥦🍅

> **Next-Gen Multimodal Produce Recognition & Culinary Intelligence Platform**  
> A lightweight, local-first web application featuring a deep learning produce classification engine (MobileNetV3-Large), real-time nutritional intelligence, freshness auditing, and interactive culinary tools.

---

## Table of Contents
1. [Project Overview & Architecture](#project-overview--architecture)
2. [System Requirements](#system-requirements)
3. [Windows Setup & Startup Guide (PowerShell)](#windows-setup--startup-guide-powershell)
4. [Neural Model & 15 Supported Produce Classes](#neural-model--15-supported-produce-classes)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Image Upload Workflow & Uncertainty Advisory](#image-upload-workflow--uncertainty-advisory)
7. [Testing, Linting & Build Verification](#testing-linting--build-verification)
8. [Real-World Limitations](#real-world-limitations)
9. [Common Setup Troubleshooting](#common-setup-troubleshooting)

---

## Project Overview & Architecture

Food Verse AI is built with a decoupled client-server architecture designed for fast, local-first CPU execution without requiring external cloud AI credentials, API tokens, or complex database setups.

```
                      ┌──────────────────────────────────────┐
                      │          React 19 + Vite UI          │
                      │       (http://localhost:5173)        │
                      └──────────────────┬───────────────────┘
                                         │  Multipart Upload / JSON API
                                         ▼
                      ┌──────────────────────────────────────┐
                      │          FastAPI Backend API         │
                      │       (http://127.0.0.1:8000)        │
                      └──────────────────┬───────────────────┘
                                         │  In-Memory Tensor Stream
                                         ▼
                      ┌──────────────────────────────────────┐
                      │     MobileNetV3-Large (PyTorch)      │
                      │       15-Class CPU Inference         │
                      └──────────────────────────────────────┘
```

- **Frontend (`/frontend`)**: Built with React 19, Vite 8, Lucide React icons, and custom responsive Vanilla CSS. Features an intuitive drag-and-drop produce uploader, interactive top-3 prediction cards, culinary macro visualizers, and quick-load demo produce samples.
- **Backend (`/backend`)**: Built with FastAPI and Uvicorn. Exposes 8 RESTful endpoints for real-time model inference, freshness assessment, nutrition breakdown, recipe generation, and commercial hygiene auditing.
- **Neural Vision Engine (`/backend/classifier.py`)**: Utilizes a fine-tuned MobileNetV3-Large convolutional neural network. Evaluates uploaded images entirely on the CPU in ~30–60 milliseconds with zero GPU requirement.

---

## System Requirements

The application runs locally on standard consumer hardware:

| Component | Minimum / Tested Version | Notes |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11 (or macOS / Linux) | Tested on Windows 11 AMD64 |
| **Python** | Python 3.10 to 3.13 | Tested with Python 3.13.7 |
| **Node.js** | Node.js v18.0.0+ | Tested with Node.js v26.7.0 and npm 11.19.0 |
| **Hardware** | Standard Dual-Core CPU, 4 GB RAM | No dedicated GPU or CUDA setup required |
| **Cloud Keys** | None | 100% self-contained and private |

---

## Windows Setup & Startup Guide (PowerShell)

To run the complete application, open two separate PowerShell terminal windows (one for the backend and one for the frontend).

### Terminal 1: Backend Setup & Launch

```powershell
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment (only needed on first setup)
python -m venv venv

# 3. Activate the virtual environment
.\venv\Scripts\Activate.ps1

# 4. Install backend dependencies
pip install -r requirements.txt

# 5. Start the FastAPI development server
uvicorn main:app --reload --port 8000
```

Once running:
- **API Server**: `http://127.0.0.1:8000`
- **Interactive API Documentation (Swagger)**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/api/health`

> **Note for Windows Users:** If PowerShell prevents script execution when activating the virtual environment, run:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

---

### Terminal 2: Frontend Setup & Launch

```powershell
# 1. Navigate to the frontend directory
cd frontend

# 2. Install Node dependencies (only needed on first setup)
npm install

# 3. Start the Vite development server
npm run dev
```

Once running:
- **Application UI**: `http://localhost:5173`

---

## Neural Model & 15 Supported Produce Classes

The vision classifier is located at:
- **Model Checkpoint**: `backend/models/food_classifier.pt` (16.30 MB)
- **Class Indices**: `backend/models/class_indices.json`

The neural network is specialized to recognize **exactly 15 classes of fresh produce**:

| Index | Class Identifier | Common Display Name | Scientific Name |
| :---: | :--- | :--- | :--- |
| `0` | `Bean` | French Beans (Green Beans) | *Phaseolus vulgaris* |
| `1` | `Bitter_Gourd` | Bitter Gourd (Karela) | *Momordica charantia* |
| `2` | `Bottle_Gourd` | Bottle Gourd (Lauki / Doodhi) | *Lagenaria siceraria* |
| `3` | `Brinjal` | Eggplant (Aubergine / Baingan) | *Solanum melongena* |
| `4` | `Broccoli` | Fresh Crown Broccoli | *Brassica oleracea var. italica* |
| `5` | `Cabbage` | Crisp Green Cabbage (Patta Gobhi) | *Brassica oleracea var. capitata* |
| `6` | `Capsicum` | Green Bell Pepper (Capsicum / Shimla Mirch) | *Capsicum annuum* |
| `7` | `Carrot` | Sweet Orange Carrot (Gajar) | *Daucus carota subsp. sativus* |
| `8` | `Cauliflower` | White Snowball Cauliflower (Phool Gobhi) | *Brassica oleracea var. botrytis* |
| `9` | `Cucumber` | Crisp Garden Cucumber (Kheera) | *Cucumis sativus* |
| `10` | `Papaya` | Culinary Green Papaya (Kacha Papita) | *Carica papaya* |
| `11` | `Potato` | Fresh Harvest Potato (Aloo) | *Solanum tuberosum* |
| `12` | `Pumpkin` | Golden Ribbed Pumpkin (Kaddu) | *Cucurbita moschata* |
| `13` | `Radish` | Daikon White Radish (Mooli) | *Raphanus sativus* |
| `14` | `Tomato` | Ripe Vine Tomato (Tamatar) | *Solanum lycopersicum* |

Each recognized class is linked to a comprehensive nutritional and culinary profile, including calorie count, macronutrient breakdown, glycemic index, optimal storage protocols, and chef preparation tips.

---

## API Endpoints Reference

The FastAPI service exposes 8 documented endpoints:

| Method | Endpoint | Description | Request Payload / Format |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Root service banner and API navigation links | None |
| `GET` | `/api/` | Metadata, system version, and active service capabilities | None |
| `GET` | `/api/health` | Service uptime, memory health, and vision model status | None |
| `POST` | `/api/recognize-upload` | **Core Vision Endpoint**: Neural classification of uploaded produce photo | Multipart Form (`file`: image binary) |
| `POST` | `/api/recognize` | Preset culinary dish identification simulator | JSON (`dish_id`, `food_name`) |
| `POST` | `/api/freshness` | Visual freshness index, shelf-life estimate, and storage guidelines | JSON (`item_name`, `storage_type`) |
| `POST` | `/api/nutrition` | Macro- and micronutrient profile scaled by portion weight | JSON (`food_name`, `portion_grams`) |
| `POST` | `/api/cooking-assistant` | AI chef recipe generator tailored to pantry ingredients and diet | JSON (`ingredients`, `dietary_preference`) |
| `POST` | `/api/hygiene-audit` | HACCP food safety and kitchen sanitation audit evaluator | JSON (`surface_cleanliness`, `temperature_control`) |

---

## Image Upload Workflow & Uncertainty Advisory

### Upload Specifications
- **Accepted Formats**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, `.jfif`
- **File Size Limit**: Maximum **10 MB** (enforced by both frontend file validation and backend HTTP guards).
- **Processing Steps**:
  1. **EXIF Transposition**: Smartphone orientation metadata is automatically respected via `PIL.ImageOps.exif_transpose()` so rotated phone photos are analyzed upright.
  2. **Aspect-Preserving Resize**: The shorter image dimension is scaled to 256 pixels, followed by a 224×224 center crop, preventing distortion of elongated vegetables.
  3. **Tensor Normalization**: Normalized with standard ImageNet distribution constants.

### Model Confidence & Honest Uncertainty Advisories
- The confidence score returned by the model represents a **mathematical softmax probability across the 15 supported classes**. It is **not** an absolute real-world truth guarantee.
- **Automated Ambiguity Advisory**: If the top prediction confidence falls below **65%** or the margin between the top two candidates is narrower than **15%**, the application triggers an informative advisory banner:
  > *"Heuristic Advisory: This image may contain complex backgrounds, multiple produce items, or foods outside the 15 supported vegetable categories. For clearer results, crop closely around a single supported vegetable on a clean surface."*

---

## Testing, Linting & Build Verification

The project includes built-in verification scripts and build commands:

### Frontend Code Quality & Production Build
```powershell
cd frontend

# Run Oxlint for static code analysis
npm run lint

# Compile and verify the production bundle
npm run build
```

### Backend Automated Regression Suite
With the backend running and virtual environment active, run the end-to-end regression test suite from the repository root:
```powershell
python scratch/test_step9_regression.py
```
This suite verifies:
- Service health and metadata endpoints.
- 100% accuracy on canonical validation samples across test classes.
- Valid image format handling (PNG, WEBP, BMP).
- Graceful rejection of corrupt images, empty payloads, non-image files, and files exceeding 10 MB.
- Heuristic advisory triggers on complex images.

---

## Real-World Limitations

To set honest expectations for real-world presentations and testing:

1. **Closed-Set Classification**: The model is trained strictly on **15 vegetable varieties**. It cannot identify meats, processed foods, prepared meals, or fruits outside its vocabulary (e.g., apples, bananas, or oranges).
2. **Multiple Objects in One Frame**: If an image contains several different vegetables together, the model will output a single class based on the dominant feature, which may cause ambiguous scores.
3. **Complex Backgrounds**: Busy kitchen counters, patterned cutting boards, heavy cast shadows, or extreme angles can lower prediction certainty.
4. **Advisory Freshness & Nutrition**: Freshness scores and shelf-life estimates are based on standard culinary benchmarks and do not replace professional laboratory or food safety testing.

---

## Common Setup Troubleshooting

### 1. PowerShell Script Execution Disabled
- **Symptom**: `.\venv\Scripts\Activate.ps1 cannot be loaded because running scripts is disabled on this system.`
- **Fix**: Open PowerShell as Current User and run:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

### 2. Port 8000 or 5173 Already in Use
- **Symptom**: `[Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000)`
- **Fix**: Locate and stop the conflicting process, or run uvicorn on an alternate port:
  ```powershell
  uvicorn main:app --reload --port 8001
  ```

### 3. Missing Checkpoint Error
- **Symptom**: `Model is not initialized or checkpoint file is missing.`
- **Fix**: Verify that `backend/models/food_classifier.pt` exists and is approximately 16.3 MB.

### 4. Upload Error: File Exceeds 10 MB
- **Symptom**: `400 Bad Request: Uploaded file exceeds 10 MB maximum limit.`
- **Fix**: Compress or resize the image before uploading. Most camera photos can be reduced to under 5 MB with no loss in recognition fidelity.

---

## License & Attribution
Food Verse AI is developed for educational and experimental produce intelligence research. Built with FastAPI, PyTorch, torchvision, and React.
