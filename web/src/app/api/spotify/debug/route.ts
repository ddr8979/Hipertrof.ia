import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID ?? "";
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? "";
  
  const hasId = clientId.length > 0;
  const hasSecret = clientSecret.length > 0;
  
  let tokenResult = null;
  let tokenError = null;
  
  if (hasId && hasSecret) {
    try {
      const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SPOTIFY_CLIENT_ID!,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
      });
      const r = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.SPOTIFY_CLIENT_ID!,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
        }),
      });
      const text = await r.text();
      if (r.ok) {
        const data = JSON.parse(text);
        tokenResult = { success: true, hasToken: !!data.access_token, expiresIn: data.expires_in };
      } else {
        tokenError = { status: r.status, body: text };
      }
    } catch (e) {
      tokenError = String(e);
    }
  }
  
  return NextResponse.json({
    hasClientId: hasId,
    hasClientSecret: hasSecret,
    clientIdPrefix: hasId ? process.env.SPOTIFY_CLIENT_ID!.slice(0, 8) + "..." : "NOT SET",
    tokenTest: tokenResult,
    tokenError,
  });
}