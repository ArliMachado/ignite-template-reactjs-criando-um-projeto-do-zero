import { useEffect, useRef } from 'react';

interface CommentsProps {
  slug: string;
}

export default function Comments({ slug }: CommentsProps): JSX.Element {
  const commentBox = useRef<HTMLDivElement>();

  useEffect(() => {
    const script = document.createElement('script');

    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute(
      'repo',
      'ArliMachado/ignite-template-reactjs-criando-um-projeto-do-zero'
    );
    script.setAttribute('issue-term', slug);
    script.setAttribute('theme', 'github-dark');
    commentBox.current?.appendChild(script);
  }, [slug]);
  return <div ref={commentBox} />;
}
