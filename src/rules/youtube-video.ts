import { PatternRule, ClipProperties } from '../types';

const YoutubeVideoRule: PatternRule = {
  pattern: 'youtube/video',
  urlPatterns: ['youtube.com/watch', 'youtu.be'],
  fetchType: 'fetchSimple',
  properties: {
    title: {
      selector: "meta[property='og:title']",
      attribute: 'content',
      callback: 'sanitizeName',
    },
    author: {
      selector: "link[itemprop='name']",
      attribute: 'content',
    },
    published: {
      selector: "meta[itemprop='datePublished']",
      attribute: 'content',
      callback: 'formatDate',
    },
    clipped: {
      callback: 'today',
    },
    description: {
      selector: 'script',
      attribute: 'text',
      callback: 'extractYoutubeDescription',
    },
    tags: {
      selector: 'script',
      attribute: 'text',
      callback: 'extractYoutubeTags',
      value: ['clipping/youtube/video'],
    },
  },
  rootSelector: '#player',
  removeSelectors: ['script', 'style', '#secondary', '#comments', '#related'],
  preFrontmatter: 'preFrontmatter_youtube',
  postMarkdown: 'postMarkdown_youtube',
};

// * html
// const preProperties_youtube = (url: string) => {
//   return '';
// };

const extractYoutubeDescription = (v: string, doc?: Document): string => {
  try {
    if (!doc) return '';

    // 모든 script 태그 내용을 검사
    const scripts = Array.from(doc.querySelectorAll('script'));
    for (const script of scripts) {
      const content = script.textContent || '';
      if (content.includes('ytInitialPlayerResponse')) {
        // ytInitialPlayerResponse 객체를 찾기 위한 정규식
        const match = content.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (match) {
          const ytData = JSON.parse(match[1]);
          const description = ytData.videoDetails?.shortDescription || '';

          // 설명 텍스트 정리
          return description
            .replace(/"/g, "'") // 큰따옴표를 작은따옴표로 변경
            .replace(/\n/g, '\\n') // 줄바꿈을 \n 문자열로 변경
            .trim();
        }
      }
    }
  } catch (error) {
    console.error('Error extracting YouTube description:', error);
  }
  return '';
};

const extractYoutubeTags = (v: string, doc?: Document): string[] => {
  try {
    if (!doc) return [];

    // 모든 script 태그 내용을 검사
    const scripts = Array.from(doc.querySelectorAll('script'));
    for (const script of scripts) {
      const content = script.textContent || '';
      if (content.includes('ytInitialPlayerResponse')) {
        // ytInitialPlayerResponse 객체를 찾기 위한 정규식
        const match = content.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (match) {
          const ytData = JSON.parse(match[1]);
          const description = ytData.videoDetails?.shortDescription || '';

          // 해시태그 추출 및 처리
          const hashtags = description.match(/#[\w가-힣]+/g) || [];
          return hashtags.map((tag: string) => tag.slice(1)); // '#' 제거
        }
      }
    }
  } catch (error) {
    console.error('Error extracting YouTube tags:', error);
  }
  return [];
};

// * markdown
// preFrontmatter hook
const preFrontmatter_youtube = async (properties: ClipProperties) => {
  try {
    const videoId = new URL(properties.url).searchParams.get('v');
    let resContent = '';
    let resScript = '';
    if (videoId) {
      const response = await fetch(`https://n8n.bigwhiteweb.com/webhook/youtube-summary?videoId=${videoId}`);
      if (response.ok) {
        const data = await response.json();
        resContent = data.content;
        resScript = data.script;
      }
    }

    const [tags, body] = resContent.split('## summary');
    const addedTags = tags.replace('[', '').replace(']', '').split('\n')[1].split(',');
    const appendix = '## summary' + body + '\n\n## script\n' + resScript;

    return {
      properties: {
        ...properties,
        tags: [...properties.tags, ...addedTags].map((tag) => tag.replace(/\s+/g, '')),
      },
      appendix,
    };
  } catch (error) {
    console.error('Error in preFrontmatter_youtube:', error);
    return { properties, appendix: '' };
  }
};

// postMarkdown hook
const postMarkdown_youtube = async (markdown: string, properties: ClipProperties, appendix?: any): Promise<string> => {
  const link = `\n\n![${properties.title}](${properties.url})\n\n\n`;
  return link + appendix;
};

export {
  YoutubeVideoRule,
  extractYoutubeDescription,
  extractYoutubeTags,
  preFrontmatter_youtube,
  postMarkdown_youtube,
};
