// * source: /Users/moon/JnJ-soft/Projects/@extension/fork-obsidian-clipper/src/utils/obsidian-note-creator.ts
import TurndownService from 'turndown';
import { escapeDoubleQuotes } from './utils-string';

const turndownConfig = {
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  preformattedCode: true,
} as const;

const turndownService = new TurndownService(turndownConfig);

// 이미지와 링크 처리를 위한 규칙 추가
turndownService.addRule('figure', {
  filter: 'figure',
  replacement: (content: string, node: Node): string => {
    const figure = node as HTMLElement;
    const img = figure.querySelector('img');
    const figcaption = figure.querySelector('figcaption');

    if (!img) return content;

    const alt = img.getAttribute('alt') || '';
    const src = img.getAttribute('src') || '';
    const caption = figcaption ? figcaption.textContent?.trim() : '';

    return `![${alt}](${src})\n\n${caption}\n\n`;
  },
});

// YouTube 임베드 처리를 위한 규칙 추가
turndownService.addRule('embedToMarkdown', {
  filter: (node: Node): boolean => {
    if (node instanceof HTMLIFrameElement) {
      const src = node.getAttribute('src');
      return !!src && !!src.match(/(?:youtube\.com|youtu\.be)/);
    }
    return false;
  },
  replacement: (content: string, node: Node): string => {
    if (node instanceof HTMLIFrameElement) {
      const src = node.getAttribute('src');
      if (src) {
        const youtubeMatch = src.match(
          /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:embed\/|watch\?v=)?([a-zA-Z0-9_-]+)/
        );
        if (youtubeMatch && youtubeMatch[1]) {
          return `![](https://www.youtube.com/watch?v=${youtubeMatch[1]})`;
        }
      }
    }
    return content;
  },
});

// 강조 표시 처리를 위한 규칙 추가
turndownService.addRule('highlight', {
  filter: 'mark',
  replacement: (content: string): string => `==${content}==`,
});

// 취소선 처리를 위한 규칙 추가
turndownService.addRule('strikethrough', {
  filter: (node: Node): boolean => node.nodeName === 'DEL' || node.nodeName === 'S' || node.nodeName === 'STRIKE',
  replacement: (content: string): string => `~~${content}~~`,
});

// 불필요한 요소 제거
turndownService.remove(['script', 'style', 'button']);

// iframe, video, audio 등의 요소 유지
turndownService.keep(['iframe', 'video', 'audio']);

// * markdown 생성
const generateMarkdownBody = (html: string): string => {
  try {
    let markdown = turndownService.turndown(html);

    // 연속된 빈 줄 제거
    markdown = markdown.replace(/\n{3,}/g, '\n\n');

    // 빈 링크 제거 (이미지 링크 제외)
    markdown = markdown.replace(/\n*(?<!!)\[]\([^)]+\)\n*/g, '');

    return markdown.trim();
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    throw error;
  }
};

// * frontmatter 생성
const generateFrontmatter = (properties) => {
  let frontmatter = '---\n';

  for (const [key, value] of Object.entries(properties)) {
    frontmatter += `${key}:`;

    if (Array.isArray(value)) {
      frontmatter += '\n';
      value.forEach((item) => {
        frontmatter += `  - "${escapeDoubleQuotes(String(item))}"\n`;
      });
    } else {
      switch (typeof value) {
        case 'number':
          const numericValue = String(value).replace(/[^\d.-]/g, '');
          frontmatter += numericValue ? ` ${parseFloat(numericValue)}\n` : '\n';
          break;
        case 'boolean':
          frontmatter += ` ${value}\n`;
          break;
        case 'string':
          if (value.trim() !== '') {
            frontmatter += ` "${escapeDoubleQuotes(value)}"\n`;
          } else {
            frontmatter += '\n';
          }
          break;
        default:
          frontmatter += value ? ` "${escapeDoubleQuotes(String(value))}"\n` : '\n';
      }
    }
  }

  frontmatter += '---\n';

  return frontmatter.trim() === '---\n---' ? '' : frontmatter;
};

// * markdown 정리
const cleanMarkdown = (text: string): string => {
  return text
    .replace(/^\\/, '') // 시작 부분의 백슬래시 제거
    .replace(/\\(?=---)/g, '') // --- 앞의 백슬래시 제거
    .replace(/\\(?=\[)/g, '') // [ 앞의 백슬래시 제거
    .replace(/\\(?=\])/g, '') // ] 앞의 백슬래시 제거
    .replace(/\\(?=-)/g, '') // - 앞의 백슬래시 제거
    .replace(/\\(?=\.)/g, ''); // . 앞의 백슬래시 제거
};

export { generateMarkdownBody, generateFrontmatter, cleanMarkdown };
