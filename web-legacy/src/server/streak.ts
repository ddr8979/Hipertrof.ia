import { prisma } from "@/server/db";

function getDaysDiff(d1Str: string, d2Str: string) {
  const date1 = new Date(d1Str + "T00:00:00");
  const date2 = new Date(d2Str + "T00:00:00");
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/** Calcula la racha actual de asistencia (estilo TikTok: cuenta desde hoy o ayer). */
export function calcStreak(dates: string[], todayStr: string): number {
  const unique = Array.from(new Set(dates)).sort().reverse();
  if (unique.length === 0) return 0;

  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const latest = unique[0];

  if (latest !== todayStr && latest !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 0; i < unique.length - 1; i++) {
    if (getDaysDiff(unique[i], unique[i + 1]) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Marca la asistencia de hoy (si no existe) y actualiza streak/maxStreak del perfil.
 * Devuelve la racha actual calculada.
 */
export async function markAttendanceAndStreak(userId: string): Promise<number> {
  const t = todayStr();

  await prisma.attendance.upsert({
    where: { userId_date: { userId, date: t } },
    create: { userId, date: t },
    update: {},
  });

  const allAtt = await prisma.attendance.findMany({
    where: { userId },
    select: { date: true },
  });

  const streak = calcStreak(allAtt.map((a) => a.date), t);

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: { streak },
    create: { userId, streak },
  });

  const maxStreak = Math.max(profile.maxStreak, streak);
  if (maxStreak !== profile.maxStreak) {
    await prisma.profile.update({ where: { userId }, data: { maxStreak } });
  }

  return streak;
}
