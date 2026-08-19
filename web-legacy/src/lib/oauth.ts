// Configuración y helpers de OAuth 2.0 (Google, Apple, Facebook)

export type OAuthProvider = "google" | "apple" | "facebook";

export const OAUTH_PROVIDERS: OAuthProvider[] = ["google", "apple", "facebook"];

const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

export function isOAuthMockEnabled() {
  return process.env.OAUTH_MOCK === "1";
}

export function isProviderConfigured(provider: OAuthProvider): boolean {
  if (isOAuthMockEnabled()) return true;
  switch (provider) {
    case "google":
      return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    case "apple":
      return !!(
        process.env.APPLE_CLIENT_ID &&
        process.env.APPLE_TEAM_ID &&
        process.env.APPLE_KEY_ID &&
        process.env.APPLE_PRIVATE_KEY
      );
    case "facebook":
      return !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);
  }
}

function redirectUri(provider: OAuthProvider) {
  return `${APP_URL}/api/auth/oauth/${provider}/callback`;
}

/** URL de autorización del proveedor con state. */
export function buildAuthorizeUrl(provider: OAuthProvider, state: string): string {
  switch (provider) {
    case "google":
      return (
        "https://accounts.google.com/o/oauth2/v2/auth" +
        `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri(provider))}` +
        "&response_type=code" +
        "&scope=openid%20email%20profile" +
        `&state=${state}`
      );
    case "facebook":
      return (
        "https://www.facebook.com/v19.0/dialog/oauth" +
        `?client_id=${process.env.FACEBOOK_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri(provider))}` +
        "&response_type=code" +
        "&scope=email%2Cpublic_profile" +
        `&state=${state}`
      );
    case "apple":
      return (
        "https://appleid.apple.com/auth/authorize" +
        `?client_id=${process.env.APPLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri(provider))}` +
        "&response_type=code" +
        "&scope=name%20email" +
        "&response_mode=form_post" +
        `&state=${state}`
      );
  }
}

interface OAuthProfile {
  email: string;
  name: string;
}

/** Intercambia el código de autorización por un perfil (email + nombre). */
export async function exchangeCode(provider: OAuthProvider, code: string): Promise<OAuthProfile> {
  switch (provider) {
    case "google": {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri(provider),
        }),
      });
      const token = await tokenRes.json();
      if (!tokenRes.ok || !token.access_token) {
        throw new Error("No se pudo intercambiar el código de Google");
      }
      const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { authorization: `Bearer ${token.access_token}` },
      });
      const info = await infoRes.json();
      return { email: info.email, name: info.name || info.email?.split("@")[0] };
    }
    case "facebook": {
      const tokenRes = await fetch(
        "https://graph.facebook.com/v19.0/oauth/access_token" +
          `?client_id=${process.env.FACEBOOK_CLIENT_ID}` +
          `&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}` +
          `&redirect_uri=${encodeURIComponent(redirectUri(provider))}` +
          `&code=${code}`
      );
      const token = await tokenRes.json();
      if (!tokenRes.ok || !token.access_token) {
        throw new Error("No se pudo intercambiar el código de Facebook");
      }
      const infoRes = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${token.access_token}`
      );
      const info = await infoRes.json();
      if (!info.email) {
        throw new Error("Facebook no devolvió el email (cuenta sin email público)");
      }
      return { email: info.email, name: info.name || info.email.split("@")[0] };
    }
    case "apple": {
      const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.APPLE_CLIENT_ID!,
          client_secret: buildAppleClientSecret(),
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri(provider),
        }),
      });
      const token = await tokenRes.json();
      if (!tokenRes.ok || !token.id_token) {
        throw new Error("No se pudo intercambiar el código de Apple");
      }
      // El email viaja dentro del id_token (JWT). Decodificamos solo el payload.
      const payload = JSON.parse(
        Buffer.from(token.id_token.split(".")[1], "base64url").toString("utf-8")
      ) as { email?: string; sub?: string };
      if (!payload.email) {
        throw new Error('Apple no devolvió el email (el usuario usó "ocultar mi email")');
      }
      return { email: payload.email, name: payload.email.split("@")[0] };
    }
  }
}

function buildAppleClientSecret(): string {
  // Requiere el paquete `jsonwebtoken` para firmar el JWT ES256 de Apple.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const jwt = require("jsonwebtoken") as any;
  return jwt.sign(
    { iss: process.env.APPLE_TEAM_ID, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, aud: "https://appleid.apple.com", sub: process.env.APPLE_CLIENT_ID },
    process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    { algorithm: "ES256", header: { alg: "ES256", kid: process.env.APPLE_KEY_ID } }
  );
}
