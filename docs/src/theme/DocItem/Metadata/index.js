// cspell:ignore describedby
import { DocItemMetadata } from '@swmansion/t-rex-ui';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useDoc } from '@docusaurus/plugin-content-docs/client';

export default function Metadata() {
  const { metadata } = useDoc();
  const { siteConfig } = useDocusaurusContext();

  return (
    <>
      <DocItemMetadata />
      <Head>
        <link
          rel="alternate"
          type="text/markdown"
          href={`${siteConfig.url}${metadata.permalink.replace(/\/$/, '')}.md`}
        />
        <link rel="describedby" href={`${siteConfig.url}${siteConfig.baseUrl}llms.txt`} />
      </Head>
    </>
  );
}
