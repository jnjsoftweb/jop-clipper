import { generateMarkdownBody, generateFrontmatter } from "./utils-markdown";
import { postHtml_naver } from "./utils-html";
import { getFilesInFolder } from './utils-obsidian';

const sanitizeName = (name: string): string => {
  return name
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/[^\uAC00-\uD7A3a-zA-Z0-9_\(\)\<\>,\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const replaceHyphen = (v: string): string => v.replace(/-/g, " ");

const today = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (v: string): string => v.split("T")[0];

const formatYoutubeDate = (v: string): string => {
  // 예: "2025. 1. 21." -> "2025-01-21"
  const match = v.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (match) {
    const [_, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return v;
};

const decodeHtmlEntities = (v: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = v;
  return textarea.value;
};

const extractHashtags = (v: string): string[] => {
  const matches = v.match(/#[\w가-힣]+/g) || [];
  return matches.map(tag => tag.replace('#', '').toLowerCase());
};

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

export {
  sanitizeName,
  replaceHyphen,
  today,
  formatDate,
  formatYoutubeDate,
  decodeHtmlEntities,
  extractHashtags,
  extractYoutubeDescription,
  extractYoutubeTags,
  generateFrontmatter,
  generateMarkdownBody, // markdown
  postHtml_naver, // html
  getFilesInFolder,
};
