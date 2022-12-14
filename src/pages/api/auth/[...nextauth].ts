import { query } from "faunadb";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

import { fauna } from "../../../services/fauna";

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    session: async ({ session }) => {
      try {
        const userActiveSubscription = await fauna.query(
          query.Get(
            query.Intersection([
              query.Match(
                query.Index("subscription_by_user_ref"),
                query.Select(
                  "ref",
                  query.Get(
                    query.Match(
                      query.Index("user_by_email"),
                      query.Casefold(session.user.email)
                    )
                  )
                )
              ),
              query.Match(query.Index("subscription_by_status"), "active"),
            ])
          )
        );

        return { ...session, activeSubscription: userActiveSubscription };
      } catch (e) {
        return {
          ...session,
          activeSubscription: null,
        };
      }
    },
    signIn: async ({ user, account, profile, email, credentials }) => {
      console.log(user);
      try {
        await fauna.query(
          query.If(
            query.Not(
              query.Exists(
                query.Match(
                  query.Index("user_by_email"),
                  query.Casefold(user.email)
                )
              )
            ),
            query.Create(query.Collection("users"), {
              data: { email: user.email },
            }),

            query.Get(
              query.Match(
                query.Index("user_by_email"),
                query.Casefold(user.email)
              )
            )
          )
        );
        return true;
      } catch (e) {
        return false;
      }
    },
  },
});
