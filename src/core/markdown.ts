// import { generateMarkdownBody } from "../utils/converter";
import { generateMarkdownBody, generateFrontmatter } from "../utils";
import { ClipProperties } from "../types";
import { SETTINGS } from "../rules";

// preFrontmatter hooks 수정
const preFrontmatter_youtube = async (properties: ClipProperties) => {
  try {
    const videoId = new URL(properties.url).searchParams.get("v");
    let text = "";
    if (videoId) {
      const response = await fetch(`https://n8n.bigwhiteweb.com/webhook/youtube-summary?videoId=${videoId}`);
      if (response.ok) {
        const data = await response.json();
        text = data.content;
      }
    }

    const [tags, body] = text.split('## summary');
    const addedTags = tags
      .replace("[","")
      .replace("]","")
      .split('\n')[1]
      .split(',');
    const appendix = '## summary' + body;

    return {
      properties: {
        ...properties,
        tags: [...properties.tags, ...addedTags].map(tag => tag.replace(/\s+/g, ""))
      },
      appendix
    };
  } catch (error) {
    console.error("Error in preFrontmatter_youtube:", error);
    return { properties, appendix: "" };
  }
};

const preFrontmatterHooks: { [key: string]: (properties: ClipProperties) => Promise<{properties: ClipProperties, appendix: string}> } = {
  preFrontmatter_youtube,
};

// postMarkdown hooks 수정
const postMarkdown_youtube = async (
  markdown: string, 
  properties: ClipProperties,
  appendix?: any
): Promise<string> => {

  const link = `\n\n![${properties.title}](${properties.url})\n\n\n`;
  return link + appendix;
};

const postMarkdownHooks: { 
  [key: string]: (
    markdown: string, 
    properties: ClipProperties,
    appendix?: any
  ) => Promise<string> | string 
} = {
  postMarkdown_youtube,
};

const createMarkdown = async (pattern: string, properties: ClipProperties, html: string): Promise<string> => {
  try {
    const rule = SETTINGS.find(rule => rule.pattern === pattern);
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
    console.error("Error converting to Markdown:", error);
    throw error;
  }
};

/**
 * HTML을 Markdown으로 변환하는 함수
 */
const convHtmlToMarkdown = (html: string): string => generateMarkdownBody(html);

export {
  createMarkdown,
  convHtmlToMarkdown,
};
