import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const RESPONSES = [
  "¡Excelente pregunta! Para optimizar la hipertrofia en ese ejercicio, concéntrate en una fase excéntrica lenta (de 2 a 3 segundos) y un rango de repeticiones de 8 a 12 cerca del fallo muscular (RIR 1-2).",
  "Recordá que el descanso es crucial. Si estás entrenando con cargas pesadas (más del 80% de tu 1RM), descansa entre 2 y 3 minutos entre series para recuperar los niveles de ATP.",
  "Para tu plan calórico actual, asegúrate de consumir al menos 2.0g a 2.2g de proteína por kilogramo de peso corporal para maximizar la síntesis proteica.",
  "¡La constancia es la clave! No busques entrenamientos perfectos de vez en cuando, busca entrenamientos consistentes todas las semanas. ¡A darle duro! 💪",
  "Si sentís fatiga acumulada en las articulaciones, considerá programar una semana de descarga (deload) reduciendo el volumen total a la mitad.",
  "¡Tomá agua durante el entrenamiento! Una deshidratación del 2% puede reducir tu rendimiento de fuerza hasta en un 10%.",
];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Mensajes inválidos" }, { status: 400 });
    }

    const userMessage = messages[messages.length - 1]?.content || "";
    
    // Simular un retraso en la respuesta
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Elegir respuesta basándose en palabras clave o aleatoriamente
    let reply = "";
    const prompt = userMessage.toLowerCase();
    if (prompt.includes("caloria") || prompt.includes("comer") || prompt.includes("dieta") || prompt.includes("proteina") || prompt.includes("macro")) {
      reply = "Para optimizar tu nutrición, recordá que hypertrof.ia calcula tus macros automáticamente. Mantené tu objetivo de calorías diario y priorizá fuentes de proteína de alta calidad (pollo, huevos, legumbres) distribuidas uniformemente en el día.";
    } else if (prompt.includes("rutina") || prompt.includes("entreno") || prompt.includes("ejercicio") || prompt.includes("pecho") || prompt.includes("espalda") || prompt.includes("pierna")) {
      reply = "En tu rutina, la sobrecarga progresiva es el motor del crecimiento. Registrá tus series e intentá subir una repetición o un poco de peso cada semana, cuidando siempre que la técnica sea pulcra.";
    } else if (prompt.includes("1rm") || prompt.includes("fuerza") || prompt.includes("maxima")) {
      reply = "El 1RM estimado se calcula con la fórmula de Epley. Te sirve para planificar tus cargas porcentuales (ej. 75% del 1RM para hipertrofia) de forma segura sin fallar.";
    } else {
      reply = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
    }

    return NextResponse.json({
      message: {
        role: "assistant",
        content: reply,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
