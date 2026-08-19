import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const REDIRECT = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://hypertrofia.vercel.app"}/api/spotify/callback`;
const SCOPES = "user-read-currently-playing user-read-playback-state playlist-read-private";

function b64url(buf: ArrayBuffer): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  if (!CLIENT_ID) {
    return NextResponse.redirect(new URL("/perfil?spotify=missing", req.url));
  }

  const verifier = b64url(crypto.getRandomValues(new Uint8Array(64)).buffer);
  const challenge = b64url(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier).buffer as ArrayBuffer)
  );

  const res = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT)}&scope=${encodeURIComponent(SCOPES)}&code_challenge_method=S256&code_challenge=${challenge}&state=${user.id}`
  );
  res.cookies.set("spotify_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 600,
    path: "/",
  });
  return res;
}