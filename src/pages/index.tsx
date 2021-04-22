import { GetStaticProps } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import PreviewToolbar from '../components/PreviewToolbar';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const { results, next_page } = postsPagination;
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  function handleNextPage(): void {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        setPosts([...posts, ...data.results]);
        setNextPage(data.next_page);
      });
  }

  return (
    <>
      <Header />
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInfo}>
                  <p>
                    <FiCalendar className={styles.icon} />

                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM uuuu',
                      {
                        locale: ptBR,
                      }
                    )}
                  </p>
                  <p>
                    <FiUser className={styles.icon} />
                    {post.data.author}
                  </p>
                </div>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button
              type="button"
              onClick={handleNextPage}
              className={styles.nextPage}
            >
              Carregar mais posts
            </button>
          )}
        </div>
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

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData = {},
}) => {
  const { ref } = previewData;
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 2,
      orderings: '[documents.first_publication_date]',
      ref: ref || null,
    }
  );

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsResponse.results,
      },
      preview,
    },
  };
};
