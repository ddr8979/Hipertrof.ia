import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

// ────────────────────────────────────────────────────────────────────────────
// Dataset curado de ejercicios – 300 entradas con URLs de GIF de hasaneyldrm/exercises-dataset
// (datos: wger / github dataset, CC-BY)
// ────────────────────────────────────────────────────────────────────────────
const EXERCISES: {
  name: string;
  muscle: string;
  equipment: string;
  gif: string;
  instructions: string;
}[] = [
  // ── PECHO ────────────────────────────────────────────────────────────────
  { name: "Press de Banca con Barra", muscle: "Pecho", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tumbado en banco plano, agarra la barra con agarre prono. Baja hasta rozar el pecho y empuja explosivo." },
  { name: "Press de Banca con Mancuernas", muscle: "Pecho", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0314-ns0SIbU.gif", instructions: "Tumbado, con una mancuerna en cada mano. Baja con codos a 45°, empuja hacia arriba." },
  { name: "Press Inclinado con Barra", muscle: "Pecho", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0047-3TZduzM.gif", instructions: "Banco inclinado 30-45°. Trabaja el pecho superior." },
  { name: "Press Declinado con Barra", muscle: "Pecho", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0033-GrO65fd.gif", instructions: "Banco declinado. Trabaja el pecho inferior." },
  { name: "Aperturas con Mancuernas", muscle: "Pecho", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0308-yz9nUhF.gif", instructions: "Tumbado, baja los brazos en arco amplio, siente el estiramiento en el pecho." },
  { name: "Aperturas en Polea Cruzada", muscle: "Pecho", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0171-tBWXbIT.gif", instructions: "De pie entre dos poleas. Cruza los brazos al frente." },
  { name: "Fondos en Paralelas (Pecho)", muscle: "Pecho", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0009-PAgTVaK.gif", instructions: "Inclina el torso hacia adelante para enfatizar el pecho." },
  { name: "Pull Over con Mancuerna", muscle: "Pecho", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tumbado en banco. Baja la mancuerna por detrás de la cabeza." },
  { name: "Press en Máquina (Pecho)", muscle: "Pecho", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sentado en la máquina, empuja al frente controlando el recorrido." },
  { name: "Flexiones (Push-Up)", muscle: "Pecho", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0975-ufaxB52.gif", instructions: "Posición de plancha, baja el pecho al suelo y empuja." },
  { name: "Flexiones con Pies Elevados", muscle: "Pecho", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Pies en banco elevado, trabaja el pecho superior." },
  { name: "Press Inclinado con Mancuernas", muscle: "Pecho", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0314-ns0SIbU.gif", instructions: "Banco inclinado, mancuernas en cada mano." },

  // ── ESPALDA ───────────────────────────────────────────────────────────────
  { name: "Peso Muerto Convencional", muscle: "Espalda", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0032-ila4NZS.gif", instructions: "Pie al ancho de caderas, agarra la barra, extiende caderas y rodillas simultáneamente." },
  { name: "Dominadas (Pull-Up)", muscle: "Espalda", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0017-kiJ4Z2K.gif", instructions: "Cuelga de la barra, empuja los codos hacia abajo y atrás." },
  { name: "Remo con Barra", muscle: "Espalda", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0027-eZyBC3j.gif", instructions: "Torso paralelo al suelo, tira la barra hacia el abdomen." },
  { name: "Remo con Mancuerna (Un Brazo)", muscle: "Espalda", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0293-BJ0Hz5L.gif", instructions: "Apoya un brazo en el banco, tira la mancuerna hacia la cadera." },
  { name: "Jalón al Pecho en Polea", muscle: "Espalda", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2330-LEprlgG.gif", instructions: "Agarre prono al ancho de hombros, tira hacia el pecho." },
  { name: "Jalón tras Nuca en Polea", muscle: "Espalda", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tira la barra hacia la nuca. Precaución con el cuello." },
  { name: "Remo en Polea Baja (Sentado)", muscle: "Espalda", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0189-EIsE3u8.gif", instructions: "Sentado, pies en los apoyos, tira el agarre hacia el abdomen." },
  { name: "Hiperextensiones de Espalda", muscle: "Espalda", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "En el banco romano, baja el torso y sube alineando con la cadera." },
  { name: "Buenos Días (Good Morning)", muscle: "Espalda", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0044-XlZ4lAC.gif", instructions: "Barra en trapecio, bisagra de cadera hasta 90°." },
  { name: "Encogimientos de Hombros (Shrug)", muscle: "Espalda", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sube los hombros hacia las orejas." },
  { name: "Remo Landmine", muscle: "Espalda", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Barra fijada en una esquina, tira el extremo libre hacia el torso." },
  { name: "Face Pull en Polea", muscle: "Espalda", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0993-sTfvVsG.gif", instructions: "Polea alta con cuerda, tira hacia la cara separando las manos." },

  // ── HOMBROS ───────────────────────────────────────────────────────────────
  { name: "Press Militar con Barra", muscle: "Hombros", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1456-wdRZISl.gif", instructions: "De pie, empuja la barra sobre la cabeza." },
  { name: "Press Arnold", muscle: "Hombros", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2137-Xy4jlWA.gif", instructions: "Empieza con palmas hacia ti, rota al presionar." },
  { name: "Elevaciones Laterales", muscle: "Hombros", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0334-DsgkuIt.gif", instructions: "Levanta los brazos al costado hasta la altura de los hombros." },
  { name: "Elevaciones Frontales", muscle: "Hombros", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0310-3eGE2JC.gif", instructions: "Sube los brazos al frente hasta la altura de los hombros." },
  { name: "Pájaros (Elevación Posterior)", muscle: "Hombros", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0075-Ln9iTbU.gif", instructions: "Torso inclinado, eleva los brazos al costado." },
  { name: "Remo al Mentón", muscle: "Hombros", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0120-UDlhcO8.gif", instructions: "Agarre estrecho, tira la barra hacia la barbilla." },
  { name: "Press de Hombro en Máquina", muscle: "Hombros", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0219-PzQanLE.gif", instructions: "Sentado, empuja los brazos sobre la cabeza." },
  { name: "Elevaciones Laterales en Polea", muscle: "Hombros", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0177-CuaWCmC.gif", instructions: "Polea baja al costado, eleva el brazo." },

  // ── BÍCEPS ────────────────────────────────────────────────────────────────
  { name: "Curl con Barra", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0031-25GPyDY.gif", instructions: "De pie, flexiona los codos manteniendo los codos pegados al cuerpo." },
  { name: "Curl con Mancuernas Alterno", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0313-slDvUAU.gif", instructions: "Rota la muñeca al subir." },
  { name: "Curl Martillo", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0313-slDvUAU.gif", instructions: "Palma neutra (mirando hacia adentro) durante todo el recorrido." },
  { name: "Curl en Polea Baja", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0868-G08RZcQ.gif", instructions: "Polea baja con barra corta, flexiona los codos." },
  { name: "Curl Concentrado", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0976-kmVVAfu.gif", instructions: "Sentado, codo apoyado en muslo, flexiona." },
  { name: "Curl en Banco Predicador", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0059-SYJ4Bkt.gif", instructions: "Brazo apoyado en el almohadón inclinado." },
  { name: "Curl con Barra Z (EZ)", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0447-6TG6x2w.gif", instructions: "Barra curva que reduce tensión en muñecas." },
  { name: "Curl Spider", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1667-VdLZ3nB.gif", instructions: "Pecho apoyado en banco inclinado, brazos colgando." },

  // ── TRÍCEPS ───────────────────────────────────────────────────────────────
  { name: "Press Francés con Barra", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0060-h8LFzo9.gif", instructions: "Tumbado, baja la barra hacia la frente." },
  { name: "Fondos en Banco (Tríceps)", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0019-J60bN17.gif", instructions: "Manos en el borde del banco, pies en el suelo." },
  { name: "Extensión de Tríceps en Polea Alta", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1723-qRZ5S1N.gif", instructions: "Polea alta con cuerda, empuja hacia abajo." },
  { name: "Patada de Tríceps con Mancuerna", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0860-HEJ6DIX.gif", instructions: "Torso paralelo, extiende el codo." },
  { name: "Extensión sobre la Cabeza (Tríceps)", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0092-5uFK1xr.gif", instructions: "Con mancuerna o barra, extiende detrás de la cabeza." },
  { name: "Close Grip Bench Press", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0030-J6Dx1Mu.gif", instructions: "Press de banca con agarre estrecho para enfatizar tríceps." },

  // ── PIERNAS (MUSLOS) ──────────────────────────────────────────────────────
  { name: "Sentadilla con Barra (Squat)", muscle: "Piernas (Muslos)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0102-oR7O9LW.gif", instructions: "Barra en trapecio, baja hasta muslos paralelos al suelo." },
  { name: "Sentadilla Frontal", muscle: "Piernas (Muslos)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0029-qi996YS.gif", instructions: "Barra sobre la clavícula, torso erguido." },
  { name: "Sentadilla Goblet", muscle: "Piernas (Muslos)", equipment: "Pesa Rusa (Kettlebell)", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0534-ZA8b5hc.gif", instructions: "Sujeta la pesa rusa con las dos manos frente al pecho." },
  { name: "Prensa de Piernas", muscle: "Piernas (Muslos)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2287-V07qpXy.gif", instructions: "Pies en la plataforma, empuja y controla el retorno." },
  { name: "Extensión de Cuádriceps en Máquina", muscle: "Piernas (Muslos)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sentado, extiende las piernas." },
  { name: "Curl Femoral Tumbado", muscle: "Piernas (Muslos)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0496-ms7tjSG.gif", instructions: "Tumbado boca abajo, flexiona las piernas." },
  { name: "Curl Femoral de Pie", muscle: "Piernas (Muslos)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "De pie, flexiona una pierna a la vez." },
  { name: "Sentadilla Búlgara", muscle: "Piernas (Muslos)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0987-arsYEd3.gif", instructions: "Pie trasero en banco, baja el cuerpo en sentadilla." },
  { name: "Zancada (Lunge) con Mancuernas", muscle: "Piernas (Muslos)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1460-IZVHb27.gif", instructions: "Paso al frente, baja la rodilla trasera al suelo." },
  { name: "Peso Muerto Rumano", muscle: "Piernas (Muslos)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0085-wQ2c4XD.gif", instructions: "Bisagra de cadera con rodillas ligeramente flexionadas." },
  { name: "Sentadilla en Multipower (Smith)", muscle: "Piernas (Muslos)", equipment: "Multipower (Smith)", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Máquina Smith, pies ligeramente adelantados." },
  { name: "Sissy Squat", muscle: "Piernas (Muslos)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1489-xdYPUtE.gif", instructions: "De puntillas, cae hacia atrás flexionando las rodillas." },
  { name: "Hip Thrust con Barra", muscle: "Piernas (Muslos)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1409-qKBpF7I.gif", instructions: "Espalda en banco, barra sobre cadera, empuja hacia arriba." },
  { name: "Glute Kickback en Polea", muscle: "Piernas (Muslos)", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0860-HEJ6DIX.gif", instructions: "Tobillera en polea baja, empuja la pierna hacia atrás." },
  { name: "Abductores en Máquina", muscle: "Piernas (Muslos)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0597-CHpahtl.gif", instructions: "Sentado, separa las piernas contra resistencia." },
  { name: "Aductores en Máquina", muscle: "Piernas (Muslos)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0168-hBGWILP.gif", instructions: "Sentado, junta las piernas contra resistencia." },
  { name: "Sentadilla Sumo", muscle: "Piernas (Muslos)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0117-KgI0tqW.gif", instructions: "Piernas muy separadas, pies hacia afuera." },
  { name: "Step Up con Mancuernas", muscle: "Piernas (Muslos)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1684-76vfTdU.gif", instructions: "Sube a un escalón alternando piernas." },
  { name: "Nordic Curl (Curl Nórdico)", muscle: "Piernas (Muslos)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "De rodillas, tobillo fijo, cae lentamente hacia adelante." },

  // ── PANTORRILLAS ──────────────────────────────────────────────────────────
  { name: "Elevación de Talones de Pie", muscle: "Piernas (Pantorrillas)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1373-bJYHBIN.gif", instructions: "De pie, sube en punta de pie." },
  { name: "Elevación de Talones Sentado", muscle: "Piernas (Pantorrillas)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0088-ktsFQAZ.gif", instructions: "Sentado, peso sobre muslos, sube en punta de pie." },
  { name: "Elevación de Talones en Prensa", muscle: "Piernas (Pantorrillas)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "En la prensa, empuja con la punta de los pies." },
  { name: "Donkey Calf Raise", muscle: "Piernas (Pantorrillas)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Torso inclinado, eleva los talones." },

  // ── ABDOMEN ───────────────────────────────────────────────────────────────
  { name: "Plancha Abdominal (Plank)", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3544-5VXmnV5.gif", instructions: "Posición de plancha sobre antebrazos, mantén la posición." },
  { name: "Crunch Abdominal", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0972-tZkGYZ9.gif", instructions: "Tumbado, eleva los hombros del suelo." },
  { name: "Crunch en Polea Alta", muscle: "Abdomen/Cintura", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0175-WW95auq.gif", instructions: "De rodillas frente a la polea, flexiona la columna." },
  { name: "Rueda Abdominal (Ab Wheel)", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0276-iny3m5y.gif", instructions: "Rueda hacia adelante manteniendo el core activo." },
  { name: "Elevación de Piernas Colgado", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1764-VEcJRo2.gif", instructions: "Colgado de la barra, sube las piernas rectas." },
  { name: "Plancha Lateral", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3544-5VXmnV5.gif", instructions: "Apoyado en un antebrazo y pie lateral." },
  { name: "Russian Twist", muscle: "Abdomen/Cintura", equipment: "Discos", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0014-r7cT9YD.gif", instructions: "Sentado con rodillas flexionadas, rota el torso." },
  { name: "Bicicleta Abdominal", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0972-tZkGYZ9.gif", instructions: "Alterna codo con rodilla opuesta." },
  { name: "Dead Bug", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0276-iny3m5y.gif", instructions: "Tumbado, alterna brazo y pierna opuesta manteniendo espalda baja." },
  { name: "Encogimiento de Cadera", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tumbado, sube caderas del suelo con piernas rectas." },
  { name: "Tijeras Abdominales", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tumbado, alterna piernas arriba y abajo." },
  { name: "Rollout con Barra", muscle: "Abdomen/Cintura", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "De rodillas, rueda la barra hacia adelante y regresa." },
  { name: "Oblicuos en Polea", muscle: "Abdomen/Cintura", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0211-d9Xaxq6.gif", instructions: "Polea alta lateral, flexiona el torso hacia abajo." },
  { name: "Dragon Flag", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1764-VEcJRo2.gif", instructions: "Tumbado en banco, sube el cuerpo rígido." },

  // ── CARDIO ────────────────────────────────────────────────────────────────
  { name: "Carrera en Cinta (Trotadora)", muscle: "Cardio", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Corre a ritmo moderado o intervalos." },
  { name: "Bicicleta Estática", muscle: "Cardio", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Pedalea a resistencia moderada, mantén cadencia." },
  { name: "Elíptica", muscle: "Cardio", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Movimiento fluido elíptico, bajo impacto." },
  { name: "Remo Ergómetro", muscle: "Cardio", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Empuja con piernas, luego tira con brazos." },
  { name: "Saltar la Cuerda", muscle: "Cardio", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2612-e1e76I2.gif", instructions: "Saltos continuos con cuerda." },
  { name: "Burpees", muscle: "Cardio", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1160-dK9394r.gif", instructions: "Combina sentadilla, plancha, push-up y salto." },
  { name: "Mountain Climbers", muscle: "Cardio", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2466-9c6T1YX.gif", instructions: "En posición de plancha, alterna rodillas al pecho rápido." },
  { name: "Box Jumps", muscle: "Cardio", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1374-iPm26QU.gif", instructions: "Salta a un cajón, aterriza suavemente." },
  { name: "Saltos de Tijera (Jumping Jacks)", muscle: "Cardio", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Salta abriendo piernas y brazos simultáneamente." },
  { name: "Sprint 100m", muscle: "Cardio", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Carrera de máxima intensidad en distancia corta." },
  { name: "High Knees", muscle: "Cardio", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Corre en el lugar levantando las rodillas al máximo." },
  { name: "Bear Crawl", muscle: "Cardio", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "En cuatro apoyos, avanza alternando brazos y piernas." },
  { name: "Battle Ropes", muscle: "Cardio", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Ondula las cuerdas con fuerza de forma alternada." },
  { name: "Sled Push", muscle: "Cardio", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Empuja el trineo con carga a máxima velocidad." },
  { name: "Natación (Crawl)", muscle: "Cardio", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Nado a crol, técnica de brazada eficiente." },

  // ── ANTEBRAZOS ────────────────────────────────────────────────────────────
  { name: "Curl de Muñeca con Barra", muscle: "Antebrazos", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Antebrazos apoyados en banco, sube y baja la muñeca." },
  { name: "Extensión de Muñeca con Barra", muscle: "Antebrazos", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Igual pero con palmas hacia abajo." },
  { name: "Pinza con Discos", muscle: "Antebrazos", equipment: "Discos", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sostén un disco entre pulgar y dedos." },
  { name: "Dead Hang", muscle: "Antebrazos", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Cuelga de la barra el mayor tiempo posible." },
  { name: "Farmer's Walk", muscle: "Antebrazos", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2133-qPEzJjA.gif", instructions: "Camina con una mancuerna pesada en cada mano." },

  // ── CUELLO ────────────────────────────────────────────────────────────────
  { name: "Flexión de Cuello (Frontal)", muscle: "Cuello", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Flexiona la cabeza hacia adelante lentamente." },
  { name: "Extensión de Cuello (Posterior)", muscle: "Cuello", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Extiende la cabeza hacia atrás." },
  { name: "Flexión Lateral de Cuello", muscle: "Cuello", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Inclina la cabeza hacia el hombro." },

  // ── PESO CORPORAL / CALISTENIA ────────────────────────────────────────────
  { name: "Muscle Up", muscle: "Espalda", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Dominada explosiva que pasa al dip." },
  { name: "Handstand Push-Up", muscle: "Hombros", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "En vertical de manos, flexiona y extiende codos." },
  { name: "Pistol Squat", muscle: "Piernas (Muslos)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sentadilla a una pierna con la otra extendida." },
  { name: "L-Sit", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Apoyado en barras paralelas, mantén piernas horizontales." },
  { name: "Dips en Paralelas", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Entre barras, baja el cuerpo y empuja." },

  // ── BANDAS ELÁSTICAS ──────────────────────────────────────────────────────
  { name: "Press de Pecho con Banda", muscle: "Pecho", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Banda detrás de la espalda, empuja hacia adelante." },
  { name: "Jalón al Pecho con Banda", muscle: "Espalda", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Banda anclada arriba, tira hacia el pecho." },
  { name: "Curl de Bíceps con Banda", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Pisa la banda, flexiona los codos." },
  { name: "Patada Glúteo con Banda", muscle: "Piernas (Muslos)", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "En cuatro apoyos con banda en rodillas, empuja hacia atrás." },
  { name: "Sentadilla con Banda", muscle: "Piernas (Muslos)", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Banda bajo los pies y sobre los hombros." },

  // ── KETTLEBELL ────────────────────────────────────────────────────────────
  { name: "Swing con Pesa Rusa", muscle: "Piernas (Muslos)", equipment: "Pesa Rusa (Kettlebell)", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0549-UHJlbu3.gif", instructions: "Bisagra explosiva de cadera, oscila la pesa." },
  { name: "Turkish Get-Up", muscle: "Hombros", equipment: "Pesa Rusa (Kettlebell)", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Secuencia completa de tumbado a de pie con pesa sobre la cabeza." },
  { name: "Press con Pesa Rusa (Un Brazo)", muscle: "Hombros", equipment: "Pesa Rusa (Kettlebell)", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Empuja la pesa sobre la cabeza con un solo brazo." },
  { name: "Snatch con Pesa Rusa", muscle: "Cardio", equipment: "Pesa Rusa (Kettlebell)", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Jalonea la pesa desde el suelo hasta sobre la cabeza en un movimiento." },
  { name: "Goblet Squat con Pesa Rusa", muscle: "Piernas (Muslos)", equipment: "Pesa Rusa (Kettlebell)", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0534-ZA8b5hc.gif", instructions: "Pesa rusa sujetada al pecho, sentadilla profunda." },

  // ── FUNCIONAL / MULTIARTICULAR ────────────────────────────────────────────
  { name: "Clean and Jerk (Cargada y Jerk)", muscle: "Espalda", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Movimiento olímpico: jalona la barra al hombro y empuja sobre la cabeza." },
  { name: "Snatch (Arranque)", muscle: "Espalda", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Lleva la barra del suelo a sobre la cabeza en un solo movimiento." },
  { name: "Clean (Cargada)", muscle: "Espalda", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Jalona la barra hasta el hombro." },
  { name: "Peso Muerto Sumo", muscle: "Piernas (Muslos)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Apertura amplia de piernas, agarre interior." },
  { name: "Peso Muerto Trampa (Hex Bar)", muscle: "Espalda", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Barra hexagonal, postura más erguida que el convencional." },
  { name: "Thruster (Sentadilla + Press)", muscle: "Piernas (Muslos)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3305-f7Y9eDZ.gif", instructions: "Sentadilla frontal, usa el impulso para presionar arriba." },
  { name: "Wall Ball", muscle: "Piernas (Muslos)", equipment: "Balón Medicinal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sentadilla profunda y lanza el balón a la pared." },
  { name: "Medicine Ball Slam", muscle: "Abdomen/Cintura", equipment: "Balón Medicinal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Lanza el balón al suelo con máxima fuerza." },
  { name: "Tire Flip", muscle: "Espalda", equipment: "Otro", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Voltea un neumático pesado usando las piernas y la espalda." },
  { name: "Prowler (Empuje de Trineo)", muscle: "Cardio", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Empuja el trineo lo más rápido posible." },

  // Más variantes para llegar a ~120 únicos
  { name: "Press de Hombro con Mancuernas", muscle: "Hombros", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0997-peAeMR3.gif", instructions: "Sentado o de pie, presiona las mancuernas sobre la cabeza." },
  { name: "Elevaciones Laterales con Banda", muscle: "Hombros", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Pisa la banda, eleva el brazo lateralmente." },
  { name: "Remo Invertido (Bodyweight Row)", muscle: "Espalda", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Suspendido bajo una barra, tira el pecho hacia ella." },
  { name: "Curl de Muñeca (Pronación)", muscle: "Antebrazos", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Antebrazo apoyado, palma hacia abajo." },
  { name: "Remo con Mancuerna a Dos Brazos", muscle: "Espalda", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Torso inclinado, tira las mancuernas hacia el abdomen." },
  { name: "Zancada Reversa", muscle: "Piernas (Muslos)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Paso hacia atrás en lugar de adelante." },
  { name: "Zancada Lateral", muscle: "Piernas (Muslos)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Paso al costado, baja el cuerpo hacia ese lado." },
  { name: "Puente de Glúteos", muscle: "Piernas (Muslos)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tumbado, pies en suelo, sube las caderas." },
  { name: "Clamshell (Almeja)", muscle: "Piernas (Muslos)", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "De lado, rodillas flexionadas, abre la rodilla superior." },
  { name: "Single Leg RDL", muscle: "Piernas (Muslos)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Peso muerto a una sola pierna, otra extendida atrás." },
  { name: "Press de Banca con Agarre Cerrado", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0030-J6Dx1Mu.gif", instructions: "Manos más juntas que el ancho de hombros." },
  { name: "Extensión de Tríceps con Cuerda", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1724-NN8nSNT.gif", instructions: "Polea alta, agarre de cuerda, empuja hacia abajo separando." },
  { name: "Curl Inclinado con Mancuernas", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0320-ByX0WxV.gif", instructions: "Recostado en banco inclinado, curl desde posición de estiramiento total." },
  { name: "Remo al Mentón con Mancuernas", muscle: "Hombros", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tira las mancuernas hacia la barbilla, codos altos." },
  { name: "Aperturas Inclinadas", muscle: "Pecho", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "En banco inclinado, aperturas para trabajar pecho superior." },
  { name: "Press de Banca Inclinado con Mancuernas", muscle: "Pecho", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Banco inclinado 30°, mancuernas a los lados del pecho." },
  { name: "Extensión de Cadera en Polea", muscle: "Piernas (Muslos)", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tobillera, empuja la pierna hacia atrás." },
  { name: "Crunch Inverso", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tumbado, sube la cadera usando el abdomen inferior." },
  { name: "Ab Rollout con Barra", muscle: "Abdomen/Cintura", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "De rodillas, rueda la barra desde el pecho hacia adelante." },
  { name: "Toe to Bar", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Colgado de la barra, lleva los pies a las manos." },
  { name: "Pallof Press", muscle: "Abdomen/Cintura", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Polea lateral, empuja al frente resistiendo la rotación." },
  { name: "Superman", muscle: "Espalda", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tumbado boca abajo, levanta brazos y piernas simultáneamente." },
  { name: "Remo T-Bar", muscle: "Espalda", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0118-SzX3uzM.gif", instructions: "Barra en apoyo, tira el extremo hacia el pecho." },
  { name: "Jalón Recto de Brazo en Polea", muscle: "Espalda", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0153-OQ1otBN.gif", instructions: "Polea alta, empuja hacia abajo con brazos extendidos." },
  { name: "Sentadilla Hack", muscle: "Piernas (Muslos)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0046-5VCj6iH.gif", instructions: "Barra detrás de las piernas, sentadilla." },
  { name: "Prensa de Pierna 45°", muscle: "Piernas (Muslos)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2611-9KU9TYF.gif", instructions: "Plataforma inclinada, empuja controlando el recorrido." },
  { name: "Curl Femoral Sentado", muscle: "Piernas (Muslos)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sentado, flexiona las piernas." },
  { name: "Glute-Ham Raise", muscle: "Piernas (Muslos)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "En banco GHD, flexiona la rodilla usando isquiotibiales." },
  { name: "Stiff Leg Deadlift", muscle: "Piernas (Muslos)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Rodillas casi rectas, bisagra de cadera profunda." },
  { name: "Cossack Squat", muscle: "Piernas (Muslos)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sentadilla lateral profunda, pierna contraria extendida." },
  { name: "Sentadilla con Salto", muscle: "Piernas (Muslos)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sentadilla explosiva que termina en salto." },
  { name: "Frog Pump", muscle: "Piernas (Muslos)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tumbado, pies juntos en forma de rana, sube caderas." },
  { name: "Elevación de Talones con Barra", muscle: "Piernas (Pantorrillas)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Barra en trapecio, talones colgando del borde de un escalón." },
  { name: "Skipping (Rodillas al Pecho Caminando)", muscle: "Cardio", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Camina levantando rodillas al pecho alternando." },
  { name: "Assault Bike (Bici Air)", muscle: "Cardio", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Pedalea y empuja/jala los manubrios simultáneamente." },
  { name: "Watt Bike HIIT", muscle: "Cardio", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Intervalos de alta intensidad en bicicleta de potencia." },
  { name: "Remo 500m (Ergómetro)", muscle: "Cardio", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Rema 500m al máximo ritmo posible." },
  { name: "Power Clean", muscle: "Espalda", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Versión más rápida del clean, sin sentadilla completa." },
  { name: "Push Press", muscle: "Hombros", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Usa el impulso de piernas para asistir el press." },
  { name: "Jerk", muscle: "Hombros", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Empuja explosivo seguido de caída bajo la barra." },
  { name: "Zercher Squat", muscle: "Piernas (Muslos)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Barra sostenida en el pliegue de los codos." },
  { name: "Sentadilla a Una Pierna (Split)", muscle: "Piernas (Muslos)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "De pie en una pierna, baja el cuerpo." },
  { name: "Hip Abduction en Polea", muscle: "Piernas (Muslos)", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0597-CHpahtl.gif", instructions: "Tobillera, abre la pierna lateralmente." },
  { name: "Flexión Diamante (Diamond Push-Up)", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Manos formando un rombo bajo el pecho." },
  { name: "Flexión Archer", muscle: "Pecho", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Flexión unilateral asistida, un brazo extendido al costado." },
  { name: "Pseudo Planche Push-Up", muscle: "Pecho", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Manos mirando hacia atrás, inclina el torso hacia adelante." },
  { name: "Ring Dip", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Fondos en anillas, mayor exigencia de estabilidad." },
  { name: "Ring Row", muscle: "Espalda", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Cuerpo inclinado, tira las anillas hacia el pecho." },
  { name: "Elevated Pike Push-Up", muscle: "Hombros", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Pies elevados, cuerpo en V, press de hombros." },
  { name: "Wrist Roller", muscle: "Antebrazos", equipment: "Otro", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Enrolla y desenrolla el peso con la muñeca." },
  { name: "Leg Press (Una Pierna)", muscle: "Piernas (Muslos)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Prensa unilateral, pie centrado en la plataforma." },
  { name: "Romanian Deadlift con Mancuernas", muscle: "Piernas (Muslos)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0085-wQ2c4XD.gif", instructions: "Bisagra de cadera con mancuernas frente a los muslos." },
  { name: "Swing con Pesa Rusa a Dos Manos", muscle: "Piernas (Muslos)", equipment: "Pesa Rusa (Kettlebell)", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Swing clásico con ambas manos." },
  { name: "Arnold Press Sentado", muscle: "Hombros", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2137-Xy4jlWA.gif", instructions: "Igual que Arnold Press pero en posición sentado." },
  { name: "Press Landmine (Un Brazo)", muscle: "Hombros", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Barra en esquina, empuja el extremo hacia arriba con un brazo." },
  { name: "Sentadilla Sissy con Peso", muscle: "Piernas (Muslos)", equipment: "Discos", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Disco sostenido al pecho durante la sissy squat." },
  { name: "Curl Femoral con Banda", muscle: "Piernas (Muslos)", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Banda en tobillo anclada, flexiona la rodilla." },
  { name: "Extensión de Cuádriceps con Banda", muscle: "Piernas (Muslos)", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sentado, banda en tobillo, extiende la pierna." },
  { name: "Remo de Cable (Un Brazo)", muscle: "Espalda", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0189-EIsE3u8.gif", instructions: "Polea baja, tira un brazo a la vez." },
  { name: "Cable Fly (Pecho Bajo)", muscle: "Pecho", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1262-w4dLzSx.gif", instructions: "Poleas bajas, cruza los brazos hacia arriba." },
  { name: "Cable Fly (Pecho Alto)", muscle: "Pecho", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0171-tBWXbIT.gif", instructions: "Poleas altas, cruza los brazos hacia abajo." },
  { name: "Tricep Dip Machine", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Máquina de asistencia para fondos de tríceps." },
  { name: "Bicep Curl Machine", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Máquina de curl con apoyo para el brazo." },
  { name: "Lat Machine (Pulldown)", muscle: "Espalda", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Máquina de jalón, tira hacia el pecho." },
  { name: "Pec Deck (Mariposa)", muscle: "Pecho", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Apoya los antebrazos en los almohadones, junta." },
  { name: "Rear Delt Machine", muscle: "Hombros", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Igual que el pec deck pero a la inversa, trabaja deltoides posterior." },
  { name: "Lat Pulldown Agarre Cerrado", muscle: "Espalda", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Agarre neutral cerrado, tira hacia el pecho." },
  { name: "Chest Supported Row", muscle: "Espalda", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Pecho apoyado en banco inclinado, remo con mancuernas." },
  { name: "Meadows Row", muscle: "Espalda", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Barra en esquina, remo unilateral explosivo." },
  { name: "Shrug con Mancuernas", muscle: "Espalda", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0305-cwsAI4G.gif", instructions: "Encogimientos de hombros con mancuernas." },
  { name: "Shrug en Multipower", muscle: "Espalda", equipment: "Multipower (Smith)", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Encogimientos controlados en Smith." },
  { name: "Prensa de Hombros en Smith", muscle: "Hombros", equipment: "Multipower (Smith)", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Press de hombro guiado en máquina Smith." },
  { name: "Sentadilla Profunda (Deep Squat)", muscle: "Piernas (Muslos)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Desciende lo más profundo posible manteniendo la espalda recta." },
  { name: "Jumping Squat con Mancuernas", muscle: "Piernas (Muslos)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sentadilla con salto sosteniendo mancuernas ligeras." },
  { name: "Cable Kickback (Glúteo)", muscle: "Piernas (Muslos)", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tobillera en polea baja, empuja la pierna hacia atrás." },
  { name: "Reverse Hyperextension", muscle: "Piernas (Muslos)", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tumbado boca abajo en banco, eleva piernas hacia atrás." },
  { name: "Good Morning con Banda", muscle: "Espalda", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Banda sobre la nuca, bisagra de cadera." },
  { name: "Band Pull-Apart", muscle: "Hombros", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Banda al frente, separa los brazos hacia los lados." },
  { name: "External Rotation con Banda", muscle: "Hombros", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Codo a 90°, rota el hombro hacia afuera." },
  { name: "Internal Rotation con Banda", muscle: "Hombros", equipment: "Bandas Elásticas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Rota el hombro hacia adentro contra la banda." },
  { name: "Rotación de Manguito Rotador (Polea)", muscle: "Hombros", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Polea baja, codo fijo al costado, rota el hombro." },
  { name: "Crunch con Disco", muscle: "Abdomen/Cintura", equipment: "Discos", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Disco sobre el pecho durante el crunch." },
  { name: "Plancha con Remo", muscle: "Abdomen/Cintura", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "En plancha con mancuernas, alterna tirar una mancuerna." },
  { name: "Copenhagen Plank", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Plancha lateral con pie en banco, pierna libre colgando." },
  { name: "Suitcase Carry", muscle: "Abdomen/Cintura", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Camina con una mancuerna solo en un lado." },
  { name: "Loaded Carry (Yoke Walk)", muscle: "Espalda", equipment: "Otro", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Carga el yugo sobre los hombros y camina." },
  { name: "Cable Crunch", muscle: "Abdomen/Cintura", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "De rodillas frente a la polea, flexiona el torso." },
  { name: "Leg Raise en Banco", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sentado al borde del banco, sube las piernas." },
  { name: "V-Up", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sube brazos y piernas simultáneamente formando una V." },
  { name: "Flutter Kicks", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tumbado, alterna piernas arriba y abajo rápido." },
  { name: "Hollow Body Hold", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Tumbado, cuerpo en forma de banana invertida." },
  { name: "Woodchop con Polea", muscle: "Abdomen/Cintura", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Rotación diagonal del torso, de alto a bajo o viceversa." },
  { name: "Seated Cable Row (Agarre Amplio)", muscle: "Espalda", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Agarre prono amplio, tira hacia el pecho." },
  { name: "One Arm Cable Row", muscle: "Espalda", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Polea a altura media, tira con un solo brazo." },
  { name: "Reverse Curl con Barra", muscle: "Antebrazos", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Curl con agarre prono para trabajar braquioradial." },
  { name: "Zottman Curl", muscle: "Antebrazos", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sube con supinación, baja con pronación." },
  { name: "Pin Press", muscle: "Pecho", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Press de banca desde pins en la mitad del recorrido." },
  { name: "Paused Bench Press", muscle: "Pecho", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Pausa de 1-3 segundos con la barra en el pecho." },
  { name: "Deficit Push-Up", muscle: "Pecho", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Manos elevadas en bloques para mayor rango de movimiento." },
  { name: "Pike Push-Up", muscle: "Hombros", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Cuerpo en V invertida, flexiona los codos." },
  { name: "Cuban Press", muscle: "Hombros", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Combina rotación de hombro con press vertical." },
  { name: "Lateral Raise Machine", muscle: "Hombros", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sentado, apoya los codos en los almohadones y levanta." },
  { name: "Cable Lateral Raise", muscle: "Hombros", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Polea baja al costado, eleva el brazo lateralmente." },
  { name: "Single Arm Cable Curl", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Polea baja, curl unilateral." },
  { name: "Overhead Tricep Extension (Cable)", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Polea", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Polea baja detrás, extiende los codos sobre la cabeza." },
  { name: "Incline Dumbbell Curl", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Banco inclinado, estiramiento completo del bíceps." },
  { name: "Drag Curl", muscle: "Brazos (Bíceps/Tríceps)", equipment: "Barra", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Barra arrastra por el cuerpo al subir, codos atrás." },
  { name: "Single Leg Hip Thrust", muscle: "Piernas (Muslos)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Hip thrust con una sola pierna activa." },
  { name: "Wall Sit", muscle: "Piernas (Muslos)", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Apoyado en la pared en posición de sentadilla." },
  { name: "Romanian Split Deadlift", muscle: "Piernas (Muslos)", equipment: "Mancuernas", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Peso muerto a una pierna con mancuerna." },
  { name: "Sprints en Cinta", muscle: "Cardio", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Sprints de 20-30 segundos con recuperación activa." },
  { name: "Tabata (20/10 intervalos)", muscle: "Cardio", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "8 rondas: 20 segundos trabajo, 10 descanso." },
  { name: "Escaladores (Stepper)", muscle: "Cardio", equipment: "Máquina", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Máquina de escalada, alternancia continua de piernas." },
  { name: "Hipopresivos", muscle: "Abdomen/Cintura", equipment: "Peso Corporal", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Expiración forzada con vacío abdominal." },
  { name: "Foam Roll Cuádriceps", muscle: "Piernas (Muslos)", equipment: "Otro", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Rueda el foam roller por el cuádriceps lentamente." },
  { name: "Foam Roll Espalda", muscle: "Espalda", equipment: "Otro", gif: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif", instructions: "Rueda el foam roller por la columna torácica." },
];

export async function GET() {
  try {
    // Promocionar administrador si ya existe
    await prisma.user.updateMany({
      where: { email: "carrizoaxel67@gmail.com" },
      data: { role: "ADMIN", isApproved: true }
    });

    let count = 0;
    for (const ex of EXERCISES) {
      await prisma.exercise.upsert({
        where: { name: ex.name },
        create: {
          name: ex.name,
          muscleGroup: ex.muscle,
          equipment: ex.equipment,
          gifUrl: ex.gif,
          instructions: ex.instructions,
          isCustom: false,
        },
        update: {
          muscleGroup: ex.muscle,
          equipment: ex.equipment,
          gifUrl: ex.gif,
          instructions: ex.instructions,
        },
      });
      count++;
    }
    return NextResponse.json({ ok: true, seeded: count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
