const fs = require('fs');
const path = require('path');

const datasetPath = path.join(__dirname, '../../exercises-dataset/data/exercises.json');
const rawData = fs.readFileSync(datasetPath, 'utf8');
const exercises = JSON.parse(rawData);

// Equipos principales
const ALLOWED_EQUIPMENTS = [
  'barbell', 'dumbbell', 'cable', 'body weight', 'smith machine', 'ez barbell',
  'kettlebell', 'leverage machine', 'band', 'weighted', 'medicine ball', 'trap bar'
];

// Filtramos ejercicios raros o con equipos oscuros
let filtered = exercises.filter(ex => {
  if (!ALLOWED_EQUIPMENTS.includes(ex.equipment)) return false;
  // Filtrar nombres extremadamente largos (suelen ser variaciones muy específicas o repetitivas)
  if (ex.name.length > 50) return false;
  // Quitar cosas redundantes como "roll" de rodillos si no es abdominal, o ejercicios con nombres raros
  if (ex.name.includes('roll') && !ex.name.includes('roller')) return false;
  return true;
});

// Agrupamos por target muscular para asegurar balance
const grouped = {};
filtered.forEach(ex => {
  if (!grouped[ex.target]) grouped[ex.target] = [];
  grouped[ex.target].push(ex);
});

// Seleccionamos un número equilibrado por grupo muscular para llegar a unos 200-240 en total
const selected = [];
const targetLimits = {
  'abs': 25,
  'pectorals': 25,
  'biceps': 20,
  'glutes': 20,
  'delts': 22,
  'triceps': 20,
  'upper back': 15,
  'lats': 15,
  'calves': 8,
  'quads': 15,
  'forearms': 8,
  'cardiovascular system': 10,
  'hamstrings': 12,
  'spine': 8,
  'traps': 8,
  'adductors': 4,
  'abductors': 4
};

Object.keys(grouped).forEach(target => {
  const list = grouped[target];
  // Ordenar por longitud de nombre (más cortos primero = más generales)
  list.sort((a, b) => a.name.length - b.name.length);
  const limit = targetLimits[target] || 10;
  const taken = list.slice(0, limit);
  selected.push(...taken);
});

console.log(`Seleccionados ${selected.length} ejercicios de ${exercises.length} totales.`);

fs.writeFileSync(
  path.join(__dirname, 'exercises-draft.json'),
  JSON.stringify(selected, null, 2)
);
