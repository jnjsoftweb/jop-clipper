import { requestUrl } from "obsidian";

interface ClipProperties {
  title: string;
  url: string;
  author: string;
  date: string;
  tags: string[];
  created: string;
  [key: string]: any;
}

interface ClipData {
  pattern: string;
  properties: ClipProperties;
  html: string;
}

interface PropertyRule {
  selector?: string;
  attribute?: string;
  callback?: string;
  value?: string | string[];
}

interface PatternRule {
  pattern: string;
  urlPatterns: string[];
  fetchType: "fetchSimple" | "fetchWithRedirect" | "fetchByChrome";
  callback?: string;
  properties: {
    [key: string]: PropertyRule;
  };
  rootSelector: string;
  removeSelectors?: string[];
}

const SETTINGS: PatternRule[] = [
  {
    pattern: "blog/tistory",
    urlPatterns: ["tistory.com"],
    fetchType: "fetchSimple",
    properties: {
      title: {
        selector: "meta[property='og:title']",
        attribute: "content",
      },
      author: {
        selector: "meta[property='og:article:author']",
        attribute: "content",
      },
      date: {
        selector: "meta[property='article:published_time']",
        attribute: "content",
      },
      tags: {
        value: ["clipping/tistory"],
      },
      created: {
        callback: "today",
      },
    },
    rootSelector: ".tt_article_useless_p_margin",
    removeSelectors: [
      "script",
      "style",
      ".another_category",
      ".container_postbtn",
      ".article-footer",
      "#daumSearchBox",
      ".wrap_sub",
      ".revenue_unit_wrap",
      ".article-header",
      ".article-toolbar",
      ".revenue_unit_info",
      "#article-reply",
      "#related-articles",
      ".container_postbtn",
      ".article_author",
      ".article_tag",
      ".sns_btn",
    ],
  },
  {
    pattern: "blog/naver",
    urlPatterns: ["blog.naver.com"],
    fetchType: "fetchWithRedirect",
    callback: "fetchWithRedirect_naverBlog",
    properties: {
      title: {
        selector: "",
        attribute: "text",
      },
      author: {
        selector: "",
        attribute: "text",
      },
      date: {
        selector: "",
        attribute: "text",
      },
      tags: {
        value: ["clipping/naver"],
      },
      created: {
        callback: "today",
      },
    },
    rootSelector: "#postListBody",
    removeSelectors: [
      "script",
      "style",
      ".revenue_unit_wrap",
      ".na_ad",
      ".naver-splugin",
      ".area_reply",
      "#comments",
      ".area_related_post",
      ".area_paging",
      ".area_paging_simple",
      ".area_paging_simple_wrap",
    ],
  },
];

function routeUrl(url: string): PatternRule {
  const hostname = new URL(url).hostname;

  for (const rule of SETTINGS) {
    if (rule.urlPatterns.some((pattern) => hostname.includes(pattern))) {
      return rule;
    }
  }

  // 기본 규칙
  return {
    pattern: "webpage",
    urlPatterns: ["*"],
    fetchType: "fetchSimple",
    properties: {
      title: {
        selector: "h1",
        attribute: "text",
      },
      tags: {
        value: ["webpage"],
      },
      created: {
        callback: "today",
      },
    },
    rootSelector: "body",
    removeSelectors: ["script", "style", "header", "footer", "nav"],
  };
}

function extractProperties(doc: Document, rule: PatternRule, url: string): ClipProperties {
  const properties: ClipProperties = {
    title: "",
    url: url,
    author: "",
    date: "",
    tags: [],
    created: "",
  };

  // 각 속성 추출
  for (const [key, propertyRule] of Object.entries(rule.properties)) {
    // value가 있는 경우 직접 값 사용
    if (propertyRule.value !== undefined) {
      properties[key] = propertyRule.value;
      continue;
    }

    // callback이 있는 경우 실행
    if (propertyRule.callback) {
      properties[key] = executeCallback(propertyRule.callback, "");
      continue;
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
            value = executeCallback(propertyRule.callback, value);
          }
          properties[key] = value;
        }
      }
    }
  }

  return properties;
}

