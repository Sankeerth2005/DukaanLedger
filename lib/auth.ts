import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail, sendLoginAlert } from "./services/emailService";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // No adapter — JWT strategy handles sessions without DB session tables
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          shopId: user.shopId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth sign-in
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

      if (!existingUser) {
          // Create new user, their shop, and default settings atomically
          const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: {
                email,
                name: user.name || email.split("@")[0],
                role: "OWNER",
              },
            });
            const shop = await tx.shop.create({
              data: { name: `${newUser.name}'s Shop`, ownerId: newUser.id },
            });
            const linked = await tx.user.update({
              where: { id: newUser.id },
              data: { shopId: shop.id },
            });
            await tx.shopSettings.create({
              data: { shopId: shop.id, shopName: `${newUser.name}'s Shop` },
            });
            return linked;
          });

          sendWelcomeEmail(email, result.name || "").catch(console.error);

          user.id = result.id;
          (user as any).role = result.role;
          (user as any).shopId = result.shopId;
        } else {
          // Existing user — always re-fetch from DB so shopId is fresh
          const fresh = await prisma.user.findUnique({ where: { id: existingUser.id } });
          user.id = fresh?.id ?? existingUser.id;
          (user as any).role = fresh?.role ?? existingUser.role;
          (user as any).shopId = fresh?.shopId ?? existingUser.shopId;
        }

        // Send login alert asynchronously
        sendLoginAlert(email, "Google").catch(console.error);
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.shopId = (user as any).shopId;
      }

      // If shopId is somehow null but we have a user id, re-fetch from DB to heal stale tokens
      if (token.id && !token.shopId) {
        try {
          const fresh = await prisma.user.findUnique({ where: { id: token.id as string } });
          if (fresh?.shopId) token.shopId = fresh.shopId;
          if (fresh?.role) token.role = fresh.role;
        } catch { /* silent fail — don't break auth */ }
      }

      // Allow updating shopId after shop creation
      if (trigger === "update" && session?.shopId) {
        token.shopId = session.shopId;
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).shopId = token.shopId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
