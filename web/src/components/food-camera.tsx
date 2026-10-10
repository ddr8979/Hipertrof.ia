// Componente de cámara para reconocimiento de alimentos.
// Usa la API getUserMedia + TensorFlow.js (cargado dinámicamente) para clasificación local.
// Fallback: entrada manual si el usuario no concede permisos o el modelo falla.
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Camera, X, CircleNotch as Loader2, Check, Warning as AlertTriangle } from "@phosphor-icons/react";

// Tipos de alimentos reconocibles (subset común para demo)
export const FOOD_CLASSES = [
  "apple", "banana", "bread", "broccoli", "carrot", "cheese", "chicken",
  "egg", "fish", "meat", "milk", "orange", "pasta", "potato", "rice",
  "salad", "tomato", "yogurt"
] as const;

type FoodClass = typeof FOOD_CLASSES[number];

// Estimaciones calóricas por 100g (aproximadas)
const CALORIES_PER_100G: Record<FoodClass, number> = {
  apple: 52, banana: 89, bread: 265, broccoli: 34, carrot: 41,
  cheese: 402, chicken: 165, egg: 155, fish: 206, meat: 250,
  milk: 42, orange: 47, pasta: 131, potato: 77, rice: 130,
  salad: 15, tomato: 18, yogurt: 59
};

// Estimación de peso típico por porción (gramos)
const TYPICAL_PORTION_G: Record<FoodClass, number> = {
  apple: 180, banana: 120, bread: 50, broccoli: 150, carrot: 80,
  cheese: 30, chicken: 150, egg: 60, fish: 150, meat: 150,
  milk: 200, orange: 130, pasta: 200, potato: 200, rice: 150,
  salad: 100, tomato: 80, yogurt: 125
};

export interface DetectedFood {
  class: FoodClass;
  confidence: number;
  calories: number;
  portion_g: number;
}

interface UseFoodCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  detections: DetectedFood[];
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capture: () => Promise<DetectedFood | null>;
  clearDetections: () => void;
}

export function useFoodCamera(): UseFoodCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detections, setDetections] = useState<DetectedFood[]>([]);
  const modelRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

// Helper para cargar scripts externos dinámicamente
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("SSR"));
      return;
    }
    // Verificar si ya está cargado
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