function executeCallback(callbackName: string, value: string): string {
  // callback 함수들을 여기에 구현
  const callbacks: { [key: string]: (value: string) => string } = {
    sanitizeFileName: (v: string) => v.replace(/[\\/:*?"<>|]/g, ""),
    replaceHyphen: (v: string) => v.replace(/-/g, " "),
    today: () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
  };

  // callback이 today인 경우 value 파라미터 무시
  if (callbackName === "today") {
    return callbacks[callbackName]("");
  }

  return callbacks[callbackName]?.(value) ?? value;
}

// callback 함수 타입 정의
type RedirectCallback = (doc: Document) => Promise<string | null>;

// callback 함수 맵
const redirectCallbacks: { [key: string]: RedirectCallback } = {
  fetchWithRedirect_naverBlog: async (doc: Document): Promise<string | null> => {
    const mainFrame = doc.querySelector("#mainFrame") as HTMLIFrameElement;
    if (!mainFrame?.src) return null;

    try {
      const iframeSrc = mainFrame.src;
      const url = new URL(iframeSrc.startsWith("//") ? `https:${iframeSrc}` : iframeSrc);

      const blogId = url.searchParams.get("blogId");
      const logNo = url.searchParams.get("logNo");

      if (blogId && logNo) {
        return `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}&redirect=Dlog&widgetTypeCall=true&directAccess=false`;
      }

      if (!url.href.startsWith("https://blog.naver.com")) {
        const path = url.pathname + url.search;
        return `https://blog.naver.com${path}`;
      }

      return url.href;
    } catch (error) {
      console.error("Error parsing iframe URL:", error);
      const iframeSrc = mainFrame.src;
      if (iframeSrc.startsWith("//")) return `https:${iframeSrc}`;
      if (iframeSrc.startsWith("/")) return `https://blog.naver.com${iframeSrc}`;
      if (!iframeSrc.startsWith("http")) return `https://blog.naver.com/${iframeSrc}`;
      return iframeSrc;
    }
  },
};

async function fetchWithRedirect(url: string, rule: PatternRule): Promise<Document> {
  console.log("Original URL:", url);

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

  console.log("Original response status:", response.status);
  console.log("Original response length:", response.text.length);

  const parser = new DOMParser();
  const doc = parser.parseFromString(response.text, "text/html");

  if (rule.fetchType === "fetchWithRedirect" && rule.callback) {
    const callback = redirectCallbacks[rule.callback];
    if (!callback) {
      throw new Error(`Callback function ${rule.callback} not found`);
    }

    const redirectUrl = await callback(doc);
    console.log("Redirect URL:", redirectUrl);

    if (redirectUrl) {
      console.log("Fetching redirect URL:", redirectUrl);

      const redirectResponse = await requestUrl({
        url: redirectUrl,
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      console.log("Redirect response status:", redirectResponse.status);
      console.log("Redirect response length:", redirectResponse.text.length);

      if (redirectResponse.status !== 200) {
        throw new Error(`HTTP error in redirect! status: ${redirectResponse.status}`);
      }

      const redirectDoc = parser.parseFromString(redirectResponse.text, "text/html");
      console.log("Parsed document body length:", redirectDoc.body.innerHTML.length);
      return redirectDoc;
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

export async function fetchData(url: string): Promise<ClipData> {
  try {
    const rule = routeUrl(url);
    console.log("Selected rule pattern:", rule.pattern);

    const doc = await fetchWithRedirect(url, rule);

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

    // 속성 추출
    const properties = extractProperties(doc, rule, url);
    console.log("Extracted properties:", properties);

    // 빈 값이 아닌 속성만 포함
    const frontmatterProperties: ClipProperties = {
      title: properties.title || "",
      url: properties.url,
      author: properties.author || "",
      date: properties.date || "",
      tags: properties.tags || [],
      created: properties.created || "",
    };

    // 이미지 URL 변환
    const convertedHtml = convertImageUrls(content.innerHTML, rule.pattern);

    return {
      pattern: rule.pattern,
      properties: frontmatterProperties,
      html: convertedHtml,
    };
  } catch (error) {
    console.error("Error fetching URL:", error);
    throw error;
  }
}
