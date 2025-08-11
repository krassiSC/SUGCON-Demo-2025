import React, { JSX } from 'react';
import {
  Field,
  GetComponentServerProps,
  withDatasourceCheck,
  useComponentProps,
} from '@sitecore-content-sdk/nextjs';
import { ComponentRendering } from '@sitecore-content-sdk/nextjs';
import { cn } from '@/lib/utils';

type ComponentProps = {
  rendering: ComponentRendering;
  // params: ComponentParams;
};

type ArticleData = {
  id: string;
  title: string;
  body: string;
};

type ArticleContentProps = ComponentProps &
  ArticleData & {
    fields: {
      ArticleId: Field<string>;
    };
    params: { [key: string]: string };
  };

const ArticleContent = (props: ArticleContentProps): JSX.Element => {
  const data = useComponentProps<ArticleData>(props.rendering.uid);
  const id = props.params.RenderingIdentifier;
  return (
    <div
      className={cn('component rich-text', props.params.styles?.trimEnd())}
      id={id ? id : undefined}
    >
      {data?.id === 'dummy-id' ? (
        <>
          <h2>Content Hub Article</h2>
          <p>--- Please enter a correct Article ID ---</p>
        </>
      ) : (
        <>
          <h2 className='class="font-heading mb-8 text-pretty text-5xl font-light antialiased"'>
            {data?.title}
          </h2>
          <div dangerouslySetInnerHTML={{ __html: data?.body || '' }} />
        </>
      )}
    </div>
  );
};

export const getComponentServerProps: GetComponentServerProps = async (
  rendering: ComponentRendering
) => {
  const fields = rendering.fields as { ArticleId: Field<string> };
  const post = await GetPageItem(fields.ArticleId.value);

  return post;
};

export interface PageItem {
  name: string;
  id: string;
}

export async function GetPageItem(articleId: string) {
  const requestBody = {
    query: `
  query {
    blog:m_Content_Blog(id:"${articleId}") {
      id
      date:content_PublicationDate
      title:blog_Title
      body:blog_Body
    }
  }
`,
  };

  try {
    const response = await fetch(
      process.env.CH_GRAPH_QL_ENDPOINT || 'https://edge-beta.sitecorecloud.io/api/graphql/v1',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-gql-token': process.env.CH_API_KEY || '',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const jsonResponse = await response.json();
    const post = jsonResponse?.data?.blog ?? { id: 'dummy-id', name: 'dummy-name' };

    return post;
  } catch (error) {
    console.error('Error fetching article data:', error);
    return { id: 'dummy-id', name: 'dummy-name' };
  }
}

export default withDatasourceCheck()<ArticleContentProps>(ArticleContent);
