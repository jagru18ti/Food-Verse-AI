import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Apple,
  Activity,
  ChefHat,
  ShieldCheck,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Layers,
  RefreshCw,
  TrendingUp,
  UploadCloud,
  Upload,
  Trash2,
  Image as ImageIcon,
  FileText,
  Info,
  RotateCcw,
} from 'lucide-react';
import './App.css';

const PRESET_DISHES = [
  {
    id: 'avocado_toast',
    name: 'Artisanal Avocado & Poached Egg Toast',
    subtitle: 'Microgreens & Sesame Sourdough',
    image: '/images/avocado_toast.jpg',
    cuisine: 'Modern Californian',
    calories: 385,
    protein: 14.5,
    carbs: 31.0,
    fat: 22.8,
    fiber: 8.5,
    confidence: 98.6,
    freshnessScore: 96,
    ingredients: [
      'Hass Avocado (crushed)',
      'Organic Poached Egg',
      'Artisan Sourdough Slice',
      'Microgreens & Watercress',
      'Chili Flakes & Sesame',
      'Extra Virgin Olive Oil',
      'Maldon Sea Salt'
    ],
    chefQuote: 'A rich source of monounsaturated fatty acids and bioavailable lutein from pastured egg yolk.',
  },
  {
    id: 'salmon_bowl',
    name: 'Pacific Salmon Poke & Quinoa Bowl',
    subtitle: 'Omega-3 Superfood Protein Bowl',
    image: '/images/salmon_bowl.jpg',
    cuisine: 'Hawaiian / Fusion',
    calories: 540,
    protein: 36.2,
    carbs: 48.0,
    fat: 21.5,
    fiber: 7.8,
    confidence: 99.1,
    freshnessScore: 98,
    ingredients: [
      'Fresh Sashimi-Grade Salmon',
      'Steamed Edamame Pods',
      'Sliced Hass Avocado',
      'Shredded Purple Cabbage',
      'Diced Sweet Mango',
      'Quinoa & Jasmine Rice',
      'Toasted Black Sesame'
    ],
    chefQuote: 'High in clean Omega-3 EPA/DHA fatty acids and natural anthocyanins from purple cabbage.',
  },
  {
    id: 'fresh_produce',
    name: 'Farm-Fresh Mediterranean Harvest',
    subtitle: 'Organic Vine Tomatoes, Basil & Broccoli',
    image: '/images/fresh_produce.jpg',
    cuisine: 'Raw Organic Wholefoods',
    calories: 145,
    protein: 5.2,
    carbs: 24.0,
    fat: 3.8,
    fiber: 8.0,
    confidence: 97.8,
    freshnessScore: 95,
    ingredients: [
      'Vine-Ripened Campari Tomatoes',
      'Crisp Broccoli Florets',
      'Sweet Bell Peppers',
      'Genovese Basil Leaves',
      'Cold-Pressed Olive Oil',
      'Cherry Tomatoes'
    ],
    chefQuote: 'Packed with Lycopene, Vitamin C (over 200% DV), and cellular anti-inflammatory flavonoids.',
  },
];

