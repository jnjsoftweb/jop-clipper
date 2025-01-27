import { generateMarkdownBody, generateFrontmatter } from './utils-markdown';
import { getFilesInFolder } from './utils-obsidian';

const sanitizeName = (name: string): string => {
  return name
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/[^\uAC00-\uD7A3a-zA-Z0-9_\(\)\<\>,\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const replaceHyphen = (v: string): string => v.replace(/-/g, ' ');

const today = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (v: string): string => v.split('T')[0];

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
  return matches.map((tag) => tag.replace('#', '').toLowerCase());
};

export {
  sanitizeName,
  replaceHyphen,
  today,
  formatDate,
  formatYoutubeDate,
  decodeHtmlEntities,
  extractHashtags,
  generateFrontmatter,
  generateMarkdownBody, // markdown
  getFilesInFolder,
};
