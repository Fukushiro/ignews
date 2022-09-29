import Prismic from "@prismicio/client";
import sm from "../../sm.json";
export function getPrimicClient(req?: unknown) {
  const prismic = Prismic.client(sm.apiEndpoint, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    req,
  });

  return prismic;
}
