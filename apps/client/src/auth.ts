import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
// import Google from "next-auth/providers/google";
// import Discord from "next-auth/providers/discord";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // TODO: 프로덕션에서 OAuth 복원
    // Google({
    //   clientId: process.env.AUTH_GOOGLE_ID!,
    //   clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    // }),
    // Discord({
    //   clientId: process.env.AUTH_DISCORD_ID!,
    //   clientSecret: process.env.AUTH_DISCORD_SECRET!,
    // }),

    Credentials({
      name: "Test Login",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "player1" },
        password: { label: "Password", type: "password", placeholder: "1234" },
      },
      async authorize(credentials) {
        // 테스트용: 비밀번호 "1234"면 누구나 로그인
        if (credentials?.password === "1234" && credentials?.username) {
          return {
            id: credentials.username as string,
            name: credentials.username as string,
            email: `${credentials.username}@test.local`,
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
