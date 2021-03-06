import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import PreviewToolbar from '../../components/PreviewToolbar';

import Comments from '../../components/Comments';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}
interface PostPagination {
  uid: string;
  data: {
    title: string;
  };
}

interface PostProps {
  post: Post;
  estimatedReadTime: number;
  nextPost: PostPagination | null;
  prevPost: PostPagination | null;
  preview: boolean;
}

export default function Post({
  post,
  estimatedReadTime,
  nextPost,
  prevPost,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();
  const pathName = router.asPath;
  console.log(JSON.stringify(router.asPath, null, 2));

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }
  return (
    <>
      <Header />

      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner" />
      </div>
      <main className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>

          <div className={styles.postInfo}>
            <p>
              <FiCalendar className={styles.icon} />

              {format(new Date(post.first_publication_date), 'dd MMM uuuu', {
                locale: ptBR,
              })}
            </p>
            <p>
              <FiUser className={styles.icon} />
              {post.data.author}
            </p>

            <p>
              <FiClock className={styles.icon} />
              {`${estimatedReadTime} min`}
            </p>
          </div>

          {post.last_publication_date && (
            <div className={styles.postUpdated}>
              <p>
                {format(
                  new Date(post.last_publication_date),
                  "'* editado em 'dd MMM uuuu', ??s 'HH:mm",
                  {
                    locale: ptBR,
                  }
                )}
              </p>
            </div>
          )}

          <div className={styles.postContent}>
            {post.data.content.map(content => {
              const body = RichText.asHtml(content.body);
              return (
                <div key={content.heading}>
                  <h2>{content.heading}</h2>

                  <div
                    className={styles.postBody}
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                </div>
              );
            })}
          </div>

          <div className={styles.footer}>
            <div className={styles.navigation}>
              {prevPost && (
                <>
                  <p>{prevPost.data.title}</p>
                  <Link href={`/post/${prevPost.uid}`}>
                    <a>Post anterior</a>
                  </Link>
                </>
              )}
            </div>

            <div className={styles.navigation}>
              {nextPost && (
                <>
                  <p>{nextPost.data.title}</p>
                  <Link href={`/post/${nextPost.uid}`}>
                    <a>Pr??ximo post</a>
                  </Link>
                </>
              )}
            </div>
          </div>

          <Comments slug={pathName} />
        </article>
      </main>

      {preview && (
        <Link href="/api/exit-preview">
          <a className={commonStyles.preview}>Sair do modo preview</a>
        </Link>
      )}
      <PreviewToolbar />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    { pageSize: 1 }
  );

  return {
    paths: posts.results.map(post => {
      return { params: { slug: post.uid } };
    }),

    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData = {},
}) => {
  const { slug } = params;
  const { ref } = previewData;
  const prismic = getPrismicClient();

  const postResponse = await prismic.getByUID('posts', String(slug), {
    ref: ref || null,
  });

  const totalWords = postResponse.data.content.reduce((acc, content) => {
    const bodyContent = RichText.asText(content.body);

    const contentSize = bodyContent.split(' ').length - 1;
    return acc + contentSize;
  }, 0);

  const estimatedReadTime = Math.ceil(totalWords / 200);

  const prevPost = await prismic.query(
    [
      Prismic.predicates.dateBefore(
        'document.first_publication_date',
        postResponse.first_publication_date
      ),
    ],
    {
      fetch: ['document.uid'],
      pageSize: 1,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const nextPost = await prismic.query(
    [
      Prismic.predicates.dateAfter(
        'document.first_publication_date',
        postResponse.first_publication_date
      ),
    ],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date]',
    }
  );

  return {
    props: {
      post: postResponse,
      estimatedReadTime,
      nextPost: nextPost?.results[0] || null,
      prevPost: prevPost?.results[0] || null,
      preview,
    },
    redirect: 60 * 30, // 30 min
  };
};
