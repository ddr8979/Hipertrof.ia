import os
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor

# Configuración de rutas
DRAFT_JSON = "./web/scripts/exercises-draft.json"
INPUT_DIR = "./exercises-dataset/videos"
OUTPUT_DIR = "./web/public/assets/exercises"
MAX_WORKERS = 8  # Ajustar según la CPU

os.makedirs(OUTPUT_DIR, exist_ok=True)

def convert_gif_to_webm(gif_path, output_path):
    """
    Convierte un GIF a WebM usando FFmpeg optimizado para loops web de bajo peso.
    """
    if os.path.exists(output_path):
        return True
        
    cmd = [
        'ffmpeg', '-y',
        '-i', gif_path,
        '-c:v', 'libvpx-vp9',  # Codec VP9 para máxima compresión
        '-crf', '32',          # Calidad constante
        '-b:v', '0',
        '-an',                 # Remover audio
        '-pix_fmt', 'yuva420p', # Mantiene transparencias si las hay
        output_path
    ]
    
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except subprocess.CalledProcessError:
        print(f"Error al procesar: {gif_path}")
        return False

def process_selected_exercises():
    if not os.path.exists(DRAFT_JSON):
        print(f"Error: {DRAFT_JSON} no existe. Corre primero select.js.")
        return

    with open(DRAFT_JSON, 'r', encoding='utf-8') as f:
        selected_exercises = json.load(f)

    tasks = []
    for ex in selected_exercises:
        gif_subpath = ex['gif_url']  # e.g. "videos/0001-2gPfomN.gif"
        filename = os.path.basename(gif_subpath)
        gif_path = os.path.join("./exercises-dataset", gif_subpath)
        
        webm_filename = os.path.splitext(filename)[0] + '.webm'
        output_path = os.path.join(OUTPUT_DIR, webm_filename)
        
        if os.path.exists(gif_path):
            tasks.append((gif_path, output_path))
        else:
            print(f"Advertencia: Archivo no encontrado: {gif_path}")

    print(f"Encontrados {len(tasks)} ejercicios seleccionados. Iniciando conversión a WebM...")
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        results = list(executor.map(lambda t: convert_gif_to_webm(*t), tasks))
        
    successful = sum(1 for r in results if r)
    print(f"Proceso finalizado. Éxito: {successful}/{len(tasks)} convertidos.")

if __name__ == "__main__":
    process_selected_exercises()
