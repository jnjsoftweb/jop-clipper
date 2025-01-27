import { requestUrl, TFile, Vault } from 'obsidian';
import {
  SETTINGS,
  WebDefaultRule,
  DefaultProperties,
  fetchWithRedirect_naverBlog,
  postHtml_naver,
  extractYoutubeDescription,
  extractYoutubeTags,
} from '../rules';
import { PatternRule, PropertyRule, ClipProperties, ClipData, RedirectCallback } from '../types';
import {
  sanitizeName,
  replaceHyphen,
  today,
  formatDate,
  formatYoutubeDate,
  decodeHtmlEntities,
  extractHashtags,
} from '../utils';

// HTML 대체 콜백 함수 타입 정의
type postHtmlCallback = (html: string) => string;

// HTML 대체 콜백 함수 맵
const postHtmlCallbacks: { [key: string]: postHtmlCallback } = {
  postHtml_naver,
};

const routeUrl = (url: string): PatternRule => {
  console.log('🔍🔍🔍 ROUTE URL FUNCTION STARTED 🔍🔍🔍');
  console.log('📌 Input URL:', url);
  console.log(
    '📋 Available rules:',
    SETTINGS.map((rule) => rule.pattern)
  );

  for (const rule of SETTINGS) {
    console.log(`\n🔎 Checking rule: ${rule.pattern}`);
    for (const urlPattern of rule.urlPatterns) {
      console.log(`- Testing pattern "${urlPattern}" in URL:`, url.includes(urlPattern));
      if (url.includes(urlPattern)) {
        console.log('✅ Match found! Using rule:', rule.pattern);
        return rule;
      }
    }
  }

  console.log('⚠️ No matching rule found, using default rule');
  return WebDefaultRule;
};

const executeCallback = (callbackName: string, value: string, doc?: Document): string | string[] => {
  const callbacks: { [key: string]: (value: string, doc?: Document) => string | string[] } = {
    sanitizeName,
    replaceHyphen,
    today,
    formatDate,
    formatYoutubeDate,
    decodeHtmlEntities,
    extractHashtags,
    extractYoutubeDescription,
    extractYoutubeTags,
  };

  // today 함수는 파라미터가 필요 없음
  if (callbackName === 'today') {
    return today();
  }

  return callbacks[callbackName]?.(value, doc) ?? value;
};

// callback 함수 맵
const redirectCallbacks: { [key: string]: RedirectCallback } = {
  fetchWithRedirect_naverBlog,
};

const fetchWithRedirect = async (url: string, rule: PatternRule): Promise<Document> => {
  console.log('Original URL:', url);

  // 첫 번째 페이지 가져오기
  const doc = await fetchSimple(url);

  // 리다이렉트가 필요한 경우
  if (rule.fetchType === 'fetchWithRedirect' && rule.callback) {
    const callback = redirectCallbacks[rule.callback];
    if (!callback) {
      throw new Error(`Callback function ${rule.callback} not found`);
    }

    const redirectUrl = await callback(doc);
    console.log('Redirect URL:', redirectUrl);

    if (redirectUrl) {
      console.log('Fetching redirect URL:', redirectUrl);
      // 리다이렉트된 페이지 가져오기
      return await fetchSimple(redirectUrl);
    }
  }

  return doc;
};

const fetchSimple = async (url: string): Promise<Document> => {
  console.log('Fetching simple URL:', url);

  const response = await requestUrl({
    url: url,
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });

  if (response.status !== 200) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const parser = new DOMParser();
  return parser.parseFromString(response.text, 'text/html');
};

const fetchByChrome = async (url: string, rule: PatternRule): Promise<Document> => {
  // TODO: Chrome 브라우저를 통한 페이지 로딩 구현
  console.log('Chrome-based fetching not implemented yet');
  throw new Error('Chrome-based fetching not implemented yet');
};

const extractProperties = (doc: Document, rule: PatternRule, url: string): ClipProperties => {
  const properties: ClipProperties = {
    ...DefaultProperties,
    url: url,
  };

  // 각 속성 추출
  for (const [key, propertyRule] of Object.entries(rule.properties)) {
    const { selector, attribute = 'text', callback, value } = propertyRule;

    // value가 있는 경우 직접 값 사용
    if (value !== undefined) {
      properties[key] = value;
    }

    // selector가 있는 경우 DOM에서 값 추출
    if (selector) {
      const elements = doc.querySelectorAll(selector);
      if (elements.length > 0) {
        let result: string | string[];

        if (attribute === 'text') {
          result = Array.from(elements).map((el) => el.textContent?.trim() || '');
        } else {
          result = Array.from(elements).map((el) => el.getAttribute(attribute) || '');
        }

        if (!Array.isArray(properties[key])) {
          result = result[0];
        }

        if (callback) {
          result = executeCallback(callback, result as string, doc);
        }

        if (Array.isArray(properties[key]) && Array.isArray(result)) {
          properties[key] = [...properties[key], ...result];
        } else {
          properties[key] = result;
        }
      }
    }
    // selector가 없고 callback만 있는 경우 (예: today)
    else if (callback) {
      const result = executeCallback(callback, '', doc);
      properties[key] = result;
    }
  }

  return properties;
};

const fetchData = async (url: string, vault?: Vault): Promise<ClipData> => {
  try {
    console.log('\n=== fetchData Start ===');
    const rule = routeUrl(url);
    console.log('\n=== Rule Selection Result ===');
    console.log('Selected pattern:', rule.pattern);

    let doc: Document;
    switch (rule.fetchType) {
      case 'fetchSimple':
        doc = await fetchSimple(url);
        break;
      case 'fetchWithRedirect':
        doc = await fetchWithRedirect(url, rule);
        break;
      case 'fetchByChrome':
        doc = await fetchByChrome(url, rule);
        break;
      default:
        doc = await fetchSimple(url);
    }

    // // YouTube 비디오인 경우 HTML 저장
    // if (rule.pattern === 'youtube/video' && vault) {
    //   const videoId = new URL(url).searchParams.get('v');
    //   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    //   const filename = `@youtube-video_${videoId}_${timestamp}.html`;

    //   // HTML 파일 저장
    //   await vault.create(filename, doc.documentElement.outerHTML);
    //   console.log(`Saved HTML to ${filename}`);
    // }

    // 속성 추출 (불필요한 요소 제거 전에 실행)
    const properties = extractProperties(doc, rule, url);

    // 불필요한 요소 제거
    if (rule.removeSelectors) {
      rule.removeSelectors.forEach((selector) => {
        const elements = doc.querySelectorAll(selector);
        console.log(`Removing ${elements.length} elements with selector: ${selector}`);
        elements.forEach((element) => {
          element.remove();
        });
      });
    }

    // 본문 컨텐츠 추출
    const content = rule.rootSelector ? doc.querySelector(rule.rootSelector) : doc.body;
    if (!content) {
      throw new Error(`Content not found with selector: ${rule.rootSelector}`);
    }
    console.log('Final content length:', content.innerHTML.length);

    let html = content.innerHTML;

    // console.log("#### postHtml callback:", rule.postHtml);

    // postHtml 콜백이 있는 경우 실행
    if (rule.postHtml) {
      // console.log("#### postHtml callback:", rule.postHtml);
      const callback = postHtmlCallbacks[rule.postHtml];
      if (!callback) {
        throw new Error(`postHtml callback function ${rule.postHtml} not found`);
      }
      html = callback(html);
    }

    return {
      pattern: rule.pattern,
      properties,
      html,
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export { routeUrl, executeCallback, fetchWithRedirect, fetchSimple, fetchByChrome, extractProperties, fetchData };
