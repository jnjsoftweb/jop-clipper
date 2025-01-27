import { PatternRule } from '../types';

const BlogNaverRule: PatternRule = {
  pattern: 'blog/naver',
  urlPatterns: ['blog.naver.com'],
  fetchType: 'fetchWithRedirect',
  callback: 'fetchWithRedirect_naverBlog',
  properties: {
    title: {
      selector: "meta[property='og:title']",
      attribute: 'content',
    },
    author: {
      selector: "meta[property='naverblog:nickname']",
      attribute: 'content',
    },
    published: {
      selector: '.date',
      attribute: 'text',
    },
    description: {
      selector: "meta[property='og:description']",
      attribute: 'content',
      callback: 'decodeHtmlEntities',
    },
    tags: {
      value: ['clipping/blog/naver'],
    },
    clipped: {
      callback: 'today',
    },
  },
  rootSelector: '#postListBody',
  removeSelectors: ['script', 'style', '.revenue_unit_wrap', '.na_ad'],
  postHtml: 'postHtml_naver',
};

const fetchWithRedirect_naverBlog = async (doc: Document): Promise<string | null> => {
  const mainFrame = doc.querySelector('#mainFrame') as HTMLIFrameElement;
  if (!mainFrame?.src) return null;

  try {
    const iframeSrc = mainFrame.src;
    const url = new URL(iframeSrc.startsWith('//') ? `https:${iframeSrc}` : iframeSrc);

    const blogId = url.searchParams.get('blogId');
    const logNo = url.searchParams.get('logNo');

    if (blogId && logNo) {
      return `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}&redirect=Dlog&widgetTypeCall=true&directAccess=false`;
    }

    if (!url.href.startsWith('https://blog.naver.com')) {
      const path = url.pathname + url.search;
      return `https://blog.naver.com${path}`;
    }

    return url.href;
  } catch (error) {
    console.error('Error parsing iframe URL:', error);
    const iframeSrc = mainFrame.src;
    if (iframeSrc.startsWith('//')) return `https:${iframeSrc}`;
    if (iframeSrc.startsWith('/')) return `https://blog.naver.com${iframeSrc}`;
    if (!iframeSrc.startsWith('http')) return `https://blog.naver.com/${iframeSrc}`;
    return iframeSrc;
  }
};

// 이미지 주소 변환 naver용
const postHtml_naver = (html: string): string => {
  return html.replace(/\?type=w\d+_blur/g, '?type=w966');
};

export { BlogNaverRule, fetchWithRedirect_naverBlog, postHtml_naver };
