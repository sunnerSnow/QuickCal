import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  // Create new calendars ("categories"); only covers calendars QuickCal creates
  "https://www.googleapis.com/auth/calendar.app.created",
];
const SCOPES = ["openid", "email", "profile", ...CALENDAR_SCOPES];

type AuthError = "RefreshTokenError" | "MissingScope";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: AuthError;
  }
}

// next-auth/jwt re-exports this module; augmenting it there fails to resolve
declare module "@auth/core/jwt" {
  interface JWT {
    access_token?: string;
    expires_at?: number;
    refresh_token?: string;
    error?: AuthError;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Show sign-in failures on the home page instead of Auth.js's error page
  pages: { error: "/" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: SCOPES.join(" "),
          // Needed to receive a refresh token so users stay signed in
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // First sign-in: persist Google tokens in the encrypted session cookie
      if (account) {
        // Google's consent screen lets users untick individual scopes
        const granted = account.scope?.split(" ") ?? [];
        // Google reports email/profile under their long URLs, so only check the calendar scopes
        const missingScope = CALENDAR_SCOPES.some((scope) => !granted.includes(scope));
        return {
          ...token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
          error: missingScope ? ("MissingScope" as const) : undefined,
        };
      }

      if (token.error === "MissingScope") return token;

      // Access token still valid (with a 60s margin)
      if (token.expires_at && Date.now() < (token.expires_at - 60) * 1000) {
        return token;
      }

      if (!token.refresh_token) {
        return { ...token, error: "RefreshTokenError" as const };
      }

      try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refresh_token,
          }),
        });
        const refreshed = await res.json();
        if (!res.ok) throw refreshed;

        return {
          ...token,
          access_token: refreshed.access_token,
          expires_at: Math.floor(Date.now() / 1000 + refreshed.expires_in),
          // Google only sometimes rotates the refresh token
          refresh_token: refreshed.refresh_token ?? token.refresh_token,
          error: undefined,
        };
      } catch (error) {
        console.error("Failed to refresh Google access token", error);
        return { ...token, error: "RefreshTokenError" as const };
      }
    },
    async session({ session, token }) {
      // Only the short-lived access token is exposed; the refresh token stays in the encrypted cookie
      session.accessToken = token.access_token;
      session.error = token.error;
      return session;
    },
  },
});