// Cargar modelo TensorFlow.js dinámicamente (MobileNet + head personalizado)
  const loadModel = useCallback(async () => {
    if (modelRef.current) return modelRef.current;
    setIsLoading(true);
    setError(null);
    try {
      // Cargar TF.js y MobileNet desde CDN usando loadScript
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@latest/dist/mobilenet.min.js");
      // @ts-ignore - MobileNet cargado globalmente
      const mobilenet = window.mobilenet;
      if (!mobilenet) throw new Error("MobileNet no disponible");
      modelRef.current = await mobilenet.load();
      return modelRef.current;
    } catch (e) {
      const msg = "No se pudo cargar el modelo de IA. Usa la entrada manual.";
      setError(msg);
      console.error(e);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (isActive) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
      // Cargar modelo en background
      loadModel();
    } catch (e) {
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
      console.error(e);
    }
  }, [isActive, loadModel]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
  }, []);

  const capture = useCallback(async (): Promise<DetectedFood | null> => {
    if (!videoRef.current || !canvasRef.current || !modelRef.current) {
      await loadModel();
    }
    if (!videoRef.current || !canvasRef.current || !modelRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      const predictions = await modelRef.current.classify(canvas);
      // Filtrar solo clases de comida conocidas
      const foodPred = predictions.find((p: any) => 
        FOOD_CLASSES.some(fc => p.className.toLowerCase().includes(fc))
      );
      if (!foodPred) return null;

      const foodClass = FOOD_CLASSES.find(fc => 
        foodPred.className.toLowerCase().includes(fc)
      ) as FoodClass;
      if (!foodClass) return null;

      const portion = TYPICAL_PORTION_G[foodClass];
      const calories = Math.round(CALORIES_PER_100G[foodClass] * portion / 100);
      const detection: DetectedFood = {
        class: foodClass,
        confidence: foodPred.probability,
        calories,
        portion_g: portion
      };
      setDetections(prev => [detection, ...prev.slice(0, 9)]);
      return detection;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [loadModel]);

  const clearDetections = useCallback(() => setDetections([]), []);

  // Cleanup al desmontar
  useEffect(() => () => stopCamera(), [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isActive,
    isLoading,
    error,
    detections,
    startCamera,
    stopCamera,
    capture,
    clearDetections
  };
}

// Componente UI de la cámara
interface FoodCameraProps {
  onDetect?: (food: DetectedFood) => void;
  compact?: boolean;
}

export function FoodCamera({ onDetect, compact = false }: FoodCameraProps) {
  const {
    videoRef,
    canvasRef,
    isActive,
    isLoading,
    error,
    detections,
    startCamera,
    stopCamera,
    capture,
    clearDetections
  } = useFoodCamera();

  const [showResults, setShowResults] = useState(false);

  return (
    <div className={cn("rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden", compact && "max-h-64")}>
      {/* Vista de cámara */}
      <div className="relative aspect-video bg-[var(--surface-2)]">
        <video
          ref={videoRef}
          className="size-full object-cover"
          playsInline
          muted
          aria-hidden="true"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {!isActive ? (
          <div className="flex h-full items-center justify-center gap-3 p-4 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <Camera className="size-7" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text)]">Escanear comida</p>
                <p className="text-sm text-[var(--muted)]">Apunta a tu plato y captura</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Overlay de guía */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="size-48 border-2 border-[var(--accent)]/50 rounded-xl" />
            </div>
            {/* Controles */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={capture}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                Capturar
              </Button>
              <Button variant="ghost" size="icon" onClick={stopCamera} aria-label="Cerrar cámara">
                <X className="size-5" />
              </Button>
            </div>
            {error && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm font-medium text-[var(--danger)]">
                <AlertTriangle className="size-4" /> {error}
              </div>
            )}
          </>
        )}
      </div>

      {/* Resultados detectados */}
      {detections.length > 0 && (
        <div className={cn("border-t border-[var(--border)] p-3", compact && "max-h-40 overflow-y-auto")}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-[var(--text)]">Detectados ({detections.length})</h4>
            <Button variant="ghost" size="sm" onClick={clearDetections}>
              <X className="size-3.5" /> Limpiar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {detections.map((d, i) => (
              <button
                key={i}
                onClick={() => onDetect?.(d)}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-soft)] px-3 py-1.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] transition-colors"
              >
                <span className="capitalize">{d.class}</span>
                <span className="text-xs font-bold opacity-70">~{d.calories} kcal</span>
                <Check className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook para manejo de estado de alimentos en la calculadora
export function useFoodLog() {
  const [foods, setFoods] = useState<DetectedFood[]>([]);
  
  const addFood = useCallback((food: DetectedFood) => {
    setFoods(prev => [food, ...prev]);
  }, []);
  
  const removeFood = useCallback((index: number) => {
    setFoods(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const clearFoods = useCallback(() => setFoods([]), []);
  
  const totals = foods.reduce((acc, f) => ({
    calories: acc.calories + f.calories,
    protein: acc.protein + (f.class === "chicken" || f.class === "fish" || f.class === "meat" || f.class === "egg" ? f.calories * 0.3 / 4 : 0),
    carbs: acc.carbs + (f.class === "rice" || f.class === "pasta" || f.class === "bread" || f.class === "potato" || f.class === "banana" ? f.calories * 0.6 / 4 : 0),
    fat: acc.fat + (f.class === "cheese" || f.class === "meat" ? f.calories * 0.4 / 9 : 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return { foods, addFood, removeFood, clearFoods, totals };
}