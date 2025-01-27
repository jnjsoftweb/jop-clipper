// import { generateMarkdownBody } from "../utils/converter";
import { generateMarkdownBody, generateFrontmatter } from '../utils';
import { ClipProperties } from '../types';
import { SETTINGS, preFrontmatter_youtube, postMarkdown_youtube } from '../rules';

const preFrontmatterHooks: {
  [key: string]: (properties: ClipProperties) => Promise<{ properties: ClipProperties; appendix: string }>;
} = {
  preFrontmatter_youtube,
};

const postMarkdownHooks: {
  [key: string]: (markdown: string, properties: ClipProperties, appendix?: any) => Promise<string> | string;
} = {
  postMarkdown_youtube,
};

const createMarkdown = async (pattern: string, properties: ClipProperties, html: string): Promise<string> => {
  try {
    const rule = SETTINGS.find((rule) => rule.pattern === pattern);
    let appendix = '';

    // preFrontmatter hook 실행
    if (rule?.preFrontmatter && preFrontmatterHooks[rule.preFrontmatter]) {
      const hookResult = await preFrontmatterHooks[rule.preFrontmatter](properties);
      properties = hookResult.properties;
      appendix = hookResult.appendix;
    }

    // HTML을 마크다운으로 변환
    let markdown = generateMarkdownBody(html);

    // postMarkdown hook 실행
    if (rule?.postMarkdown && postMarkdownHooks[rule.postMarkdown]) {
      markdown = await postMarkdownHooks[rule.postMarkdown](markdown, properties, appendix);
    }

    // 프론트매터 생성
    const frontMatter = generateFrontmatter(properties);

    // frontmatter를 가장 먼저 반환
    return `${frontMatter}\n\n${markdown}`;
  } catch (error) {
    console.error('Error converting to Markdown:', error);
    throw error;
  }
};

export { createMarkdown };
