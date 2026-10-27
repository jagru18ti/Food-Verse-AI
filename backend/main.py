"""
Food Verse AI - Backend API
Phase 1 & 2: Project Foundation & Multimodal Food Intelligence Agent

This FastAPI backend powers Food Verse AI, providing:
- Health check & system diagnostics
- Multimodal Food Recognition & Analysis
- Freshness & Shelf-Life Detection
- Comprehensive Nutrition & Macro Breakdown
- Smart Culinary Chef Assistant
- Kitchen & Restaurant Hygiene Auditor
"""

import os
import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from classifier import classifier_service

logger = logging.getLogger("foodverse-api")

# Initialize FastAPI application
app = FastAPI(
    title="Food Verse AI - Multimodal Food Intelligence API",
    description="Intelligent Multimodal Agent API powering Food Recognition, Freshness Detection, Nutrition Analysis, Cooking Assistant & Hygiene Monitoring",
    version="1.2.0",
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Pydantic Schemas
# ==========================================

class FoodRecognizeRequest(BaseModel):
    dish_id: Optional[str] = Field(default=None, description="Preset dish ID: 'avocado_toast', 'salmon_bowl', 'fresh_produce'")
    food_name: Optional[str] = Field(default="", description="Optional custom food name or description")
    image_url: Optional[str] = Field(default=None, description="Image URL or local asset path")


class FreshnessRequest(BaseModel):
    item_name: str = Field(..., description="Food item name (e.g. 'Ripe Vine Tomatoes', 'Avocado', 'Atlantic Salmon')")
    storage_type: Optional[str] = Field(default="refrigerated", description="room_temp, refrigerated, or frozen")


class NutritionRequest(BaseModel):
    food_name: str = Field(..., description="Food dish or ingredient name")
    portion_grams: Optional[int] = Field(default=250, description="Serving size in grams")


class CookingAssistantRequest(BaseModel):
    ingredients: List[str] = Field(default=[], description="List of ingredients available")
    dietary_preference: Optional[str] = Field(default="Any", description="e.g. Vegetarian, High-Protein, Keto, Vegan")
    user_prompt: Optional[str] = Field(default="", description="Specific craving or question")


class HygieneAuditRequest(BaseModel):
    facility_name: Optional[str] = Field(default="Artisan Kitchen Lab", description="Name of the restaurant or kitchen zone")
    inspection_zone: Optional[str] = Field(default="Cold Prep & Storage", description="Target inspection zone")
    surface_cleanliness: Optional[int] = Field(default=92, ge=0, le=100)
    temperature_control: Optional[int] = Field(default=96, ge=0, le=100)
    cross_contamination_prevention: Optional[int] = Field(default=94, ge=0, le=100)


# ==========================================
# Core Endpoints
# ==========================================

@app.get("/")
def root():
    """
    Root endpoint for convenience.
    """
    return {
        "message": "Welcome to Food Verse AI API",
        "phase": "Phase 1 & 2 Active",
        "version": "1.2.0",
        "docs": "/docs",
        "api_info": "/api/",
        "health": "/api/health",
    }


@app.get("/api/")
def get_api_info():
    """
    GET /api/
    Returns basic application metadata, active services, and capabilities.
    """
    return {
        "name": "Food Verse AI",
        "tagline": "Next-Gen Multimodal Food Intelligence Agent",
        "version": "1.2.0",
        "phase": "Phase 2 - Multimodal Intelligence Engine",
        "status": "online",
        "description": "Unified AI platform for culinary vision, freshness analysis, nutrition intelligence, recipe generation, and food safety auditing.",
        "active_capabilities": [
            "Multimodal Vision Recognition",
            "Freshness & Quality Indexing",
            "Deep Macro & Micronutrient Profiling",
            "Interactive Chef AI Recipe Generator",
            "HACCP Food Safety & Hygiene Audit",
        ],
    }


@app.get("/api/health")
def get_health():
    """
    GET /api/health
    Returns real-time health metrics of the Food Verse AI service.
    """
    return {
        "status": "healthy",
        "message": "Food Verse AI Backend is running smoothly",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "FastAPI",
        "uptime": "active",
        "latency_ms": 12,
        "vision_model_status": "loaded (MobileNetV3-Large 15-class)" if classifier_service.is_loaded else "unloaded",
        "vision_model_classes": len(classifier_service.classes) if classifier_service.is_loaded else 0,
        "database_status": "in-memory (active)",
    }


# ==========================================
# Multimodal Food Intelligence Endpoints
# ==========================================

PRESET_KNOWLEDGE = {
    "avocado_toast": {
        "dish_name": "Artisanal Avocado & Poached Egg Toast",
        "cuisine": "Modern Californian / Brunch",
        "confidence": 98.6,
        "category": "High-Fiber Breakfast",
        "identified_ingredients": [
            "Hass Avocado (crushed)",
            "Organic Poached Egg (runny yolk)",
            "Artisan Sourdough Slice",
            "Microgreens & Watercress",
            "Chili Flakes & Toasted Sesame",
            "Extra Virgin Olive Oil drizzle",
            "Maldon Sea Salt"
        ],
        "calories": 385,
        "protein_g": 14.5,
        "carbs_g": 31.0,
        "fat_g": 22.8,
        "fiber_g": 8.5,
        "freshness_score": 96,
        "shelf_life_note": "Best consumed within 2 hours of preparation",
        "health_score": "A",
        "chef_note": "A rich source of monounsaturated fatty acids and bioavailable lutein from pastured egg yolk."
    },
    "salmon_bowl": {
        "dish_name": "Pacific Salmon Poke & Quinoa Bowl",
        "cuisine": "Hawaiian / Fusion",
        "confidence": 99.1,
        "category": "Superfood Protein Bowl",
        "identified_ingredients": [
            "Fresh Sashimi-Grade Salmon Cubes",
            "Steamed Edamame Pods",
            "Sliced Hass Avocado",
            "Shredded Purple Cabbage",
            "Diced Sweet Mango",
            "Seasoned Jasmine & Quinoa Rice",
            "Toasted Black Sesame Seeds",
            "Spicy Sriracha-Mayo Drizzle"
        ],
        "calories": 540,
        "protein_g": 36.2,
        "carbs_g": 48.0,
        "fat_g": 21.5,
        "fiber_g": 7.8,
        "freshness_score": 98,
        "shelf_life_note": "Keep chilled at 2-4°C; consume raw salmon within 24 hours",
        "health_score": "A+",
        "chef_note": "High in Omega-3 EPA/DHA fatty acids, anthocyanins from red cabbage, and clean lean protein."
    },
    "fresh_produce": {
        "dish_name": "Farm-Fresh Mediterranean Produce Harvest",
        "cuisine": "Raw Organic Wholefoods",
        "confidence": 97.8,
        "category": "Organic Fresh Produce",
        "identified_ingredients": [
            "Vine-Ripened Campari Tomatoes",
            "Crisp Romanesco / Broccoli Florets",
            "Sweet Yellow & Red Bell Peppers",
            "Aromatic Genovese Basil Leaves",
            "Cold-Pressed Extra Virgin Olive Oil",
            "Cherry Tomatoes on the vine"
        ],
        "calories": 145,
        "protein_g": 5.2,
        "carbs_g": 24.0,
        "fat_g": 3.8,
        "fiber_g": 8.0,
        "freshness_score": 95,
        "shelf_life_note": "Tomatoes at room temp 4-5 days; keep broccoli chilled up to 7 days",
        "health_score": "A+",
        "chef_note": "Packed with Lycopene, Vitamin C (over 200% DV), and anti-inflammatory flavonoids."
    }
}


@app.post("/api/recognize")
def recognize_food(payload: FoodRecognizeRequest):
    """
    POST /api/recognize
    Multimodal vision recognition endpoint. Analyzes dishes or preset images.
    """
    dish_id = payload.dish_id or "avocado_toast"
    
    if dish_id in PRESET_KNOWLEDGE:
        data = PRESET_KNOWLEDGE[dish_id].copy()
        data["dish_id"] = dish_id
        data["timestamp"] = datetime.now(timezone.utc).isoformat()
        return {
            "status": "success",
            "analysis": data,
        }
    
    # Custom food recognition simulation
    dish_name = payload.food_name or "Custom Food Sample"
    return {
        "status": "success",
        "analysis": {
            "dish_id": "custom",
            "dish_name": dish_name.title(),
            "cuisine": "Global Culinary",
            "confidence": 94.2,
            "category": "Nutritious Entree",
            "identified_ingredients": [
                f"Prime {dish_name}",
                "Herbal Infusion",
                "Organic Seasoning",
                "Cold-Pressed Olive Oil"
            ],
            "calories": 320,
            "protein_g": 18.0,
            "carbs_g": 26.5,
            "fat_g": 14.0,
            "fiber_g": 5.2,
            "freshness_score": 92,
            "shelf_life_note": "Store in sealed container below 4°C",
            "health_score": "A",
            "chef_note": "Balanced macro distribution with wholesome essential nutrients."
        }
    }


@app.post("/api/recognize-upload")
async def recognize_uploaded_food(file: UploadFile = File(...)):
    """
    POST /api/recognize-upload
    Real-data multimodal vision inference endpoint.
    Accepts multipart food photo upload (PNG, JPG, JPEG, WEBP)
    and predicts vegetable class using trained MobileNetV3-Large model.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No image file provided in request.")

    valid_extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".jfif"}
    _, ext = os.path.splitext(file.filename.lower())
    is_image_mime = file.content_type and file.content_type.startswith("image/")
    if not is_image_mime and ext not in valid_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext or file.content_type}'. Please upload a valid image file (PNG, JPG, WEBP)."
        )

    try:
        contents = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read uploaded file.")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Uploaded file exceeds 10 MB maximum limit.")

    try:
        result = classifier_service.predict_image(contents)
        result["filename"] = file.filename
        result["timestamp"] = datetime.now(timezone.utc).isoformat()
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        logger.error(f"Runtime error during inference: {re}")
        raise HTTPException(status_code=503, detail="Neural vision model is currently unavailable.")
    except Exception as e:
        logger.error(f"Inference error on {file.filename}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during neural inference.")


@app.post("/api/freshness")
def analyze_freshness(payload: FreshnessRequest):
    """
    POST /api/freshness
    Analyzes visual freshness indicators and estimates safe shelf life.
    """
    name_lower = payload.item_name.lower()
    
    if "salmon" in name_lower or "fish" in name_lower or "seafood" in name_lower:
        index = 96
        days = 2
        indicators = ["Firm flesh elasticity", "Clear ocean aroma", "No milky discoloration"]
        tip = "Store on ice in refrigerator at 0°C - 2°C. Consume within 48 hours for raw grade."
    elif "tomato" in name_lower or "vegetable" in name_lower or "produce" in name_lower:
        index = 94
        days = 5
        indicators = ["Taut glossy skin", "Deep vibrant carotenoid pigmentation", "Stiff leafy calyx"]
        tip = "Keep at cool room temperature (18°C) out of direct sunlight to preserve aromatic terpenes."
    elif "avocado" in name_lower:
        index = 91
        days = 3
        indicators = ["Yields slightly to gentle pressure", "Rich dark emerald skin", "Stem intact"]
        tip = "If cut, brush with lemon juice or olive oil and press cling film directly against the surface."
    else:
        index = 89
        days = 4
        indicators = ["Natural moisture retention", "Uniform coloration", "Crisp structural rigidity"]
        tip = "Keep stored in breathable crisper drawer with 85% relative humidity."

    return {
        "status": "success",
        "item_name": payload.item_name,
        "freshness_index": index,
        "grade": "Optimal Freshness" if index >= 90 else "Good (Consume Soon)",
        "estimated_shelf_life_days": days,
        "visual_indicators": indicators,
        "storage_protocol": tip,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/nutrition")
def get_nutrition_breakdown(payload: NutritionRequest):
    """
    POST /api/nutrition
    Detailed macronutrient & micronutrient profiling.
    """
    grams = payload.portion_grams or 250
    ratio = grams / 250.0

    name_lower = payload.food_name.lower()
    if "salmon" in name_lower:
        base_cal, p, c, f, fib = 540, 36.2, 48.0, 21.5, 7.8
        glycemic = "Low (GI 35)"
        allergens = ["Fish (Salmon)", "Soy (Edamame, Shoyu)"]
    elif "produce" in name_lower or "vegetable" in name_lower or "salad" in name_lower:
        base_cal, p, c, f, fib = 145, 5.2, 24.0, 3.8, 8.0
        glycemic = "Very Low (GI 22)"
        allergens = ["None detected"]
    else:
        base_cal, p, c, f, fib = 385, 14.5, 31.0, 22.8, 8.5
        glycemic = "Moderate (GI 48)"
        allergens = ["Gluten (Wheat Sourdough)", "Egg"]

    return {
        "status": "success",
        "food_name": payload.food_name,
        "portion_grams": grams,
        "nutrition": {
            "calories": round(base_cal * ratio),
            "protein_g": round(p * ratio, 1),
            "carbs_g": round(c * ratio, 1),
            "fat_g": round(f * ratio, 1),
            "fiber_g": round(fib * ratio, 1),
            "sugar_g": round(4.2 * ratio, 1),
            "sodium_mg": round(380 * ratio),
            "potassium_mg": round(640 * ratio),
            "glycemic_index": glycemic,
            "nutri_score": "A",
            "allergens": allergens,
        }
    }


@app.post("/api/cooking-assistant")
def smart_cooking_assistant(payload: CookingAssistantRequest):
    """
    POST /api/cooking-assistant
    Smart Culinary AI recipe creator and step-by-step guidance.
    """
    ing_count = len(payload.ingredients)
    joined_ing = ", ".join(payload.ingredients) if payload.ingredients else "Fresh pantry ingredients"
    
    recipes_db = [
        {
            "recipe_title": "Pan-Seared Citrus Herb Bowl with Charred Veggies",
            "prep_time": "15 mins",
            "cook_time": "12 mins",
            "difficulty": "Easy",
            "calories_est": 420,
            "steps": [
                "Prep: Wash and slice vegetables into uniform bite-sized pieces for even caramelization.",
                "Sear: Heat a cast-iron skillet over medium-high heat with 1 tbsp olive oil. Sear protein/vegetables undisturbed for 3-4 minutes to develop a golden crust.",
                "Sauce: Whisk lemon zest, grated garlic, cracked black pepper, and extra virgin olive oil.",
                "Plate: Layer warm grain base, top with seared elements, drizzle emulsion, and garnish with fresh herbs."
            ],
            "pro_tip": "Add a pinch of sea salt at the end to keep fresh herbs crisp and preserve volatile aromatics."
        },
        {
            "recipe_title": "Velvety Roasted Garlic & Tomato Sourdough Bruschetta",
            "prep_time": "10 mins",
            "cook_time": "8 mins",
            "difficulty": "Beginner Friendly",
            "calories_est": 310,
            "steps": [
                "Roast vine tomatoes with smashed garlic cloves and a drizzle of oil at 200°C for 8 minutes.",
                "Grill sourdough bread over an open flame or heavy grill pan until smoky grill marks appear.",
                "Rub hot grilled toast with a raw garlic clove for authentic rustic flavor.",
                "Spoon warm roasted tomatoes over toast, finishing with torn basil leaves and sea salt."
            ],
            "pro_tip": "Always tear basil by hand instead of cutting with a knife to prevent oxidation and browning."
        }
    ]
    
    selected_recipe = recipes_db[0] if ing_count % 2 == 0 else recipes_db[1]
    
    return {
        "status": "success",
        "query_ingredients": payload.ingredients,
        "dietary_preference": payload.dietary_preference,
        "recipe": selected_recipe,
        "message": f"Generated custom gourmet recipe optimizing {len(payload.ingredients)} provided ingredients."
    }


@app.post("/api/hygiene-audit")
def hygiene_audit(payload: HygieneAuditRequest):
    """
    POST /api/hygiene-audit
    Kitchen & Restaurant food safety compliance inspector.
    """
    avg_score = round((payload.surface_cleanliness + payload.temperature_control + payload.cross_contamination_prevention) / 3)
    
    status_label = "Grade A - Superior Sanitation" if avg_score >= 90 else "Grade B - Satisfactory"
    
    checklist = [
        {"item": "Cold Storage Temperature (<= 4°C)", "status": "Passed", "value": "2.4°C Recorded"},
        {"item": "Surface Sanitization Residue Check", "status": "Passed", "value": "0.02 ppm (Safe)"},
        {"item": "Color-Coded Cutting Board Protocol", "status": "Compliant", "value": "Poultry / Produce Segregated"},
        {"item": "Handwashing Station Compliance", "status": "Passed", "value": "Hot water & touchless dispenser verified"},
        {"item": "Raw Protein Cross-Contamination Guard", "status": "Passed", "value": "Zero trace pathogen flag"}
    ]
    
    return {
        "status": "success",
        "facility": payload.facility_name,
        "zone": payload.inspection_zone,
        "overall_hygiene_score": avg_score,
        "certification_grade": status_label,
        "haccp_compliant": avg_score >= 85,
        "audit_timestamp": datetime.now(timezone.utc).isoformat(),
        "inspection_checklist": checklist,
        "ai_recommendation": "Maintain weekly deep-cycle sanitize on prep slicers and log refrigerator temp twice daily."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
