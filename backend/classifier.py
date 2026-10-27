"""
Food Verse AI — Neural Classifier Service
Loads the verified 15-class MobileNetV3-Large transfer-learning model
and performs deterministic CPU inference on uploaded food images.
"""

import io
import os
import json
import time
import logging
from typing import Dict, Any, List

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image, ImageOps

logger = logging.getLogger("foodverse-classifier")

# Base directory paths
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BACKEND_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "food_classifier.pt")
CLASS_MAPPING_PATH = os.path.join(MODELS_DIR, "class_indices.json")

# Nutritional and culinary knowledge base for the 15 verified vegetable classes
VEGETABLE_METADATA: Dict[str, Dict[str, Any]] = {
    "Bean": {
        "display_name": "French Beans (Green Beans)",
        "scientific_name": "Phaseolus vulgaris",
        "category": "Green Legume / Pod Vegetable",
        "cuisine": "Global / Mediterranean / Indian (Fansi)",
        "calories_per_100g": 31,
        "protein_g": 1.8,
        "carbs_g": 7.0,
        "fat_g": 0.2,
        "fiber_g": 2.7,
        "glycemic_index": "Very Low (GI 15)",
        "freshness_score": 95,
        "shelf_life_note": "Refrigerate in perforated bag; optimal within 5-7 days",
        "health_score": "A",
        "chef_note": "Blanch briefly in salted boiling water and shock in ice bath to preserve crisp texture and vibrant chlorophyll.",
        "primary_nutrients": ["Folate", "Vitamin K", "Silicon", "Soluble Fiber"]
    },
    "Bitter_Gourd": {
        "display_name": "Bitter Gourd (Karela)",
        "scientific_name": "Momordica charantia",
        "category": "Curcurbit / Medicinal Vegetable",
        "cuisine": "South Asian / East Asian",
        "calories_per_100g": 17,
        "protein_g": 1.0,
        "carbs_g": 3.7,
        "fat_g": 0.2,
        "fiber_g": 2.8,
        "glycemic_index": "Very Low (GI 15)",
        "freshness_score": 94,
        "shelf_life_note": "Keep chilled at 7-10°C; best consumed within 4-6 days",
        "health_score": "A+",
        "chef_note": "Rich in charantin and polypeptide-p; salt lightly before cooking to mellow sharp bitterness.",
        "primary_nutrients": ["Charantin", "Vitamin C", "Iron", "Zinc"]
    },
    "Bottle_Gourd": {
        "display_name": "Bottle Gourd (Lauki / Doodhi)",
        "scientific_name": "Lagenaria siceraria",
        "category": "Gourd / Hydrating Vegetable",
        "cuisine": "Indian / Ayurvedic / Southeast Asian",
        "calories_per_100g": 14,
        "protein_g": 0.6,
        "carbs_g": 3.4,
        "fat_g": 0.1,
        "fiber_g": 1.2,
        "glycemic_index": "Very Low (GI 15)",
        "freshness_score": 96,
        "shelf_life_note": "Store whole in a cool, ventilated area or refrigerated up to 7 days",
        "health_score": "A",
        "chef_note": "Composed of over 96% pure structured water; exceptionally light on digestion and ideal for cooling soups.",
        "primary_nutrients": ["Electrolytes", "Vitamin B-Complex", "Potassium", "Dietary Fiber"]
    },
    "Brinjal": {
        "display_name": "Eggplant / Brinjal (Baingan)",
        "scientific_name": "Solanum melongena",
        "category": "Nightshade / Spongy Vegetable",
        "cuisine": "Mediterranean / Middle Eastern / Indian",
        "calories_per_100g": 25,
        "protein_g": 1.0,
        "carbs_g": 6.0,
        "fat_g": 0.2,
        "fiber_g": 3.0,
        "glycemic_index": "Low (GI 20)",
        "freshness_score": 93,
        "shelf_life_note": "Keep at 10-12°C away from ethylene-producing apples; use within 5 days",
        "health_score": "A",
        "chef_note": "Dark purple skin contains nasunin, a powerful anthocyanin antioxidant protecting brain cell membranes.",
        "primary_nutrients": ["Nasunin Anthocyanin", "Chlorogenic Acid", "Potassium", "Manganese"]
    },
    "Broccoli": {
        "display_name": "Broccoli Florets",
        "scientific_name": "Brassica oleracea var. italica",
        "category": "Cruciferous Superfood",
        "cuisine": "Continental / Italian / Modern Healthy",
        "calories_per_100g": 34,
        "protein_g": 2.8,
        "carbs_g": 6.6,
        "fat_g": 0.4,
        "fiber_g": 2.6,
        "glycemic_index": "Very Low (GI 15)",
        "freshness_score": 97,
        "shelf_life_note": "Refrigerate stems loosely in moisture-proof drawer; use within 5 days",
        "health_score": "A+",
        "chef_note": "Gentle steaming for 3-4 minutes maximizes sulforaphane bioavailability and preserves heat-labile myrosinase.",
        "primary_nutrients": ["Sulforaphane", "Vitamin C (150% DV)", "Vitamin K", "Glucosinolates"]
    },
    "Cabbage": {
        "display_name": "Green Cabbage (Patta Gobhi)",
        "scientific_name": "Brassica oleracea var. capitata",
        "category": "Cruciferous Leafy Head",
        "cuisine": "Global / Slaws / Fermented Kraut",
        "calories_per_100g": 25,
        "protein_g": 1.3,
        "carbs_g": 5.8,
        "fat_g": 0.1,
        "fiber_g": 2.5,
        "glycemic_index": "Very Low (GI 15)",
        "freshness_score": 95,
        "shelf_life_note": "Keeps fresh in refrigerator crisper drawer for up to 2-3 weeks",
        "health_score": "A",
        "chef_note": "Contains glutamine for gut mucosal repair; excellent raw shredded in salads or quick-stirred with mustard seeds.",
        "primary_nutrients": ["Glutamine", "Vitamin C", "Anthocyanins", "Fiber"]
    },
    "Capsicum": {
        "display_name": "Bell Pepper / Capsicum (Shimla Mirch)",
        "scientific_name": "Capsicum annuum",
        "category": "Sweet Pepper",
        "cuisine": "Global / Fajitas / Stir-fries",
        "calories_per_100g": 20,
        "protein_g": 0.9,
        "carbs_g": 4.6,
        "fat_g": 0.2,
        "fiber_g": 1.7,
        "glycemic_index": "Very Low (GI 15)",
        "freshness_score": 96,
        "shelf_life_note": "Store dry in crisper drawer at 4-7°C; lasts 7-10 days",
        "health_score": "A+",
        "chef_note": "One whole bell pepper provides more Vitamin C than three oranges, accompanied by zeaxanthin for eye health.",
        "primary_nutrients": ["Vitamin C (>200% DV)", "Capsanthin", "Vitamin B6", "Beta-Carotene"]
    },
    "Carrot": {
        "display_name": "Farm Fresh Carrot (Gajar)",
        "scientific_name": "Daucus carota",
        "category": "Root Vegetable",
        "cuisine": "Global / Roasts / Raw Crunch",
        "calories_per_100g": 41,
        "protein_g": 0.9,
        "carbs_g": 9.6,
        "fat_g": 0.2,
        "fiber_g": 2.8,
        "glycemic_index": "Low (GI 35 cooked, 16 raw)",
        "freshness_score": 95,
        "shelf_life_note": "Remove green tops to prevent moisture loss; store chilled up to 3 weeks",
        "health_score": "A+",
        "chef_note": "Pair with a healthy dietary lipid (e.g. cold-pressed olive oil) to increase fat-soluble beta-carotene absorption by 300%.",
        "primary_nutrients": ["Beta-Carotene (Provitamin A)", "Lutein", "Biotin", "Fiber"]
    },
    "Cauliflower": {
        "display_name": "Cauliflower (Phool Gobhi)",
        "scientific_name": "Brassica oleracea var. botrytis",
        "category": "Cruciferous Curd",
        "cuisine": "Continental / Curries / Low-Carb Rice",
        "calories_per_100g": 25,
        "protein_g": 1.9,
        "carbs_g": 5.0,
        "fat_g": 0.3,
        "fiber_g": 2.0,
        "glycemic_index": "Very Low (GI 15)",
        "freshness_score": 94,
        "shelf_life_note": "Keep chilled stem-down in breathable bag; optimal within 5-7 days",
        "health_score": "A",
        "chef_note": "Superb low-carb culinary canvas; rich in choline for cellular integrity and brain neurotransmitter synthesis.",
        "primary_nutrients": ["Choline", "Indole-3-Carbinol", "Vitamin C", "Folate"]
    },
    "Cucumber": {
        "display_name": "Crisp Garden Cucumber (Kheera)",
        "scientific_name": "Cucumis sativus",
        "category": "Hydrating Salad Fruit",
        "cuisine": "Mediterranean / Salads / Tzatziki",
        "calories_per_100g": 15,
        "protein_g": 0.7,
        "carbs_g": 3.6,
        "fat_g": 0.1,
        "fiber_g": 0.5,
        "glycemic_index": "Very Low (GI 15)",
        "freshness_score": 96,
        "shelf_life_note": "Sensitive to chilling injury; store at 10-12°C or upper fridge shelf for 5-7 days",
        "health_score": "A",
        "chef_note": "Skin is concentrated in silica and caffeic acid which reduce cutaneous swelling and provide structural crunch.",
        "primary_nutrients": ["Silica", "Cucurbitacin", "Potassium", "Hydration Matrix (95%)"]
    },
    "Papaya": {
        "display_name": "Culinary Green Papaya (Kacha Papita)",
        "scientific_name": "Carica papaya",
        "category": "Cooking Fruit / Tropical Produce",
        "cuisine": "Southeast Asian (Som Tum) / Indian Sabzi",
        "calories_per_100g": 43,
        "protein_g": 0.5,
        "carbs_g": 10.8,
        "fat_g": 0.3,
        "fiber_g": 1.7,
        "glycemic_index": "Low (GI 35)",
        "freshness_score": 94,
        "shelf_life_note": "Firm green fruit keeps at room temp 4-5 days or chilled 10 days",
        "health_score": "A",
        "chef_note": "Contains papain, a natural proteolytic enzyme used both as a gourmet tenderizer and powerful digestive stimulant.",
        "primary_nutrients": ["Papain Protease", "Vitamin C", "Folate", "Carotenoids"]
    },
    "Potato": {
        "display_name": "Fresh Harvest Potato (Aloo)",
        "scientific_name": "Solanum tuberosum",
        "category": "Starchy Tuber",
        "cuisine": "Global Staple / Roasts / Purees",
        "calories_per_100g": 77,
        "protein_g": 2.0,
        "carbs_g": 17.5,
        "fat_g": 0.1,
        "fiber_g": 2.2,
        "glycemic_index": "Moderate (GI 55 cooled, 75 hot)",
        "freshness_score": 92,
        "shelf_life_note": "Store in dark, cool (7-10°C), well-ventilated dry pantry; never refrigerate",
        "health_score": "B+",
        "chef_note": "Boiling and cooling potatoes creates resistant type-3 starch that nourishes beneficial butyrate-producing gut microbiota.",
        "primary_nutrients": ["Potassium (higher than bananas)", "Vitamin B6", "Resistant Starch", "Vitamin C"]
    },
    "Pumpkin": {
        "display_name": "Golden Ribbed Pumpkin (Kaddu)",
        "scientific_name": "Cucurbita moschata",
        "category": "Winter Squash",
        "cuisine": "Global / Soups / Curries / Roasts",
        "calories_per_100g": 26,
        "protein_g": 1.0,
        "carbs_g": 6.5,
        "fat_g": 0.1,
        "fiber_g": 0.5,
        "glycemic_index": "Low Glycemic Load (GL 3)",
        "freshness_score": 95,
        "shelf_life_note": "Uncut pumpkin stores up to 2-3 months in dry cool pantry; cut pieces chilled 5 days",
        "health_score": "A",
        "chef_note": "Rich in lutein and zeaxanthin with dense velvety carotenoid flesh that caramelizes intensely upon roasting.",
        "primary_nutrients": ["Lutein", "Zeaxanthin", "Beta-Cryptoxanthin", "Potassium"]
    },
    "Radish": {
        "display_name": "White Daikon Radish (Mooli)",
        "scientific_name": "Raphanus sativus var. longipinnatus",
        "category": "Pungent Root",
        "cuisine": "Asian / Pickles / Slaws / Parathas",
        "calories_per_100g": 16,
        "protein_g": 0.7,
        "carbs_g": 3.4,
        "fat_g": 0.1,
        "fiber_g": 1.6,
        "glycemic_index": "Very Low (GI 15)",
        "freshness_score": 94,
        "shelf_life_note": "Cut leaves off immediately; store roots chilled in plastic wrap up to 10 days",
        "health_score": "A",
        "chef_note": "Distinct pungent crispness is driven by isothiocyanates which activate natural Phase-II liver detoxification pathways.",
        "primary_nutrients": ["Isothiocyanates", "Glucosinolates", "Vitamin C", "Folate"]
    },
    "Tomato": {
        "display_name": "Vine-Ripened Tomato (Tamatar)",
        "scientific_name": "Solanum lycopersicum",
        "category": "Botanical Fruit / Culinary Vegetable",
        "cuisine": "Mediterranean / Global / Sauces / Salads",
        "calories_per_100g": 18,
        "protein_g": 0.9,
        "carbs_g": 3.9,
        "fat_g": 0.2,
        "fiber_g": 1.2,
        "glycemic_index": "Very Low (GI 15)",
        "freshness_score": 96,
        "shelf_life_note": "Store stem-down at cool room temperature (18°C) out of sunlight; avoid refrigeration to preserve volatile terpenes",
        "health_score": "A+",
        "chef_note": "Cooking tomatoes with olive oil dramatically increases the trans-to-cis isomerization and cellular absorption of lycopene.",
        "primary_nutrients": ["Lycopene (High potency)", "Vitamin C", "Potassium", "GABA"]
    }
}


