import { Document } from "@prismicio/client/types/documents";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import { RichText } from "prismic-dom";
import { getPrimicClient } from "../../services/prismic";
import styles from "./post.module.scss";
interface PostProps {
  post: {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
  };
}
export default function Post(props: PostProps) {
  return (
    <>
      <Head>
        <title>{props.post.title} | Ignews</title>
      </Head>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{props.post.title}</h1>
          <time>{props.post.updatedAt}</time>
          <div
            className={styles.postContent}
            dangerouslySetInnerHTML={{ __html: props.post.content }}
          />
        </article>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  params,
}) => {
  const session = await getSession({ req });
  // console.log("sess", session);
  if (!session?.activeSubscription) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  const { slug } = params;

  const prismic = getPrimicClient(req);

  const response: Document<any> = await prismic.getByUID(
    "post",
    String(slug),
    {}
  );
  // console.log("data ", response?.data.content.splice(0, 3));
  let t = response?.data.content;
  console.log("response", response);

  // t.text = t.text.substr(0, 10);
  // t.text = t.text.splice(0, 3);
  const post = {
    slug,
    title: response?.data.title,
    content: RichText.asHtml(t),
    updatedAt: new Date(response.last_publication_date).toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ),
  };

  return {
    props: {
      post,
    },
  };
};