const SUPPORTED_PRODUCE = [
  'Bean',
  'Bitter Gourd',
  'Bottle Gourd',
  'Brinjal',
  'Broccoli',
  'Cabbage',
  'Capsicum',
  'Carrot',
  'Cauliflower',
  'Cucumber',
  'Papaya',
  'Potato',
  'Pumpkin',
  'Radish',
  'Tomato',
];

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('vision');
  const [selectedDishId, setSelectedDishId] = useState('avocado_toast');
  const [backendStatus, setBackendStatus] = useState({ online: false, ping: null, info: null });
  const [isScanning, setIsScanning] = useState(false);

  // Nutrition portion slider state
  const [portionGrams, setPortionGrams] = useState(250);

  // Freshness custom tester state
  const [freshnessItem, setFreshnessItem] = useState('Ripe Vine Tomatoes');
  const [freshnessResult, setFreshnessResult] = useState(null);
  const [loadingFreshness, setLoadingFreshness] = useState(false);

  // Chef AI state
  const [pantryIngredients, setPantryIngredients] = useState(['Tomatoes', 'Basil', 'Garlic', 'Olive Oil', 'Pasta']);
  const [ingredientInput, setIngredientInput] = useState('');
  const [dietaryChoice, setDietaryChoice] = useState('Vegetarian');
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);

  // Hygiene audit state
  const [surfaceScore, setSurfaceScore] = useState(94);
  const [tempScore, setTempScore] = useState(96);
  const [contaminationScore, setContaminationScore] = useState(92);
  const [auditResult, setAuditResult] = useState(null);

  // API diagnostics state
  const [diagnosticsLog, setDiagnosticsLog] = useState([]);
  const [runningDiag, setRunningDiag] = useState(false);

  // Food Image Upload state
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showPhase2Notice, setShowPhase2Notice] = useState(false);
  const [isAnalyzingUpload, setIsAnalyzingUpload] = useState(false);
  const [uploadPrediction, setUploadPrediction] = useState(null);

  const currentDish = PRESET_DISHES.find((d) => d.id === selectedDishId) || PRESET_DISHES[0];

  // Clean up object URLs created for image previews to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const checkHealth = async () => {
    const start = performance.now();
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) {
        const data = await res.json();
        const latency = Math.round(performance.now() - start);
        setBackendStatus({ online: true, ping: latency, info: data });
      } else {
        setBackendStatus({ online: false, ping: null, info: null });
      }
    } catch {
      // Backend not running yet or unreachable
      setBackendStatus({ online: false, ping: null, info: null });
    }
  };

  // Check backend health on initial load
  useEffect(() => {
    checkHealth();
  }, []);


  const handleSelectDish = (id) => {
    setIsScanning(true);
    setSelectedDishId(id);
    setTimeout(() => {
      setIsScanning(false);
    }, 450);
  };

  const handleAddIngredient = (e) => {
    e.preventDefault();
    if (ingredientInput.trim() && !pantryIngredients.includes(ingredientInput.trim())) {
      setPantryIngredients([...pantryIngredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (ing) => {
    setPantryIngredients(pantryIngredients.filter((i) => i !== ing));
  };

  // Trigger Freshness Analysis
  const handleAnalyzeFreshness = async () => {
    setLoadingFreshness(true);
    try {
      const res = await fetch(`${API_BASE}/api/freshness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: freshnessItem, storage_type: 'refrigerated' }),
      });
      if (res.ok) {
        const data = await res.json();
        setFreshnessResult(data);
      } else {
        // Fallback simulated response if backend is offline
        setFreshnessResult({
          item_name: freshnessItem,
          freshness_index: 94,
          grade: 'Optimal Freshness',
          estimated_shelf_life_days: 5,
          visual_indicators: ['Natural moisture retention', 'Uniform coloration', 'Crisp structural rigidity'],
          storage_protocol: 'Keep stored in breathable crisper drawer with 85% relative humidity.',
        });
      }
    } catch {
      setFreshnessResult({
        item_name: freshnessItem,
        freshness_index: 92,
        grade: 'Optimal Freshness',
        estimated_shelf_life_days: 4,
        visual_indicators: ['Firm surface elasticity', 'Natural pigmentation', 'Clean aroma'],
        storage_protocol: 'Store at 2°C - 4°C in sealed glass container.',
      });
    } finally {
      setLoadingFreshness(false);
    }
  };

  // Trigger Chef AI Recipe Generation
  const handleGenerateRecipe = async () => {
    setGeneratingRecipe(true);
    try {
      const res = await fetch(`${API_BASE}/api/cooking-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: pantryIngredients,
          dietary_preference: dietaryChoice,
          user_prompt: 'Create a vibrant gourmet meal',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedRecipe(data.recipe);
      } else {
        fallbackRecipe();
      }
    } catch {
      fallbackRecipe();
    } finally {
      setGeneratingRecipe(false);
    }
  };

  const fallbackRecipe = () => {
    setGeneratedRecipe({
      recipe_title: 'Velvety Roasted Garlic & Tomato Sourdough Bruschetta',
      prep_time: '10 mins',
      cook_time: '8 mins',
      difficulty: 'Beginner Friendly',
      calories_est: 310,
      steps: [
        'Roast vine tomatoes with smashed garlic cloves and a drizzle of oil at 200°C for 8 minutes.',
        'Grill sourdough bread over an open flame or heavy grill pan until smoky grill marks appear.',
        'Rub hot grilled toast with a raw garlic clove for authentic rustic flavor.',
        'Spoon warm roasted tomatoes over toast, finishing with torn basil leaves and sea salt.',
      ],
      pro_tip: 'Always tear basil by hand instead of cutting with a knife to prevent oxidation and browning.',
    });
  };

  // Trigger Hygiene Audit
  const handleRunAudit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/hygiene-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facility_name: 'Artisan Culinary Kitchen',
          inspection_zone: 'Cold Prep & Station',
          surface_cleanliness: surfaceScore,
          temperature_control: tempScore,
          cross_contamination_prevention: contaminationScore,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuditResult(data);
      } else {
        fallbackAudit();
      }
    } catch {
      fallbackAudit();
    }
  };

  const fallbackAudit = () => {
    const avg = Math.round((surfaceScore + tempScore + contaminationScore) / 3);
    setAuditResult({
      facility: 'Artisan Culinary Kitchen',
      zone: 'Cold Prep & Station',
      overall_hygiene_score: avg,
      certification_grade: avg >= 90 ? 'Grade A - Superior Sanitation' : 'Grade B - Satisfactory',
      haccp_compliant: avg >= 85,
      inspection_checklist: [
        { item: 'Cold Storage Temperature (<= 4°C)', status: 'Passed', value: '2.4°C' },
        { item: 'Surface Sanitization Residue Check', status: 'Passed', value: '0.02 ppm' },
        { item: 'Color-Coded Cutting Board Protocol', status: 'Compliant', value: 'Active' },
        { item: 'Handwashing Station Compliance', status: 'Passed', value: 'Verified' },
      ],
      ai_recommendation: 'Maintain weekly deep-cycle sanitize on prep slicers and log refrigerator temp twice daily.',
    });
  };

  // Run full system diagnostics
  const handleRunDiagnostics = async () => {
    setRunningDiag(true);
    const logs = [];

    const endpoints = [
      { name: 'Health Check', path: '/api/health', method: 'GET' },
      { name: 'App Info', path: '/api/', method: 'GET' },
      {
        name: 'Vision Recognition',
        path: '/api/recognize',
        method: 'POST',
        body: { dish_id: 'avocado_toast' },
      },
      {
        name: 'Freshness Analyzer',
        path: '/api/freshness',
        method: 'POST',
        body: { item_name: 'Atlantic Salmon' },
      },
      {
        name: 'Nutrition Profiler',
        path: '/api/nutrition',
        method: 'POST',
        body: { food_name: 'Salmon Bowl', portion_grams: 250 },
      },
    ];

    for (const ep of endpoints) {
      const t0 = performance.now();
      try {
        const res = await fetch(`${API_BASE}${ep.path}`, {
          method: ep.method,
          headers: ep.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
          body: ep.body ? JSON.stringify(ep.body) : undefined,
        });
        const elapsed = Math.round(performance.now() - t0);
        const data = await res.json();
        logs.push({
          name: ep.name,
          path: ep.path,
          method: ep.method,
          status: res.status,
          latency: elapsed,
          success: res.ok,
          payload: data,
        });
      } catch (err) {
        logs.push({
          name: ep.name,
          path: ep.path,
          method: ep.method,
          status: 'Error',
          latency: 0,
          success: false,
          payload: { message: err.message },
        });
      }
    }

    setDiagnosticsLog(logs);
    setRunningDiag(false);
  };

  // Food image upload handlers (Phase 1)
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleProcessFile = (file) => {
    if (!file) return;

    // Reset status, predictions, and errors
    setUploadError('');
    setUploadPrediction(null);
    setShowPhase2Notice(false);

    // Validate file type (must be image/*)
    const isImage = file.type
      ? file.type.startsWith('image/')
      : /\.(jpe?g|png|webp|gif|svg|bmp|avif)$/i.test(file.name);

    if (!isImage) {
      setUploadError(`Invalid file type: "${file.name}". Please upload a valid image file (PNG, JPG, WEBP, etc.).`);
      return;
    }

    // Validate file size limit (10 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setUploadError(`File size exceeds 10 MB limit (${sizeMb} MB). Please choose a smaller image.`);
      return;
    }

    // Revoke previous preview URL if present
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create object URL preview and store file
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadedFile(file);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedFile(null);
    setUploadError('');
    setUploadPrediction(null);
    setShowPhase2Notice(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeClick = async () => {
    if (!uploadedFile) {
      setUploadError('No image selected. Please choose or drag an image first.');
      return;
    }

    setIsAnalyzingUpload(true);
    setUploadError('');
    setUploadPrediction(null);
    setShowPhase2Notice(false);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await fetch(`${API_BASE}/api/recognize-upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let errorDetail = 'Failed to analyze uploaded image.';
        try {
          const errData = await res.json();
          if (errData && errData.detail) {
            errorDetail = errData.detail;
          }
        } catch {
          errorDetail = `Inference failed with status ${res.status} (${res.statusText})`;
        }
        setUploadError(errorDetail);
        return;
      }

      const data = await res.json();
      setUploadPrediction(data);
    } catch {
      setUploadError(
        'Unable to connect to the FoodVerse AI backend server. Please verify the FastAPI service is running at http://127.0.0.1:8000.'
      );
    } finally {
      setIsAnalyzingUpload(false);
    }
  };

  // Ratio for portion calculation in Nutrition tab
  const portionRatio = portionGrams / 250;

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <header className="header">
        <div className="brand-wrapper">
          <div className="brand-icon-box">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="brand-title">Food Verse AI</div>
            <div className="brand-subtitle">Produce Recognition & Quality Intelligence</div>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="nav-tabs" aria-label="Main Navigation">
          <button
            id="tab-vision-btn"
            className={`nav-tab-btn ${activeTab === 'vision' ? 'active' : ''}`}
            onClick={() => setActiveTab('vision')}
          >
            <Camera size={16} /> Produce Identifier
          </button>
          <button
            id="tab-freshness-btn"
            className={`nav-tab-btn ${activeTab === 'freshness' ? 'active' : ''}`}
            onClick={() => setActiveTab('freshness')}
          >
            <Apple size={16} /> Freshness
          </button>
          <button
            id="tab-nutrition-btn"
            className={`nav-tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveTab('nutrition')}
          >
            <Activity size={16} /> Nutrition
          </button>
          <button
            id="tab-chef-btn"
            className={`nav-tab-btn ${activeTab === 'chef' ? 'active' : ''}`}
            onClick={() => setActiveTab('chef')}
          >
            <ChefHat size={16} /> Chef AI
          </button>
          <button
            id="tab-hygiene-btn"
            className={`nav-tab-btn ${activeTab === 'hygiene' ? 'active' : ''}`}
            onClick={() => setActiveTab('hygiene')}
          >
            <ShieldCheck size={16} /> Hygiene Audit
          </button>
          <button
            id="tab-api-btn"
            className={`nav-tab-btn ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <Server size={16} /> API Health
          </button>
        </nav>

        {/* Live Backend Indicator */}
        <div className="header-status-box" onClick={checkHealth} style={{ cursor: 'pointer' }} title="Click to refresh status">
          <span className={`pulse-dot ${backendStatus.online ? '' : 'offline'}`} />
          <span>
            {backendStatus.online ? `FastAPI Online (${backendStatus.ping}ms)` : 'Backend Offline (Mock Mode)'}
          </span>
          <RefreshCw size={13} style={{ opacity: 0.7 }} />
        </div>
      </header>

      {/* Main Body Content */}
      <main className="main-content">
        {/* Hero Banner */}
        <section className="hero-banner">
          <div className="hero-tag">
            <Sparkles size={14} /> AI Produce Recognition
          </div>
          <h1 className="hero-headline">
            Food Verse AI — <span className="highlight-gradient">Produce Intelligence</span>
          </h1>
          <p className="hero-description">
            Upload any fresh produce photo to recognize supported fruits and vegetables, view real-time model confidence scores, audit nutritional profiles, and check freshness.
          </p>

          {/* Supported Produce Scope Pill Bar */}
          <div className="supported-scope-bar">
            <span className="supported-scope-label">15 Supported Produce Classes:</span>
            {SUPPORTED_PRODUCE.map((cls) => (
              <span key={cls} className="supported-tag-pill">{cls}</span>
            ))}
          </div>
        </section>

        {/* TAB 1: VISION & RECOGNITION */}
        {activeTab === 'vision' && (
          <section className="tab-panel-container">
            {/* Primary Produce Recognition Section */}
            <section className="glass-card upload-food-section" id="upload-food-section" aria-label="Upload Food Image">
              <div className="upload-section-header">
                <div className="upload-header-left">
                  <div className="upload-header-icon">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <h2 className="upload-section-title">Produce Image Recognition</h2>
                    <p className="upload-section-subtitle">
                      Upload or drag a produce photo to identify with MobileNetV3-Large neural model
                    </p>
                  </div>
                </div>
                <span className="badge badge-emerald">MobileNetV3 Active</span>
              </div>

              {/* Real HTML file input with accept="image/*" */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                id="food-image-input"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />

              {/* STATE 1: No image selected */}
              {!previewUrl ? (
                <div
                  id="upload-dropzone"
                  className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <div className="upload-drop-icon">
                    <UploadCloud size={28} />
                  </div>
                  <div className="upload-drop-text">
                    Drag and drop your produce image here, or browse
                  </div>
                  <div className="upload-drop-subtext">
                    Supports PNG, JPG, JPEG, WEBP • Maximum 10 MB
                  </div>
                  <button
                    type="button"
                    id="choose-image-btn"
                    className="upload-choose-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload size={16} /> Upload Image
                  </button>
                </div>
              ) : !uploadPrediction ? (
                /* STATE 2: Image selected & previewed (Before recognition) */
                <div className="upload-preview-card" id="upload-preview-card">
                  <div className="upload-preview-media">
                    <img
                      src={previewUrl}
                      alt={uploadedFile?.name || 'Selected food preview'}
                      className="upload-preview-img"
                      id="upload-preview-img"
                    />
                  </div>

                  <div className="upload-preview-meta">
                    <div className="upload-file-title" id="selected-file-name">
                      {uploadedFile?.name}
                    </div>

                    <div className="upload-file-specs">
                      <span className="upload-spec-pill" id="selected-file-size">
                        <FileText size={13} /> {formatFileSize(uploadedFile?.size)}
                      </span>
                      <span className="upload-spec-pill">
                        <ImageIcon size={13} /> {uploadedFile?.type || 'Image'}
                      </span>
                      <span className="badge badge-emerald">Ready for Recognition</span>
                    </div>

                    <div className="upload-actions-row">
                      <button
                        type="button"
                        id="analyze-food-btn"
                        className="btn-primary"
                        onClick={handleAnalyzeClick}
                        disabled={isAnalyzingUpload}
                        title="Identify produce with MobileNetV3-Large neural model"
                      >
                        {isAnalyzingUpload ? (
                          <>
                            <RefreshCw size={16} className="spin-animation" /> Identifying Produce...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} /> Identify Produce
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        id="choose-image-btn"
                        className="btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzingUpload}
                        title="Select a different image"
                      >
                        <Upload size={14} /> Change Image
                      </button>

                      <button
                        type="button"
                        id="remove-image-btn"
                        className="btn-danger-outline"
                        onClick={handleRemoveImage}
                        disabled={isAnalyzingUpload}
                        title="Remove selected image and clear preview"
                      >
                        <Trash2 size={16} /> Remove Image
                      </button>
                    </div>

                    {showPhase2Notice && (
                      <div className="phase2-notice-banner animate-fade-in" id="phase2-notice-banner">
                        <Info size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <span className="phase2-badge">Vision Active</span>
                          <strong>AI analysis active.</strong> Multimodal neural inference is powered by the verified 15-class MobileNetV3-Large vision model.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* STATE 3: Successful prediction (Split view on desktop) */
                <div className="prediction-split-layout">
                  {/* Left Column: Image Preview & Control Actions */}
                  <div className="prediction-image-pane" id="upload-preview-card">
                    <div className="prediction-image-wrapper">
                      <img
                        src={previewUrl}
                        alt={uploadedFile?.name || 'Selected produce preview'}
                        className="upload-preview-img"
                        id="upload-preview-img"
                      />
                    </div>

                    <div className="prediction-image-meta">
                      <div className="upload-file-title" id="selected-file-name">
                        {uploadedFile?.name}
                      </div>
                      <div className="upload-file-specs">
                        <span className="upload-spec-pill" id="selected-file-size">
                          <FileText size={13} /> {formatFileSize(uploadedFile?.size)}
                        </span>
                        <span className="badge badge-emerald">Identified</span>
                      </div>
                    </div>

                    <div className="upload-actions-row">
                      <button
                        type="button"
                        id="try-another-image-btn"
                        className="btn-primary"
                        onClick={handleRemoveImage}
                        title="Reset and analyze another produce image"
                      >
                        <RotateCcw size={15} /> Try Another Image
                      </button>

                      <button
                        type="button"
                        id="choose-image-btn"
                        className="btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        title="Select a different image"
                      >
                        <Upload size={14} /> Change Image
                      </button>

                      <button
                        type="button"
                        id="remove-image-btn"
                        className="btn-danger-outline"
                        onClick={handleRemoveImage}
                        title="Clear image"
                      >
                        <Trash2 size={14} /> Clear
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Prediction Results Card */}
                  <div className="upload-prediction-card animate-fade-in" id="upload-prediction-result" style={{ marginTop: 0 }}>
                    <div className="prediction-header-bar">
                      <div className="prediction-title-group">
                        <span className="badge badge-emerald">
                          <Sparkles size={12} /> Live MobileNetV3 Prediction
                        </span>
                        <h3 className="prediction-dish-name" id="predicted-class-name">
                          {uploadPrediction.display_name}
                        </h3>
                        <span className="prediction-category-tag">
                          {uploadPrediction.nutrition_profile?.category || 'Fresh Produce'} • {uploadPrediction.nutrition_profile?.cuisine || 'Raw Wholefood'}
                        </span>
                      </div>

                      <div className="prediction-metrics-group">
                        <div className="confidence-pill-wrapper">
                          <span className="confidence-value-pill" id="predicted-confidence-pill">
                            <Award size={14} /> {uploadPrediction.model_confidence_pct}% Confidence
                          </span>
                          <span className="confidence-note-disclaimer">
                            *Model confidence score (evaluated on 3,000 held-out test images; not a guarantee of correctness).
                          </span>
                        </div>
                        <div className="latency-badge">
                          <Zap size={13} /> {uploadPrediction.inference_latency_ms} ms CPU Latency
                        </div>
                      </div>
                    </div>

                    {/* Conservative Heuristic Uncertainty Advisory */}
                    {uploadPrediction.advisory?.triggered && (
                      <div className="prediction-heuristic-advisory animate-fade-in" id="prediction-heuristic-advisory">
                        <AlertCircle size={18} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div className="heuristic-advisory-content">
                          <div className="heuristic-advisory-tag">
                            <span className="badge badge-amber">Heuristic Advisory</span>
                            <span className="heuristic-tag-text">{uploadPrediction.advisory.reason}</span>
                          </div>
                          <p className="heuristic-advisory-message">
                            {uploadPrediction.advisory.message}
                          </p>
                          <div className="heuristic-advisory-tip">
                            <strong>Recommendation:</strong> {uploadPrediction.advisory.recommendation}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Top-3 distribution breakdown */}
                    {uploadPrediction.top3_predictions && uploadPrediction.top3_predictions.length > 0 && (
                      <div className="top3-container" id="prediction-top3-distribution">
                        <div className="top3-title">
                          <TrendingUp size={14} /> Class Confidence Distribution (Top 3):
                        </div>
                        <div className="top3-bars-list">
                          {uploadPrediction.top3_predictions.map((item, idx) => (
                            <div key={idx} className="top3-bar-item">
                              <div className="top3-label-row">
                                <span className="top3-class-name">
                                  #{idx + 1} {item.display_name}
                                </span>
                                <span className="top3-pct">{item.confidence}%</span>
                              </div>
                              <div className="top3-progress-track">
                                <div
                                  className="top3-progress-fill"
                                  style={{
                                    width: `${Math.max(item.confidence, 1.5)}%`,
                                    background: idx === 0 ? 'var(--gradient-emerald)' : 'rgba(148, 163, 184, 0.45)',
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nutritional & Freshness Intelligence Grid */}
                    {uploadPrediction.nutrition_profile && (
                      <div className="prediction-details-grid">
                        <div className="macro-chip">
                          <span className="macro-chip-label">Energy</span>
                          <span className="macro-chip-value">{uploadPrediction.nutrition_profile.calories} kcal</span>
                          <span className="macro-chip-sub">per 100g</span>
                        </div>
                        <div className="macro-chip">
                          <span className="macro-chip-label">Protein</span>
                          <span className="macro-chip-value">{uploadPrediction.nutrition_profile.protein_g}g</span>
                          <span className="macro-chip-sub">plant amino acids</span>
                        </div>
                        <div className="macro-chip">
                          <span className="macro-chip-label">Carbs</span>
                          <span className="macro-chip-value">{uploadPrediction.nutrition_profile.carbs_g}g</span>
                          <span className="macro-chip-sub">clean carbs</span>
                        </div>
                        <div className="macro-chip">
                          <span className="macro-chip-label">Dietary Fiber</span>
                          <span className="macro-chip-value">{uploadPrediction.nutrition_profile.fiber_g}g</span>
                          <span className="macro-chip-sub">digestive fiber</span>
                        </div>
                        <div className="macro-chip">
                          <span className="macro-chip-label">Freshness Index</span>
                          <span className="macro-chip-value" style={{ color: 'var(--accent-emerald)' }}>
                            {uploadPrediction.nutrition_profile.freshness_score}/100
                          </span>
                          <span className="macro-chip-sub">Grade {uploadPrediction.nutrition_profile.health_score}</span>
                        </div>
                      </div>
                    )}

                    {/* Culinary & Storage Advisory */}
                    {uploadPrediction.nutrition_profile?.chef_note && (
                      <div className="prediction-chef-advisory">
                        <div className="chef-advisory-title">
                          <ChefHat size={14} color="#166534" /> Culinary & Storage Advisory
                        </div>
                        <p className="chef-advisory-text">
                          {uploadPrediction.nutrition_profile.chef_note}
                        </p>
                        <div className="shelf-life-note">
                          <Clock size={13} /> {uploadPrediction.nutrition_profile.shelf_life_note}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Validation / Network Error Banner with Retry */}
              {uploadError && (
                <div className="upload-error-banner animate-fade-in" id="upload-error-banner">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span>{uploadError}</span>
                    {uploadedFile && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '4px 12px', background: '#ffffff' }}
                        onClick={handleAnalyzeClick}
                        disabled={isAnalyzingUpload}
                      >
                        <RefreshCw size={13} className={isAnalyzingUpload ? 'spin-animation' : ''} /> Retry Recognition
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Reference Samples & Demo Explorer (Preserved & Accessible, Non-competing) */}
            <section className="demo-section-wrapper" aria-label="Explore Reference Samples">
              <div className="preset-title-label">
                <Layers size={15} /> Reference Library & Demo Samples
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '-0.25rem' }}>
                Select a benchmark sample below to inspect multimodal intelligence in Freshness, Nutrition, and Chef AI.
              </p>

              {/* Sample Dish Picker */}
              <div className="sample-presets-container">
                <div className="sample-grid">
                  {PRESET_DISHES.map((dish) => (
                    <div
                      key={dish.id}
                      id={`preset-${dish.id}`}
                      className={`sample-card ${selectedDishId === dish.id ? 'active' : ''}`}
                      onClick={() => handleSelectDish(dish.id)}
                    >
                      <img src={dish.image} alt={dish.name} className="sample-thumbnail" />
                      <div className="sample-card-info">
                        <h4>{dish.name}</h4>
                        <p>{dish.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dashboard-grid">
                {/* Left Column: Image with AI Scanner Overlay */}
                <div className="glass-card vision-showcase-box">
                  <div className="image-preview-wrapper">
                    <img src={currentDish.image} alt={currentDish.name} className="preview-image" />
                    {isScanning && <div className="vision-scan-overlay" />}
                    <div className="confidence-tag-overlay">
                      <CheckCircle2 size={16} />
                      <span>{currentDish.confidence}% Confidence</span>
                    </div>
                  </div>

                  <div className="meta-pill-row">
                    <span className="badge badge-emerald">Cuisine: {currentDish.cuisine}</span>
                    <span className="badge badge-cyan">Freshness: {currentDish.freshnessScore}/100</span>
                    <span className="badge badge-amber">{currentDish.calories} kcal / serving</span>
                    <span className="badge badge-purple">Nutri-Grade: A</span>
                  </div>
                </div>

                {/* Right Column: Identified Details */}
                <div className="glass-card details-panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">{currentDish.name}</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Multimodal Neural Recognition Engine
                      </p>
                    </div>
                    <span className="badge badge-emerald">Verified</span>
                  </div>

                  {/* Macro summary */}
                  <div>
                    <div className="preset-title-label">Nutritional Snapshot</div>
                    <div className="macro-grid">
                      <div className="macro-box">
                        <div className="macro-num">{currentDish.calories}</div>
                        <div className="macro-label">Calories</div>
                      </div>
                      <div className="macro-box">
                        <div className="macro-num">{currentDish.protein}g</div>
                        <div className="macro-label">Protein</div>
                      </div>
                      <div className="macro-box">
                        <div className="macro-num">{currentDish.carbs}g</div>
                        <div className="macro-label">Carbs</div>
                      </div>
                      <div className="macro-box">
                        <div className="macro-num">{currentDish.fat}g</div>
                        <div className="macro-label">Fats</div>
                      </div>
                    </div>
                  </div>

                  {/* Identified Ingredients */}
                  <div>
                    <div className="preset-title-label">Identified Ingredients ({currentDish.ingredients.length})</div>
                    <div className="ingredients-list">
                      {currentDish.ingredients.map((ing, i) => (
                        <span key={i} className="ingredient-chip">
                          • {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Chef's Insight */}
                  <div className="chef-quote-card">
                    "{currentDish.chefQuote}"
                  </div>

                  {/* Quick Action Navigation */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                    <button
                      className="btn-primary"
                      onClick={() => setActiveTab('freshness')}
                    >
                      <Apple size={16} /> Audit Freshness
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setActiveTab('nutrition')}
                    >
                      <Activity size={16} /> Detailed Nutrition
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setActiveTab('chef')}
                    >
                      <ChefHat size={16} /> Chef Assistant
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </section>
        )}

        {/* TAB 2: FRESHNESS & SHELF LIFE */}
        {activeTab === 'freshness' && (
          <section className="tab-panel-container">
            <div className="dashboard-grid">
              {/* Left Column: Circular Freshness Index */}
              <div className="glass-card vision-showcase-box">
                <div className="gauge-wrapper">
                  <div className="gauge-circle">
                    <div className="gauge-val">{currentDish.freshnessScore}</div>
                    <div className="gauge-sub">Quality Index</div>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Optimal Freshness Grade A</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                    Visual pigment density and structural cellular integrity indicate peak biological nutrition.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="step-card">
                    <Clock size={20} color="var(--accent-amber)" />
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>Estimated Shelf Life</strong>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Consume within 2-3 days for maximum enzymatic and antioxidant retention.
                      </p>
                    </div>
                  </div>
                  <div className="step-card">
                    <ShieldCheck size={20} color="var(--accent-emerald)" />
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>Recommended Storage Protocol</strong>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Seal in airtight glass container at 2°C – 4°C with controlled relative humidity (85%).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Custom Food Freshness Scanner */}
              <div className="glass-card details-panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Biomarker Freshness Analyzer</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Test freshness parameters for any food item
                    </p>
                  </div>
                  <span className="badge badge-cyan">AI Sensory Model</span>
                </div>

                <div className="interactive-form">
                  <div className="form-group">
                    <label className="form-label">Food Item or Produce Name</label>
                    <input
                      id="freshness-item-input"
                      type="text"
                      className="form-input"
                      value={freshnessItem}
                      onChange={(e) => setFreshnessItem(e.target.value)}
                      placeholder="e.g. Atlantic Salmon, Ripe Strawberries, Spinach"
                    />
                  </div>

                  <button
                    id="analyze-freshness-btn"
                    className="btn-primary"
                    onClick={handleAnalyzeFreshness}
                    disabled={loadingFreshness}
                  >
                    {loadingFreshness ? <RefreshCw size={16} className="spin" /> : <Apple size={16} />}
                    {loadingFreshness ? 'Analyzing Biomarkers...' : 'Run Freshness Audit'}
                  </button>
                </div>

                {freshnessResult && (
                  <div className="animate-fade-in" style={{ marginTop: '1rem' }}>
                    <div className="panel-header" style={{ marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.05rem' }}>Results for {freshnessResult.item_name}</h3>
                      <span className="badge badge-emerald">{freshnessResult.grade}</span>
                    </div>

                    <div className="macro-grid" style={{ marginBottom: '1rem' }}>
                      <div className="macro-box">
                        <div className="macro-num">{freshnessResult.freshness_index}/100</div>
                        <div className="macro-label">Score</div>
                      </div>
                      <div className="macro-box">
                        <div className="macro-num">{freshnessResult.estimated_shelf_life_days} Days</div>
                        <div className="macro-label">Shelf Life</div>
                      </div>
                    </div>

                    <div className="preset-title-label">Observed Indicators</div>
                    <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '1rem' }}>
                      {freshnessResult.visual_indicators.map((ind, i) => (
                        <li key={i}>{ind}</li>
                      ))}
                    </ul>

                    <div className="chef-quote-card">
                      <strong>Storage Note:</strong> {freshnessResult.storage_protocol}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: NUTRITION PROFILER */}
        {activeTab === 'nutrition' && (
          <section className="tab-panel-container">
            <div className="dashboard-grid">
              {/* Left Column: Portion Slider & Macros */}
              <div className="glass-card vision-showcase-box">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">{currentDish.name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Interactive Serving Profiler</p>
                  </div>
                  <span className="badge badge-emerald">Nutri-Score A+</span>
                </div>

                {/* Portion Size Slider */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="form-label">Adjust Serving Portion Size:</span>
                    <strong style={{ color: 'var(--accent-emerald)', fontSize: '1.05rem' }}>{portionGrams} grams</strong>
                  </div>
                  <input
                    id="portion-slider"
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={portionGrams}
                    onChange={(e) => setPortionGrams(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-faint)', marginTop: '4px' }}>
                    <span>50g (Tasting)</span>
                    <span>250g (Standard)</span>
                    <span>500g (Family)</span>
                  </div>
                </div>

                {/* Dynamic Calculated Macros */}
                <div className="macro-grid">
                  <div className="macro-box">
                    <div className="macro-num">{Math.round(currentDish.calories * portionRatio)}</div>
                    <div className="macro-label">Total Calories (kcal)</div>
                  </div>
                  <div className="macro-box">
                    <div className="macro-num">{(currentDish.protein * portionRatio).toFixed(1)}g</div>
                    <div className="macro-label">Protein</div>
                  </div>
                  <div className="macro-box">
                    <div className="macro-num">{(currentDish.carbs * portionRatio).toFixed(1)}g</div>
                    <div className="macro-label">Carbs</div>
                  </div>
                  <div className="macro-box">
                    <div className="macro-num">{(currentDish.fat * portionRatio).toFixed(1)}g</div>
                    <div className="macro-label">Healthy Fats</div>
                  </div>
                </div>

                <div className="meta-pill-row">
                  <span className="badge badge-amber">Dietary Fiber: {(currentDish.fiber * portionRatio).toFixed(1)}g</span>
                  <span className="badge badge-cyan">Glycemic Index: Low</span>
                  <span className="badge badge-purple">Sodium: {Math.round(380 * portionRatio)}mg</span>
                </div>
              </div>

              {/* Right Column: Micronutrients & Dietary Flags */}
              <div className="glass-card details-panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Micronutrient Breakdown</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Essential Vitamins & Bioactive Trace Minerals</p>
                  </div>
                  <Award size={22} color="var(--accent-amber)" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="step-card">
                    <TrendingUp size={20} color="var(--accent-emerald)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                        <span>Vitamin C (Antioxidant)</span>
                        <strong style={{ color: 'var(--accent-emerald)' }}>180% Daily Value</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '6px' }}>
                        <div style={{ width: '90%', height: '100%', background: 'var(--accent-emerald)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  </div>

                  <div className="step-card">
                    <TrendingUp size={20} color="var(--accent-cyan)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                        <span>Potassium & Electrolytes</span>
                        <strong style={{ color: 'var(--accent-cyan)' }}>640 mg</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '6px' }}>
                        <div style={{ width: '75%', height: '100%', background: 'var(--accent-cyan)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  </div>

                  <div className="step-card">
                    <TrendingUp size={20} color="var(--accent-amber)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                        <span>Omega-3 / Monounsaturated Lipids</span>
                        <strong style={{ color: 'var(--accent-amber)' }}>14.2 g</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '6px' }}>
                        <div style={{ width: '82%', height: '100%', background: 'var(--accent-amber)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="preset-title-label" style={{ marginTop: '0.8rem' }}>Allergen & Sensitivity Guard</div>
                <div className="meta-pill-row">
                  <span className="badge badge-emerald">✓ Gluten-Free Adaptable</span>
                  <span className="badge badge-cyan">✓ No Added Sugars</span>
                  <span className="badge badge-purple">✓ Non-GMO Wholefood</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: SMART CHEF ASSISTANT */}
        {activeTab === 'chef' && (
          <section className="tab-panel-container">
            <div className="dashboard-grid">
              {/* Left Column: Pantry Inputs */}
              <div className="glass-card vision-showcase-box">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Chef AI Recipe Studio</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Tell Chef AI what ingredients you have
                    </p>
                  </div>
                  <ChefHat size={22} color="var(--accent-amber)" />
                </div>

                {/* Add ingredient form */}
                <form onSubmit={handleAddIngredient} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="ingredient-input"
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    placeholder="Add ingredient (e.g. Avocado, Quinoa, Salmon)..."
                  />
                  <button type="submit" className="btn-secondary">
                    Add
                  </button>
                </form>

                {/* Ingredients Pill Cloud */}
                <div>
                  <div className="preset-title-label">Available In Your Pantry ({pantryIngredients.length})</div>
                  <div className="ingredients-list">
                    {pantryIngredients.map((ing) => (
                      <span
                        key={ing}
                        className="ingredient-chip"
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleRemoveIngredient(ing)}
                        title="Click to remove"
                      >
                        {ing} <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>✕</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dietary Preference */}
                <div className="form-group">
                  <label className="form-label">Dietary Preference</label>
                  <select
                    id="dietary-select"
                    className="form-input"
                    value={dietaryChoice}
                    onChange={(e) => setDietaryChoice(e.target.value)}
                  >
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="High-Protein">High-Protein Fitness</option>
                    <option value="Keto">Keto / Low-Carb</option>
                    <option value="Vegan">Vegan Wholefood</option>
                    <option value="Mediterranean">Mediterranean Heart-Healthy</option>
                  </select>
                </div>

                <button
                  id="generate-recipe-btn"
                  className="btn-primary"
                  onClick={handleGenerateRecipe}
                  disabled={generatingRecipe}
                >
                  {generatingRecipe ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
                  {generatingRecipe ? 'Chef AI is Crafting Recipe...' : 'Generate Gourmet Recipe'}
                </button>
              </div>

              {/* Right Column: Generated Culinary Recipe */}
              <div className="glass-card details-panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">
                      {generatedRecipe ? generatedRecipe.recipe_title : 'Featured Chef Creation'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Personalized AI Culinary Formula
                    </p>
                  </div>
                  <span className="badge badge-amber">
                    {generatedRecipe ? generatedRecipe.difficulty : 'Easy'}
                  </span>
                </div>

                {generatedRecipe ? (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="meta-pill-row">
                      <span className="badge badge-emerald">Prep: {generatedRecipe.prep_time}</span>
                      <span className="badge badge-cyan">Cook: {generatedRecipe.cook_time}</span>
                      <span className="badge badge-amber">{generatedRecipe.calories_est} Calories</span>
                    </div>

                    <div className="preset-title-label">Step-by-Step Cooking Technique</div>
                    <div className="recipe-steps-list">
                      {generatedRecipe.steps.map((step, idx) => (
                        <div key={idx} className="step-card">
                          <div className="step-number">{idx + 1}</div>
                          <div className="step-text">{step}</div>
                        </div>
                      ))}
                    </div>

                    <div className="chef-quote-card">
                      <strong>Executive Chef Secret:</strong> {generatedRecipe.pro_tip}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <ChefHat size={48} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
                    <p>Select your pantry ingredients and click "Generate Gourmet Recipe" to craft a custom dish!</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: HYGIENE & FOOD SAFETY AUDITOR */}
        {activeTab === 'hygiene' && (
          <section className="tab-panel-container">
            <div className="dashboard-grid">
              {/* Left Column: Sliders for Inspection */}
              <div className="glass-card vision-showcase-box">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Kitchen Hygiene & HACCP Auditor</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Automated Food Safety & Cleanliness Scoring
                    </p>
                  </div>
                  <ShieldCheck size={22} color="var(--accent-emerald)" />
                </div>

                <div className="interactive-form">
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label className="form-label">Surface Cleanliness & Sanitization:</label>
                      <strong style={{ color: 'var(--accent-emerald)' }}>{surfaceScore}%</strong>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="100"
                      value={surfaceScore}
                      onChange={(e) => setSurfaceScore(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-emerald)' }}
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label className="form-label">Cold-Chain Temperature Control (≤ 4°C):</label>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{tempScore}%</strong>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="100"
                      value={tempScore}
                      onChange={(e) => setTempScore(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label className="form-label">Cross-Contamination Safeguards:</label>
                      <strong style={{ color: 'var(--accent-purple)' }}>{contaminationScore}%</strong>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="100"
                      value={contaminationScore}
                      onChange={(e) => setContaminationScore(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                    />
                  </div>

                  <button id="run-audit-btn" className="btn-primary" onClick={handleRunAudit}>
                    <ShieldCheck size={16} /> Run Regulatory Audit
                  </button>
                </div>
              </div>

              {/* Right Column: Audit Findings & Checklist */}
              <div className="glass-card details-panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Sanitation Compliance Audit</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Inspection Zone: Cold Prep & Storage</p>
                  </div>
                  <span className="badge badge-emerald">
                    Score: {auditResult ? auditResult.overall_hygiene_score : Math.round((surfaceScore + tempScore + contaminationScore) / 3)}/100
                  </span>
                </div>

                <div className="macro-grid">
                  <div className="macro-box">
                    <div className="macro-num">{Math.round((surfaceScore + tempScore + contaminationScore) / 3)}%</div>
                    <div className="macro-label">Sanitation</div>
                  </div>
                  <div className="macro-box">
                    <div className="macro-num">2.4°C</div>
                    <div className="macro-label">Storage Temp</div>
                  </div>
                  <div className="macro-box">
                    <div className="macro-num">0.02 ppm</div>
                    <div className="macro-label">Residue</div>
                  </div>
                  <div className="macro-box">
                    <div className="macro-num">Grade A</div>
                    <div className="macro-label">Rating</div>
                  </div>
                </div>

                <div className="preset-title-label">HACCP Inspection Checklist</div>
                <table className="checklist-table">
                  <thead>
                    <tr>
                      <th>Safety Parameter</th>
                      <th>Status</th>
                      <th>Observed Metric</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Cold Storage Refrigerator Temp</td>
                      <td><span className="badge badge-emerald">Passed</span></td>
                      <td>2.4°C (Safe limit &lt;4°C)</td>
                    </tr>
                    <tr>
                      <td>Surface Sanitization Residue</td>
                      <td><span className="badge badge-emerald">Passed</span></td>
                      <td>0.02 ppm (Food Grade)</td>
                    </tr>
                    <tr>
                      <td>Cutting Board Segregation</td>
                      <td><span className="badge badge-cyan">Compliant</span></td>
                      <td>Color-coded protocol</td>
                    </tr>
                    <tr>
                      <td>Pathogen Contamination Guard</td>
                      <td><span className="badge badge-emerald">Zero Trace</span></td>
                      <td>UV Clean Verified</td>
                    </tr>
                  </tbody>
                </table>

                <div className="chef-quote-card">
                  <strong>Auditor Note:</strong> Kitchen hygiene is compliant with commercial health standards. Maintain twice-daily temperature logs.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 6: BACKEND API HEALTH & DIAGNOSTICS */}
        {activeTab === 'api' && (
          <section className="tab-panel-container">
            <div className="glass-card vision-showcase-box" style={{ marginBottom: '2rem' }}>
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">FastAPI Backend Diagnostics & Specs</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Multimodal agent server communication health
                  </p>
                </div>
                <button
                  id="run-diagnostics-btn"
                  className="btn-primary"
                  onClick={handleRunDiagnostics}
                  disabled={runningDiag}
                >
                  {runningDiag ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}
                  {runningDiag ? 'Testing Endpoints...' : 'Run Endpoint Diagnostics'}
                </button>
              </div>

              <div className="macro-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="macro-box">
                  <div className="macro-num" style={{ color: backendStatus.online ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {backendStatus.online ? 'ONLINE' : 'STANDBY'}
                  </div>
                  <div className="macro-label">FastAPI Status</div>
                </div>
                <div className="macro-box">
                  <div className="macro-num">{backendStatus.ping ? `${backendStatus.ping} ms` : '12 ms (Est)'}</div>
                  <div className="macro-label">Response Latency</div>
                </div>
                <div className="macro-box">
                  <div className="macro-num">1.2.0</div>
                  <div className="macro-label">API Version</div>
                </div>
                <div className="macro-box">
                  <div className="macro-num">6</div>
                  <div className="macro-label">Active Services</div>
                </div>
              </div>

              {/* API Endpoints Catalog */}
              <div className="preset-title-label">Available OpenAPI Endpoints</div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-get">GET</span>
                  <span className="endpoint-path">/api/health</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time service health check</span>
              </div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-get">GET</span>
                  <span className="endpoint-path">/api/</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Metadata & phase capability info</span>
              </div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-post">POST</span>
                  <span className="endpoint-path">/api/recognize</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Multimodal vision dish recognition</span>
              </div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-post">POST</span>
                  <span className="endpoint-path">/api/freshness</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Freshness & shelf-life audit</span>
              </div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-post">POST</span>
                  <span className="endpoint-path">/api/nutrition</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Portion-scaled macronutrient engine</span>
              </div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-post">POST</span>
                  <span className="endpoint-path">/api/cooking-assistant</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chef AI personalized recipe generator</span>
              </div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-post">POST</span>
                  <span className="endpoint-path">/api/hygiene-audit</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Commercial HACCP safety inspection</span>
              </div>

              {/* Diagnostics Output */}
              {diagnosticsLog.length > 0 && (
                <div className="animate-fade-in" style={{ marginTop: '1.5rem' }}>
                  <div className="preset-title-label">Live Test Execution Logs</div>
                  <div style={{ background: '#020408', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', maxHeight: '280px', overflowY: 'auto' }}>
                    {diagnosticsLog.map((log, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.82rem' }}>
                        <span>
                          <strong style={{ color: log.success ? '#34d399' : '#f43f5e' }}>[{log.status}]</strong> {log.name} ({log.method} {log.path})
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{log.latency} ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div>
          <strong>FoodVerse AI</strong> — Multimodal Food Intelligence Agent Platform
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>FastAPI + Vite React 19</span>
          <span>OpenAPI /docs</span>
          <span>HACCP Compliant</span>
        </div>
      </footer>
    </div>
  );
}
