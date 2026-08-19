import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";
const REDIRECT = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://hypertrofia.vercel.app"}/api/spotify/callback`;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const verifier = req.cookies.get("spotify_verifier")?.value;

  if (error || !code || !state || !verifier) {
    return NextResponse.redirect(new URL("/perfil?spotify=error", req.url));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== state) {
    return NextResponse.redirect(new URL("/perfil?spotify=error", req.url));
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code_verifier: verifier,
  });

  const tok = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tok.ok) {
    return NextResponse.redirect(new URL("/perfil?spotify=error", req.url));
  }
  const t = (await tok.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  await supabase.from("spotify_tokens").upsert({
    user_id: user.id,
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });

  const res = NextResponse.redirect(new URL("/dashboard?spotify=ok", req.url));
  res.cookies.delete("spotify_verifier");
  return res;
}