class FoodClassifierService:
    """
    Singleton service managing model lifecycle, preprocessing, and neural inference.
    """
    def __init__(self):
        self.device = torch.device("cpu")
        self.model = None
        self.classes: List[str] = []
        self.class_to_idx: Dict[str, int] = {}
        self.idx_to_class: Dict[int, str] = {}
        self.is_loaded = False
        
        # Aspect-preserving evaluation transform (shorter edge resized to 256, center cropped to 224x224)
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        self.load_model()

    def load_model(self):
        """Loads model weights once into CPU memory in evaluation mode."""
        try:
            if not os.path.exists(MODEL_PATH):
                logger.warning(f"Model checkpoint not found at: {MODEL_PATH}")
                return

            if not os.path.exists(CLASS_MAPPING_PATH):
                logger.warning(f"Class mapping file not found at: {CLASS_MAPPING_PATH}")
                return

            # Load canonical class index
            with open(CLASS_MAPPING_PATH, "r", encoding="utf-8") as f:
                mapping_data = json.load(f)
                self.class_to_idx = mapping_data["class_to_idx"]
                self.idx_to_class = {int(k): v for k, v in mapping_data["idx_to_class"].items()}
                self.classes = mapping_data["class_names"]

            num_classes = len(self.classes)
            assert num_classes == 15, f"Expected 15 classes, got {num_classes}"

            # Instantiate architecture
            net = models.mobilenet_v3_large(weights=None)
            in_features = net.classifier[3].in_features
            net.classifier[3] = nn.Linear(in_features, num_classes)

            # Load weights safely
            ckpt = torch.load(MODEL_PATH, map_location=self.device, weights_only=False)
            state_dict = ckpt["model_state_dict"] if "model_state_dict" in ckpt else ckpt
            net.load_state_dict(state_dict)

            net.to(self.device)
            net.eval()
            self.model = net
            self.is_loaded = True
            logger.info("FoodClassifierService: MobileNetV3-Large 15-class model loaded successfully on CPU.")

        except Exception as e:
            logger.error(f"Failed to load FoodClassifierService: {e}")
            self.is_loaded = False

    def predict_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Validates image bytes, performs RGB conversion, and computes top-1 and top-3 predictions.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model is not initialized or checkpoint file is missing.")

        if not image_bytes or len(image_bytes) == 0:
            raise ValueError("Empty image upload received. Please select a valid photo.")

        # Validate file size (10 MB maximum)
        if len(image_bytes) > 10 * 1024 * 1024:
            raise ValueError("Image file size exceeds the 10 MB maximum limit.")

        # Decode image using PIL with EXIF orientation handling
        try:
            with Image.open(io.BytesIO(image_bytes)) as pil_img:
                # Force loading of image data to detect truncation/corruption
                pil_img.load()
                # Safely transpose EXIF orientation for smartphone photos (handles missing EXIF gracefully)
                try:
                    transposed = ImageOps.exif_transpose(pil_img)
                    if transposed is not None:
                        pil_img = transposed
                except Exception:
                    pass
                # Ensure RGB mode (handling RGBA, palette, grayscale)
                rgb_img = pil_img.convert("RGB")
                orig_size = rgb_img.size
        except Exception as e:
            raise ValueError(f"Corrupt or unsupported image format: {str(e)}")

        # Preprocess tensor
        tensor = self.transform(rgb_img).unsqueeze(0).to(self.device)

        # Run inference and measure latency
        t0 = time.perf_counter()
        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=1).squeeze(0)
        t_latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)

        # Top-1 prediction
        top1_idx = torch.argmax(probs).item()
        top1_prob = probs[top1_idx].item()
        raw_class_name = self.idx_to_class[top1_idx]
        confidence_pct = round(top1_prob * 100.0, 2)

        # Top-3 predictions
        top3_indices = torch.topk(probs, 3).indices.tolist()
        top3_list: List[Dict[str, Any]] = []
        for idx in top3_indices:
            c_name = self.idx_to_class[idx]
            c_meta = VEGETABLE_METADATA.get(c_name, {})
            top3_list.append({
                "class_name": c_name,
                "display_name": c_meta.get("display_name", c_name.replace("_", " ").title()),
                "confidence": round(probs[idx].item() * 100.0, 2),
            })

        # Conservative heuristic advisory for potentially unsupported inputs or complex scenes
        # Explicitly treats confidence as a benchmark probability metric, not a real-world guarantee
        top2_margin = (probs[top3_indices[0]].item() - probs[top3_indices[1]].item()) * 100.0 if len(top3_indices) > 1 else 100.0
        is_heuristic_advisory = bool(confidence_pct < 65.0 or top2_margin < 15.0)

        advisory_payload = {
            "triggered": is_heuristic_advisory,
            "reason": "Elevated ambiguity detected (confidence below 65% or close class competition)." if is_heuristic_advisory else None,
            "message": (
                "Heuristic Advisory: This image may contain complex backgrounds, multiple produce items, or foods outside the 15 supported vegetable categories. "
                "Confidence scores reflect model benchmark probabilities, not guaranteed real-world certainty. "
                "For clearer results, crop closely around a single supported vegetable on a clean surface."
                if is_heuristic_advisory else
                "For optimal accuracy, ensure the photo features a single supported vegetable on an uncluttered surface."
            ),
            "recommendation": "Crop closely around one supported vegetable for optimal recognition.",
            "notice": "Confidence is a model probability metric, not guaranteed accuracy on arbitrary real-world foods."
        }

        # Fetch culinary and nutritional profile
        meta = VEGETABLE_METADATA.get(raw_class_name, {
            "display_name": raw_class_name.replace("_", " ").title(),
            "category": "Fresh Produce",
            "cuisine": "Vegetarian Wholefood",
            "calories_per_100g": 35,
            "protein_g": 1.5,
            "carbs_g": 6.5,
            "fat_g": 0.2,
            "fiber_g": 2.0,
            "glycemic_index": "Low",
            "freshness_score": 95,
            "shelf_life_note": "Store in clean crisper drawer at 4-7°C",
            "health_score": "A",
            "chef_note": "Wholesome fresh culinary produce rich in natural micronutrients."
        })

        return {
            "status": "success",
            "predicted_class": raw_class_name,
            "display_name": meta.get("display_name", raw_class_name),
            "model_confidence_pct": confidence_pct,
            "confidence_label": "High Confidence" if confidence_pct >= 85 else ("Moderate Confidence" if confidence_pct >= 50 else "Low Confidence"),
            "inference_latency_ms": t_latency_ms,
            "top3_predictions": top3_list,
            "dimensions_analyzed": [orig_size[0], orig_size[1]],
            "advisory": advisory_payload,
            "nutrition_profile": {
                "calories": meta["calories_per_100g"],
                "protein_g": meta["protein_g"],
                "carbs_g": meta["carbs_g"],
                "fat_g": meta["fat_g"],
                "fiber_g": meta["fiber_g"],
                "glycemic_index": meta["glycemic_index"],
                "health_score": meta["health_score"],
                "freshness_score": meta["freshness_score"],
                "shelf_life_note": meta["shelf_life_note"],
                "chef_note": meta["chef_note"],
                "category": meta["category"],
                "cuisine": meta["cuisine"],
            }
        }


# Singleton instance
classifier_service = FoodClassifierService()
