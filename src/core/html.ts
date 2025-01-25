import { requestUrl, TFile, Vault } from "obsidian";
import { SETTINGS, DefaultRule, DefaultProperties } from "../rules";
import { fetchWithRedirect_naverBlog } from "../rules/blog-naver";
import { PatternRule, PropertyRule, ClipProperties, ClipData, RedirectCallback } from "../types";
import {
  sanitizeName,
  replaceHyphen,
  today,
  formatDate,
  formatYoutubeDate,
  decodeHtmlEntities,
  extractHashtags,
  extractYoutubeDescription,
  extractYoutubeTags,
} from "../utils";

function routeUrl(url: string): PatternRule {
  const hostname = new URL(url).hostname;

  for (const rule of SETTINGS) {
    if (rule.urlPatterns.some((pattern) => hostname.includes(pattern))) {
      return rule;
    }
  }

  // 기본 규칙
  return DefaultRule;
}

function extractProperties(doc: Document, rule: PatternRule, url: string): ClipProperties {
  const properties: ClipProperties = {
    ...DefaultProperties,
    url: url,
  };

  // 각 속성 추출
  for (const [key, propertyRule] of Object.entries(rule.properties)) {
    // value가 있는 경우 직접 값 사용
    if (propertyRule.value !== undefined) {
      properties[key] = propertyRule.value;
    }

    // selector가 있는 경우 DOM에서 값 추출
    if (propertyRule.selector) {
      const element = doc.querySelector(propertyRule.selector);
      if (element) {
        let value = propertyRule.attribute === "text" ? element.textContent : element.getAttribute(propertyRule.attribute || "");
        if (value) {
          value = value.trim();
          // callback 함수가 있다면 실행
          if (propertyRule.callback) {
            const result = executeCallback(propertyRule.callback, value, doc);
            if (key === 'tags' && Array.isArray(result)) {
              properties[key] = [...(properties[key] || []), ...result];
            } else if (typeof result === 'string') {
              properties[key] = result;
            }
          } else {
            properties[key] = value;
          }
        }
      }
    }
    // selector가 없고 callback만 있는 경우 (예: today)
    else if (propertyRule.callback) {
      const result = executeCallback(propertyRule.callback, "", doc);
      if (key === 'tags' && Array.isArray(result)) {
        properties[key] = [...(properties[key] || []), ...result];
      } else if (typeof result === 'string') {
        properties[key] = result;
      }
    }
  }

  return properties;
}

function executeCallback(callbackName: string, value: string, doc?: Document): string | string[] {
  // callback 함수들을 여기에 구현
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

  // callback이 today인 경우 value 파라미터 무시
  if (callbackName === "today") {
    return callbacks[callbackName]("");
  }

  return callbacks[callbackName]?.(value, doc) ?? value;
}

// callback 함수 맵
const redirectCallbacks: { [key: string]: RedirectCallback } = {
  fetchWithRedirect_naverBlog,
};

async function fetchWithRedirect(url: string, rule: PatternRule): Promise<Document> {
  console.log("Original URL:", url);

  // 첫 번째 페이지 가져오기
  const doc = await fetchSimple(url);

  // 리다이렉트가 필요한 경우
  if (rule.fetchType === "fetchWithRedirect" && rule.callback) {
    const callback = redirectCallbacks[rule.callback];
    if (!callback) {
      throw new Error(`Callback function ${rule.callback} not found`);
    }

    const redirectUrl = await callback(doc);
    console.log("Redirect URL:", redirectUrl);

    if (redirectUrl) {
      console.log("Fetching redirect URL:", redirectUrl);
      // 리다이렉트된 페이지 가져오기
      return await fetchSimple(redirectUrl);
    }
  }

  return doc;
}

function convertImageUrls(html: string, pattern: string): string {
  if (pattern === "blog/naver") {
    return html.replace(/\?type=w\d+_blur/g, "?type=w966");
  }
  return html;
}

async function fetchSimple(url: string): Promise<Document> {
  console.log("Fetching simple URL:", url);

  const response = await requestUrl({
    url: url,
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  if (response.status !== 200) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const parser = new DOMParser();
  return parser.parseFromString(response.text, "text/html");
}

async function fetchByChrome(url: string, rule: PatternRule): Promise<Document> {
  // TODO: Chrome 브라우저를 통한 페이지 로딩 구현
  console.log("Chrome-based fetching not implemented yet");
  throw new Error("Chrome-based fetching not implemented yet");
}

export async function fetchData(url: string, vault?: Vault): Promise<ClipData> {
  try {
    const rule = routeUrl(url);
    console.log("Selected rule pattern:", rule.pattern);

    let doc: Document;
    switch (rule.fetchType) {
      case "fetchSimple":
        doc = await fetchSimple(url);
        break;
      case "fetchWithRedirect":
        doc = await fetchWithRedirect(url, rule);
        break;
      case "fetchByChrome":
        doc = await fetchByChrome(url, rule);
        break;
      default:
        doc = await fetchSimple(url);
    }

    // YouTube 비디오인 경우 HTML 저장
    if (rule.pattern === "youtube/video" && vault) {
      const videoId = new URL(url).searchParams.get("v");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `@youtube-video_${videoId}_${timestamp}.html`;
      
      // HTML 파일 저장
      await vault.create(filename, doc.documentElement.outerHTML);
      console.log(`Saved HTML to ${filename}`);
    }

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
    console.log("Final content length:", content.innerHTML.length);

    return {
      pattern: rule.pattern,
      properties,
      html: content.innerHTML,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
