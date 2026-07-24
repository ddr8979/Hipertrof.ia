export interface GlosarioItem {
  term: string;
  definition: string;
  category: "Entrenamiento" | "Músculos" | "Nutrición" | "Equipamiento";
  example?: string;
}

export const GLOSARIO_ITEMS: GlosarioItem[] = [
  // ── ENTRENAMIENTO ────────────────────────────────────────────────────────────
  {
    term: "Repetición (Rep)",
    definition: "Es realizar un movimiento completo una sola vez. Por ejemplo, subir y bajar la mancuerna una vez en flexión de bíceps.",
    category: "Entrenamiento",
    example: "Si hacés '10 repeticiones', repetís el movimiento 10 veces seguidas."
  },
  {
    term: "Serie (Set)",
    definition: "Un grupo de repeticiones seguidas de un descanso. Es el bloque de trabajo.",
    category: "Entrenamiento",
    example: "Hacer '3 series de 10 repeticiones' significa hacer 10 reps, descansar, hacer otras 10, descansar, y hacer las últimas 10."
  },
  {
    term: "1RM (Repetición Máxima)",
    definition: "El peso máximo absoluto que podés levantar en un ejercicio para una sola repetición completa con buena técnica.",
    category: "Entrenamiento",
    example: "Si tu 1RM en Sentadilla es 100 kg, no podés levantar 101 kg ni una sola vez."
  },
  {
    term: "Fallo Muscular",
    definition: "El punto en el que el músculo está tan cansado que no puede completar otra repetición con buena técnica.",
    category: "Entrenamiento",
    example: "Hacer una serie 'al fallo' significa hacer repeticiones hasta que físicamente no puedas subir el peso otra vez."
  },
  {
    term: "RIR (Repeticiones en Reserva)",
    definition: "Indica cuántas repeticiones te faltaron para llegar al fallo al terminar una serie. Mide qué tan duro entrenaste.",
    category: "Entrenamiento",
    example: "Un RIR 2 significa que terminaste la serie sintiendo que podrías haber hecho exactamente 2 repeticiones más antes de fallar."
  },
  {
    term: "RPE (Escala de Esfuerzo Percibido)",
    definition: "Una escala del 1 al 10 que mide el nivel de esfuerzo que sentiste. 10 es el esfuerzo máximo (fallo) y 1 es extremadamente fácil.",
    category: "Entrenamiento",
    example: "Un RPE 8 equivale a un RIR 2 (esfuerzo muy alto, te quedaron 2 repeticiones en el tanque)."
  },
  {
    term: "Super Serie (Superset)",
    definition: "Realizar dos ejercicios diferentes uno inmediatamente después del otro, sin descansar en el medio.",
    category: "Entrenamiento",
    example: "Hacer una serie de flexión de bíceps e ir directo a hacer extensión de tríceps, y recién ahí descansar."
  },
  {
    term: "Bi-serie",
    definition: "Similar a la superserie, pero realizando de corrido dos ejercicios que trabajan el mismo grupo muscular.",
    category: "Entrenamiento",
    example: "Hacer flexiones de pecho y pasar directamente a prensa de pecho con mancuernas."
  },
  {
    term: "Tri-serie",
    definition: "Realizar tres ejercicios diferentes de forma consecutiva sin descanso intermedio.",
    category: "Entrenamiento",
    example: "Hacer sentadillas, luego zancadas y finalmente extensiones de piernas seguidas."
  },
  {
    term: "Drop Set (Serie Descendente)",
    definition: "Una técnica donde realizás una serie al fallo, bajás el peso inmediatamente (un 20-30%) y continuás haciendo repeticiones sin descansar.",
    category: "Entrenamiento",
    example: "Hacer press de hombros con 20kg hasta fallar, soltarlos, agarrar de 15kg y seguir hasta fallar de nuevo."
  },
  {
    term: "Fase Excéntrica (Negativa)",
    definition: "La parte del ejercicio donde el músculo se estira bajo tensión y resiste la gravedad. Suele ser cuando bajás el peso.",
    category: "Entrenamiento",
    example: "Al bajar la barra hacia tu pecho en el press de banca."
  },
  {
    term: "Fase Concéntrica (Positiva)",
    definition: "La parte del ejercicio donde el músculo se acorta al vencer la resistencia del peso. Es cuando levantás el peso.",
    category: "Entrenamiento",
    example: "Al empujar la barra hacia arriba alejándola del pecho en el press de banca."
  },
  {
    term: "TUT (Tiempo Bajo Tensión)",
    definition: "El tiempo total que el músculo pasa trabajando activamente durante una serie.",
    category: "Entrenamiento",
    example: "Si hacés cada repetición bajando en 3 segundos y subiendo en 1, el TUT de 10 repeticiones es de 40 segundos."
  },
  {
    term: "Sobrecarca Progresiva",
    definition: "El principio fundamental del crecimiento muscular: aumentar el desafío de forma gradual a lo largo del tiempo (más peso, más repeticiones o mejor técnica).",
    category: "Entrenamiento",
    example: "Si hoy levantás 50 kg en sentadilla, buscar levantar 52 kg o hacer una repetición extra la próxima semana."
  },
  {
    term: "Hipertrofia",
    definition: "El término científico para el aumento del tamaño de las fibras musculares (crecimiento muscular).",
    category: "Entrenamiento"
  },
  {
    term: "Volumen de Entrenamiento",
    definition: "La cantidad total de trabajo que realizás en un período de tiempo (por sesión o por semana). Se suele medir en cantidad de series efectivas por músculo.",
    category: "Entrenamiento",
    example: "Hacer 12 series de pecho a la semana es tu volumen semanal para ese músculo."
  },
  {
    term: "Frecuencia de Entrenamiento",
    definition: "La cantidad de veces que entrenás un grupo muscular específico por semana.",
    category: "Entrenamiento",
    example: "Si hacés piernas los lunes y jueves, tu frecuencia de entrenamiento para piernas es 2."
  },
  {
    term: "Calentamiento (Entrada en calor)",
    definition: "Preparar el cuerpo y la mente antes del entrenamiento mediante ejercicios de movilidad y series de aproximación ligeras para prevenir lesiones.",
    category: "Entrenamiento"
  },
  {
    term: "Serie de Aproximación",
    definition: "Series de calentamiento previas a tus series de trabajo real. Sirven para lubricar articulaciones y acostumbrar el sistema nervioso al peso.",
    category: "Entrenamiento",
    example: "Si vas a entrenar con 80 kg, hacés una serie con la barra vacía, luego otra con 40 kg, luego 60 kg y recién empezás a contar tus series de trabajo."
  },
  {
    term: "Deload (Descarga)",
    definition: "Una semana de entrenamiento planificada donde se reduce drásticamente el peso o el volumen para permitir que el cuerpo se recupere del cansancio acumulado.",
    category: "Entrenamiento"
  },
  {
    term: "DOMS (Agujetas / Dolores del día después)",
    definition: "El dolor o rigidez muscular que aparece entre 24 y 48 horas después de hacer ejercicio intenso al que no estás acostumbrado.",
    category: "Entrenamiento"
  },
  {
    term: "Rango de Movimiento (ROM)",
    definition: "La trayectoria completa que realiza una articulación o músculo desde su posición de máximo estiramiento hasta la de máxima contracción.",
    category: "Entrenamiento",
    example: "En una sentadilla, bajar hasta que las caderas pasen las rodillas asegura un ROM completo."
  },

  // ── MÚSCULOS ─────────────────────────────────────────────────────────────────
  {
    term: "Bíceps",
    definition: "El músculo frontal del brazo superior, encargado de flexionar el codo (traer la mano hacia el hombro).",
    category: "Músculos"
  },
  {
    term: "Tríceps",
    definition: "El músculo de la parte trasera del brazo superior. Representa el 60% del volumen del brazo y sirve para estirar el codo.",
    category: "Músculos"
  },
  {
    term: "Cuádriceps",
    definition: "El grupo de 4 músculos grandes en la parte delantera de tu muslo. Se encargan de estirar la rodilla.",
    category: "Músculos"
  },
  {
    term: "Isquiotibiales (Femorales)",
    definition: "Los músculos situados en la parte trasera del muslo. Se encargan de doblar la rodilla y llevar la pierna hacia atrás.",
    category: "Músculos"
  },
  {
    term: "Glúteos",
    definition: "El grupo muscular de las nalgas. Se compone de glúteo mayor, medio y menor. Son el motor del cuerpo para extender la cadera.",
    category: "Músculos"
  },
  {
    term: "Deltoides (Hombros)",
    definition: "Los músculos del hombro que envuelven la articulación. Tienen tres partes: frontal, lateral y posterior.",
    category: "Músculos"
  },
  {
    term: "Pectorales (Pecho)",
    definition: "Los músculos grandes del pecho. Ayudan a empujar objetos alejándolos del cuerpo o a juntar los brazos.",
    category: "Músculos"
  },
  {
    term: "Dorsal Ancho",
    definition: "El músculo más grande de la espalda, responsable de darle la forma de 'V'. Sirve para jalar cosas hacia el cuerpo.",
    category: "Músculos"
  },
  {
    term: "Trapecio",
    definition: "Músculo grande que va desde el cuello hasta la mitad de la espalda. Te ayuda a encoger los hombros.",
    category: "Músculos"
  },
  {
    term: "Core (Zona Media)",
    definition: "Conjunto de músculos que incluye el abdomen, lumbares, pelvis y caderas. Estabilizan el cuerpo y transfieren la fuerza.",
    category: "Músculos"
  },
  {
    term: "Abdominales",
    definition: "Los músculos de la pared frontal del abdomen. Su función principal es flexionar la columna (hacer abdominales) y estabilizar.",
    category: "Músculos"
  },
  {
    term: "Lumbares",
    definition: "Los músculos de la parte baja de la espalda. Sostienen la columna y ayudan a erguir el torso.",
    category: "Músculos"
  },
  {
    term: "Gemelos (Pantorrillas)",
    definition: "Los músculos de la parte trasera inferior de la pierna. Permiten ponerte de puntitas.",
    category: "Músculos"
  },
  {
    term: "Antebrazo",
    definition: "Los músculos entre el codo y la muñeca. Cruciales para la fuerza de agarre al sostener barras y mancuernas.",
    category: "Músculos"
  },
  {
    term: "Músculos Estabilizadores",
    definition: "Músculos secundarios que ayudan a mantener el equilibrio y la postura correcta mientras el músculo principal hace la fuerza.",
    category: "Músculos"
  },

  // ── NUTRICIÓN ────────────────────────────────────────────────────────────────
  {
    term: "Calorías (kcal)",
    definition: "La unidad de medida de la energía que contienen los alimentos y la que gasta nuestro cuerpo para vivir y moverse.",
    category: "Nutrición"
  },
  {
    term: "TDEE (Gasto Energético Diario Total)",
    definition: "La cantidad total de calorías que quemás en un día entero, sumando tus funciones vitales, digestión y actividad física.",
    category: "Nutrición"
  },
  {
    term: "BMR (Tasa Metabólica Basal)",
    definition: "Las calorías mínimas que tu cuerpo necesita para seguir vivo y funcionando en estado de reposo absoluto (respirar, latir, digerir).",
    category: "Nutrición"
  },
  {
    term: "Déficit Calórico",
    definition: "Comer menos calorías de las que tu cuerpo gasta en el día. Es el único estado en el que el cuerpo quema grasa acumulada para obtener energía.",
    category: "Nutrición"
  },
  {
    term: "Superávit Calórico",
    definition: "Comer más calorías de las que tu cuerpo gasta. Aporta la energía de sobra que se necesita para construir nuevo tejido muscular.",
    category: "Nutrición"
  },
  {
    term: "Macronutrientes (Macros)",
    definition: "Los tres nutrientes principales que aportan calorías y energía: Proteínas, Carbohidratos y Grasas.",
    category: "Nutrición"
  },
  {
    term: "Proteína",
    definition: "El ladrillo de los músculos. Nutriente fundamental para reparar las fibras musculares dañadas en el entrenamiento y hacerlas crecer.",
    category: "Nutrición",
    example: "Se encuentra en: pollo, carne, pescados, huevos, legumbres, tofu."
  },
  {
    term: "Carbohidratos",
    definition: "La principal fuente de energía rápida para el cuerpo y el cerebro. Llenan los depósitos de combustible muscular (glucógeno).",
    category: "Nutrición",
    example: "Se encuentran en: arroz, avena, papas, pastas, frutas y verduras."
  },
  {
    term: "Grasas Saludables",
    definition: "Nutriente vital para regular las hormonas (como la testosterona), absorber vitaminas y proteger los órganos.",
    category: "Nutrición",
    example: "Se encuentran en: palta, frutos secos, aceite de oliva, yema de huevo y pescados azules."
  },
  {
    term: "Volumen limpio (Lean Bulk)",
    definition: "Subir de peso consumiendo un superávit de calorías muy pequeño e inteligente, para ganar la mayor cantidad de músculo posible limitando la acumulación de grasa.",
    category: "Nutrición"
  },
  {
    term: "Volumen sucio (Dirty Bulk)",
    definition: "Consumir una cantidad exagerada de calorías sin importar el origen de los alimentos, buscando subir rápido de peso, lo cual suele resultar en mucha acumulación de grasa corporal.",
    category: "Nutrición"
  },
  {
    term: "Etapa de Corte (Definición)",
    definition: "Período donde se busca perder grasa corporal manteniendo la masa muscular lograda, a través de un déficit calórico y entrenamiento de fuerza.",
    category: "Nutrición"
  },
  {
    term: "Suplemento Alimenticio",
    definition: "Productos creados para complementar la alimentación, aportando nutrientes que cuesta alcanzar con comidas normales.",
    category: "Nutrición"
  },
  {
    term: "Proteína en Polvo (Whey Protein)",
    definition: "Suplemento derivado de la leche de vaca purificado para dar proteína de rápida absorción. Muy práctico para llegar a tu meta diaria.",
    category: "Nutrición"
  },
  {
    term: "Creatina",
    definition: "Suplemento natural ultra investigado que ayuda a las células musculares a producir más energía rápida, mejorando la fuerza y potencia.",
    category: "Nutrición"
  },
  {
    term: "Electrolitos",
    definition: "Minerales (como sodio y potasio) que se pierden en el sudor y son necesarios para evitar calambres y mantener la hidratación celular.",
    category: "Nutrición"
  },
  {
    term: "Pre-entrenamiento (Pre-workout)",
    definition: "Suplemento o bebida que se toma antes de entrenar para aumentar la energía y concentración. Suele contener cafeína.",
    category: "Nutrición"
  },
  {
    term: "Glucógeno Muscular",
    definition: "La forma en que el músculo almacena los carbohidratos. Es la gasolina directa que usás cuando levantás pesos pesados.",
    category: "Nutrición"
  },
  {
    term: "Micronutrientes",
    definition: "Vitaminas y minerales que el cuerpo necesita en pequeñas cantidades para funcionar correctamente pero no aportan calorías.",
    category: "Nutrición"
  },
  {
    term: "Índice Glucémico",
    definition: "Medida de la rapidez con la que un alimento con carbohidratos eleva los niveles de azúcar en sangre.",
    category: "Nutrición"
  },

  // ── EQUIPAMIENTO ─────────────────────────────────────────────────────────────
  {
    term: "Barra Olímpica",
    definition: "Barra de acero profesional que pesa exactamente 20 kg (o 15 kg la de mujer) y tiene extremos giratorios para colocar los discos.",
    category: "Equipamiento"
  },
  {
    term: "Mancuerna (Dumbbell)",
    definition: "Pesas individuales para usar con una sola mano. Permiten entrenar cada lado del cuerpo de manera independiente.",
    category: "Equipamiento"
  },
  {
    term: "Discos (Plates)",
    definition: "Pesos redondos de metal o goma con un agujero central para cargarlos en barras o máquinas de peso libre.",
    category: "Equipamiento"
  },
  {
    term: "Polea (Cable)",
    definition: "Máquina que usa cables, poleas y placas de peso. Da una tensión constante a lo largo de todo el movimiento.",
    category: "Equipamiento"
  },
  {
    term: "Multipower (Smith)",
    definition: "Estructura donde la barra está unida a rieles de acero verticales o semi-inclinados, guiando el movimiento de forma fija.",
    category: "Equipamiento",
    example: "Ideal para principiantes porque tiene ganchos de seguridad a lo largo de todo el recorrido para trabar la barra rápido."
  },
  {
    term: "Pesa Rusa (Kettlebell)",
    definition: "Una bola de hierro fundido con una manija arriba. Se usa para movimientos balísticos y dinámicos.",
    category: "Equipamiento"
  },
  {
    term: "Bandas Elásticas",
    definition: "Gomas de resistencia que crean tensión variable (aumenta a medida que la banda se estira más). Excelentes para calentar o entrenar en casa.",
    category: "Equipamiento"
  },
  {
    term: "Prensa de Piernas (Leg Press)",
    definition: "Máquina donde te sentás y empujás una plataforma cargada con los pies para trabajar muslos y glúteos de forma segura.",
    category: "Equipamiento"
  },
  {
    term: "Agarre Supino",
    definition: "Sostener la barra o mancuerna con las palmas de las manos mirando hacia arriba (o hacia vos).",
    category: "Equipamiento"
  },
  {
    term: "Agarre Prono",
    definition: "Sostener la barra con las palmas de las manos mirando hacia abajo (o hacia el frente).",
    category: "Equipamiento"
  },
  {
    term: "Agarre Neutro (Martillo)",
    definition: "Sostener las mancuernas con las palmas enfrentándose entre sí.",
    category: "Equipamiento"
  },
  {
    term: "Straps (Correas de agarre)",
    definition: "Cintas de tela que se amarran a tu muñeca y a la barra para evitar que la barra se resbale si se cansa tu agarre antes que el músculo principal.",
    category: "Equipamiento"
  },
  {
    term: "Cinturón Lumbar",
    definition: "Cinturón de cuero rígido que se aprieta en el abdomen para dar soporte a la espalda baja al levantar cargas muy pesadas.",
    category: "Equipamiento"
  },
  {
    term: "Magnesio",
    definition: "Polvo blanco que se frota en las manos para secar el sudor y mejorar el agarre con el metal.",
    category: "Equipamiento"
  },
  {
    term: "Pec Deck (Contractora de pecho)",
    definition: "Máquina de poleas diseñada específicamente para aislar y apretar los pectorales imitando un abrazo.",
    category: "Equipamiento"
  },
  {
    term: "Banco Plano / Inclinado / Declinado",
    definition: "Bancos acolchados ajustables que sirven de apoyo para realizar ejercicios de press, remo o abdominales.",
    category: "Equipamiento"
  },
  {
    term: "Fat Gripz",
    definition: "Accesorios de goma que ensanchan el agarre de barras y mancuernas para entrenar la fuerza de los antebrazos al mismo tiempo.",
    category: "Equipamiento"
  },
  {
    term: "Máquina de Extensión de Piernas",
    definition: "Sentado en una máquina, empujás un rodillo acolchado hacia arriba con los tobillos para aislar los cuádriceps.",
    category: "Equipamiento"
  },
  {
    term: "Camilla de Femorales (Leg Curl)",
    definition: "Acostado boca abajo o sentado, jalas un rodillo acolchado hacia tus glúteos para aislar la parte trasera del muslo.",
    category: "Equipamiento"
  },
  {
    term: "Jaula de Sentadillas (Squat Rack)",
    definition: "Estructura metálica grande con soportes ajustables para apoyar la barra a la altura del hombro de forma segura para hacer sentadillas libres.",
    category: "Equipamiento"
  },
  {
    term: "Foam Roller (Rodillo de espuma)",
    definition: "Rodillo rígido de espuma que se usa para masajear los músculos mediante presión corporal, liberando tensión muscular tras el entrenamiento.",
    category: "Equipamiento"
  }
];
