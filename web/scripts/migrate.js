const fs = require('fs');
const path = require('path');

const draftPath = path.join(__dirname, 'exercises-draft.json');
const outputPath = path.join(__dirname, '../src/data/exercises-translated.json');

const draftData = JSON.parse(fs.readFileSync(draftPath, 'utf8'));

// Diccionarios de Traducción
const categoryMap = {
  'chest': 'Pecho',
  'upper legs': 'Piernas',
  'lower legs': 'Piernas',
  'back': 'Espalda',
  'neck': 'Cuello',
  'cardio': 'Cardio',
  'waist': 'Abdomen',
  'upper arms': 'Brazos',
  'lower arms': 'Antebrazos',
  'shoulders': 'Hombros'
};

const targetMap = {
  'pectorals': 'Pectorales',
  'traps': 'Trapecios',
  'forearms': 'Antebrazos',
  'glutes': 'Glúteos',
  'delts': 'Deltoides',
  'serratus anterior': 'Serrato Mayor',
  'triceps': 'Tríceps',
  'abductors': 'Abductores',
  'adductors': 'Aductores',
  'spine': 'Erectores Espinales',
  'quads': 'Cuádriceps',
  'hamstrings': 'Isquiotibiales',
  'abs': 'Abdominales',
  'lats': 'Dorsales',
  'biceps': 'Bíceps',
  'calves': 'Gemelos',
  'upper back': 'Espalda Alta',
  'levator scapulae': 'Elevador de la Escápula',
  'cardiovascular system': 'Cardio'
};

const equipmentMap = {
  'barbell': 'Barra',
  'olympic barbell': 'Barra Olímpica',
  'ez barbell': 'Barra EZ',
  'trap bar': 'Barra Hexagonal',
  'dumbbell': 'Mancuernas',
  'cable': 'Polea',
  'smith machine': 'Multipower (Smith)',
  'body weight': 'Peso Corporal',
  'kettlebell': 'Pesa Rusa (Kettlebell)',
  'leverage machine': 'Máquina de Palanca',
  'assisted': 'Asistido',
  'band': 'Bandas Elásticas',
  'resistance band': 'Bandas Elásticas',
  'weighted': 'Con Lastre',
  'medicine ball': 'Balón Medicinal',
  'stability ball': 'Fitball',
  'bosu ball': 'Bosu',
  'rope': 'Cuerda',
  'sled machine': 'Trineo',
  'wheel roller': 'Rueda Abdominal',
  'roller': 'Foam Roller',
  'tire': 'Neumático',
  'stationary bike': 'Bicicleta Estática',
  'elliptical machine': 'Elíptica',
  'stepmill machine': 'Escaladora',
  'upper body ergometer': 'Ergómetro de Brazos',
  'skierg machine': 'SkiErg',
  'hammer': 'Martillo'
};

const exactNameTranslations = {
  'air bike': 'Bicicleta abdominal',
  'dead bug': 'Dead bug',
  'inchworm': 'Gusano (Inchworm)',
  'farmers walk': 'Paseo del granjero',
  'sissy squat': 'Sentadilla Sissy',
  'chin-up': 'Dominadas supinas',
  'pull-up': 'Dominadas',
  'muscle up': 'Muscle up',
  'finger curls': 'Curl de dedos',
  'wrist circles': 'Rotación de muñecas',
  'sphinx': 'Esfinge',
  'superman': 'Superman',
  'run': 'Carrera',
  'burpee': 'Burpee',
  'bear crawl': 'Paso del oso',
  'jack burpee': 'Burpee con salto de tijera',
  'skater hops': 'Saltos de patinador',
  'biceps pull-up': 'Dominadas para bíceps',
  'skin the cat': 'Skin the cat',
  'hanging leg raise': 'Elevación de piernas colgado',
  'plank': 'Plancha',
  'flag': 'Bandera humana (Flag)',
  'cocoons': 'Capullos (Cocoons)',
  'pelvic tilt': 'Retroversión pélvica',
  'upward facing dog': 'Perro boca arriba',
  'power clean': 'Power clean',
  'glute-ham raise': 'Elevación glúteo-femoral',
  'butterfly yoga pose': 'Postura de mariposa (Yoga)',
  'straight leg outer hip abductor': 'Abducción de cadera con pierna recta',
  'front lever': 'Front lever',
  'back lever': 'Back lever',
  'full planche': 'Plancha completa',
  'full maltese': 'Maltesa completa (Maltese)',
  'gorilla chin': 'Dominadas gorila',
  'korean dips': 'Fondos coreanos',
  'impossible dips': 'Fondos imposibles',
  'sphinx push-up': 'Flexiones esfinge',
  'world greatest stretch': 'El mejor estiramiento del mundo',
  'three bench dip': 'Fondos entre tres bancos',
  'quads': 'Cuádriceps',
  'potty squat': 'Sentadilla profunda'
};

