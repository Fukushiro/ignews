import { GetServerSideProps, GetStaticPaths, GetStaticProps } from "next";
import { getSession, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { RichText } from "prismic-dom";
import { useEffect } from "react";
import { getPrimicClient } from "../../../services/prismic";
import styles from "../post.module.scss";
interface PostPreviewProps {
  post: {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
  };
}
export default function PostPreview(props: PostPreviewProps) {
  const { data } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (data?.activeSubscription) {
      router.push(`/posts/${props.post.slug}`);
    }
  }, [data]);

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
            className={`${styles.postContent} ${styles.previewContent}`}
            dangerouslySetInnerHTML={{ __html: props.post.content }}
          />

          <div className={styles.continueReading}>
            Wana continue reading?
            <Link href="">
              <a>Subscribe now</a>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrimicClient();

  const response: any = await prismic.getByUID("post", String(slug), {});
  console.log("data ", response);

  let t = await response?.data?.content;

  t[0].text = t[0].text.substr(0, 300);
  const post = {
    slug,
    title: response.data.title,
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
    revalidate: 60,
  };
};
