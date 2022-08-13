import { query } from "faunadb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { fauna } from "../../services/fauna";
import { stripe } from "../../services/stripe";
type User = {
  ref: {
    id: string;
  };
  data: {
    stripe_customer_id: string;
  };
};
export default async (req: NextApiRequest, res: NextApiResponse) => {
  // stripe.checkout.sessions.create

  if (req.method === "POST") {
    const session = await getSession({ req });

    const user = await fauna.query<User>(
      query.Get(
        query.Match(
          query.Index("user_by_email"),
          query.Casefold(session.user.email)
        )
      )
    );

    let customerId = user.data.stripe_customer_id;
    if (!customerId) {
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email,
        //   metadata,
      });
      customerId = stripeCustomer.id;
    }

    await fauna.query(
      query.Update(query.Ref(query.Collection("users"), user.ref.id), {
        data: {
          stripe_customer_id: customerId,
        },
      })
    );

    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      billing_address_collection: "required",
      line_items: [
        {
          price: "price_1LK06XJsc2fEVEKTgZs2a8ZW",
          quantity: 1,
        },
      ],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      customer: customerId,
    });

    return res.status(200).json({ sessionId: stripeCheckoutSession.id });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method not allowed");
  }
};