const prefixMap = {
  'ez barbell': 'con barra EZ',
  'trap bar': 'con barra hexagonal',
  'barbell': 'con barra',
  'dumbbell': 'con mancuernas',
  'smith machine': 'en multipower (Smith)',
  'smith': 'en multipower (Smith)',
  'cable': 'en polea',
  'lever': 'en máquina',
  'band': 'con banda',
  'weighted': 'con lastre',
  'kettlebell': 'con pesa rusa'
};

function translateName(name) {
  let lowerName = name.toLowerCase().trim();
  
  if (exactNameTranslations[lowerName]) {
    return exactNameTranslations[lowerName];
  }

  // Extraer prefijos de equipamiento para moverlos al final
  const suffixes = [];
  let foundPrefix = true;
  
  while (foundPrefix) {
    foundPrefix = false;
    for (const [prefix, suffix] of Object.entries(prefixMap)) {
      if (lowerName.startsWith(prefix + ' ')) {
        lowerName = lowerName.slice(prefix.length + 1).trim();
        suffixes.push(suffix);
        foundPrefix = true;
        break;
      }
    }
  }

  if (exactNameTranslations[lowerName]) {
    lowerName = exactNameTranslations[lowerName];
  } else {
    // Primero frases compuestas de ejercicio + modificador para evitar desorden gramatical
    lowerName = lowerName.replace(/bench press/g, 'press de banca');
    lowerName = lowerName.replace(/push-up|push up/g, 'flexiones');
    
    lowerName = lowerName.replace(/lat pulldown/g, 'jalón al pecho');
    lowerName = lowerName.replace(/pulldown/g, 'jalón al pecho');
    lowerName = lowerName.replace(/pullover/g, 'pullover');
    
    lowerName = lowerName.replace(/upright row/g, 'remo al mentón');
    lowerName = lowerName.replace(/t bar row/g, 'remo en barra T');
    lowerName = lowerName.replace(/seated row/g, 'remo sentado');
    lowerName = lowerName.replace(/inverted row/g, 'remo invertido');
    lowerName = lowerName.replace(/towel row/g, 'remo con toalla');
    lowerName = lowerName.replace(/row/g, 'remo');
    
    lowerName = lowerName.replace(/drag curl/g, 'curl de arrastre');
    lowerName = lowerName.replace(/preacher curl/g, 'curl predicador');
    lowerName = lowerName.replace(/hammer curl/g, 'curl martillo');
    lowerName = lowerName.replace(/bicep curl|biceps curl/g, 'curl de bíceps');
    lowerName = lowerName.replace(/reverse curl/g, 'curl invertido');
    lowerName = lowerName.replace(/seated curl/g, 'curl sentado');
    lowerName = lowerName.replace(/cable curl/g, 'curl en polea');
    lowerName = lowerName.replace(/wrist curl/g, 'curl de muñeca');
    lowerName = lowerName.replace(/finger curl/g, 'curl de dedos');
    lowerName = lowerName.replace(/curl/g, 'curl');
    
    lowerName = lowerName.replace(/kickback/g, 'patada de tríceps');
    lowerName = lowerName.replace(/back extension/g, 'extensión de espalda');
    lowerName = lowerName.replace(/leg curl/g, 'curl femoral');
    lowerName = lowerName.replace(/leg extension/g, 'extensión de piernas');
    lowerName = lowerName.replace(/deadlift/g, 'peso muerto');
    lowerName = lowerName.replace(/shrug/g, 'encogimiento de hombros');
    
    lowerName = lowerName.replace(/front raise/g, 'elevación frontal');
    lowerName = lowerName.replace(/lateral raise/g, 'elevación lateral');
    lowerName = lowerName.replace(/y-raise/g, 'elevación en Y');
    lowerName = lowerName.replace(/rear fly|reverse fly/g, 'pájaros (deltoides posterior)');
    lowerName = lowerName.replace(/fly/g, 'aperturas');
    
    lowerName = lowerName.replace(/split squat/g, 'sentadilla búlgara (split)');
    lowerName = lowerName.replace(/chair squat/g, 'sentadilla en silla');
    lowerName = lowerName.replace(/bench squat/g, 'sentadilla en banco');
    lowerName = lowerName.replace(/wide squat/g, 'sentadilla con agarre ancho');
    lowerName = lowerName.replace(/narrow squat/g, 'sentadilla con agarre cerrado');
    lowerName = lowerName.replace(/squat/g, 'sentadilla');
    
    lowerName = lowerName.replace(/lunge/g, 'zancada');
    lowerName = lowerName.replace(/crunch/g, 'crunch');
    lowerName = lowerName.replace(/dips|dip/g, 'fondos');
    lowerName = lowerName.replace(/thruster/g, 'thruster');
    lowerName = lowerName.replace(/stretch/g, 'estiramiento');
    lowerName = lowerName.replace(/front lever/g, 'front lever');
    lowerName = lowerName.replace(/back lever/g, 'back lever');
    lowerName = lowerName.replace(/hip lift/g, 'elevación de cadera');
    lowerName = lowerName.replace(/hip adduction/g, 'aducción de cadera');
    lowerName = lowerName.replace(/hip abduction/g, 'abducción de cadera');
    lowerName = lowerName.replace(/toe touch/g, 'toque de puntas');
    lowerName = lowerName.replace(/toe raise/g, 'elevación de talones');
    lowerName = lowerName.replace(/calves|calf/g, 'gemelos');

    // Modificadores internos
    lowerName = lowerName.replace(/lying/g, 'tumbado');
    lowerName = lowerName.replace(/seated/g, 'sentado');
    lowerName = lowerName.replace(/standing/g, 'de pie');
    lowerName = lowerName.replace(/incline/g, 'inclinado');
    lowerName = lowerName.replace(/decline/g, 'declinado');
    lowerName = lowerName.replace(/one arm|single arm/g, 'a un brazo');
    lowerName = lowerName.replace(/one leg|single leg/g, 'a una pierna');
    lowerName = lowerName.replace(/narrow/g, 'agarre cerrado');
    lowerName = lowerName.replace(/wide/g, 'agarre ancho');
    lowerName = lowerName.replace(/reverse/g, 'invertido');
    lowerName = lowerName.replace(/close/g, 'cerrado');
    lowerName = lowerName.replace(/low/g, 'bajo');
    lowerName = lowerName.replace(/middle/g, 'medio');
    lowerName = lowerName.replace(/high/g, 'alto');
  }

  // Concatenar el nombre base con los sufijos de equipamiento
  let finalName = lowerName;
  if (suffixes.length > 0) {
    finalName += ' ' + suffixes.join(' ');
  }

  // Limpieza de gramática y espacios dobles
  let result = finalName.split(/\s+/).filter(Boolean).join(' ');
  
  // Poner primera letra en mayúscula
  return result.charAt(0).toUpperCase() + result.slice(1);
}

const translatedExercises = draftData.map(ex => {
  const filename = path.basename(ex.gif_url);
  const webmFilename = path.parse(filename).name + '.webm';
  const webmUrl = `/assets/exercises/${webmFilename}`;

  const nombreEsp = translateName(ex.name);
  const grupoMuscular = categoryMap[ex.category] || ex.category;
  const musculoPrincipal = targetMap[ex.target] || ex.target;
  const equipamiento = equipmentMap[ex.equipment] || ex.equipment;
  
  // Obtener array de instrucciones en español
  const instrucciones = ex.instruction_steps && ex.instruction_steps.es 
    ? ex.instruction_steps.es 
    : [ex.instructions.es || ex.instructions.en];

  return {
    id: ex.id,
    nombre: nombreEsp,
    grupoMuscular: grupoMuscular,
    musculoPrincipal: musculoPrincipal,
    equipamiento: equipamiento,
    instrucciones: instrucciones,
    gifUrl: webmUrl
  };
});

fs.writeFileSync(outputPath, JSON.stringify(translatedExercises, null, 2));
console.log(`Migración completada. Guardados ${translatedExercises.length} ejercicios traducidos en: ${outputPath}`);
