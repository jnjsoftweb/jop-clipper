import { requestUrl, RequestUrlResponse } from "obsidian";

interface ClipProperties {
  title?: string;
  url: string;
  author?: string;
  date?: string;
  tags?: string[];
  [key: string]: any; // 추가 속성을 위한 인덱스 시그니처
}

interface ClipData {
  clipType: string;
  properties: ClipProperties;
  html: string;
}

interface ParseRule {
  selector: string;
  titleSelector: string;
  authorSelector?: string;
  dateSelector?: string;
  removeSelectors?: string[];
  clipType: string;
}

const PARSE_RULES: { [key: string]: ParseRule } = {
  "tistory.com": {
    clipType: "tistory",
    selector: ".tt_article_useless_p_margin",
    titleSelector: ".title",
    authorSelector: ".author",
    dateSelector: ".date",
    removeSelectors: ["script", "style", ".another_category", ".container_postbtn", ".article-footer", "#daumSearchBox", ".wrap_sub", ".revenue_unit_wrap"],
  },
  "youtube.com": {
    clipType: "youtube",
    selector: "#content",
    titleSelector: "h1.title",
    authorSelector: "#channel-name",
    dateSelector: "#info-strings",
    removeSelectors: ["script", "style", "#comments", "#related", "#chat"],
  },
  default: {
    clipType: "webpage",
    selector: "body",
    titleSelector: "h1",
    removeSelectors: ["script", "style", "header", "footer", "nav"],
  },
};

function routeUrl(url: string): ParseRule {
  const hostname = new URL(url).hostname;

  // YouTube 도메인 처리
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    return PARSE_RULES["youtube.com"];
  }

  // 다른 도메인 처리
  for (const domain of Object.keys(PARSE_RULES)) {
    if (hostname.includes(domain)) {
      return PARSE_RULES[domain];
    }
  }

  return PARSE_RULES.default;
}

function extractProperties(doc: Document, rule: ParseRule, url: string): ClipProperties {
  const properties: ClipProperties = {
    url: url,
    tags: [rule.clipType],
  };

  // 제목 추출
  const titleElement = doc.querySelector(rule.titleSelector);
  if (titleElement?.textContent) {
    properties.title = titleElement.textContent.trim();
  }

  // 작성자 추출
  if (rule.authorSelector) {
    const authorElement = doc.querySelector(rule.authorSelector);
    if (authorElement?.textContent) {
      properties.author = authorElement.textContent.trim();
    }
  }

  // 날짜 추출
  if (rule.dateSelector) {
    const dateElement = doc.querySelector(rule.dateSelector);
    if (dateElement?.textContent) {
      properties.date = dateElement.textContent.trim();
    }
  }

  return properties;
}

export async function fetchData(url: string): Promise<ClipData> {
  try {
    const response: RequestUrlResponse = await requestUrl({
      url: url,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rule = routeUrl(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(response.text, "text/html");

    // 불필요한 요소 제거
    if (rule.removeSelectors) {
      rule.removeSelectors.forEach((selector) => {
        doc.querySelectorAll(selector).forEach((element) => {
          element.remove();
        });
      });
    }

    // 본문 컨텐츠 추출
    const content = doc.querySelector(rule.selector);
    if (!content) {
      throw new Error(`Content not found with selector: ${rule.selector}`);
    }

    // 속성 추출
    const properties = extractProperties(doc, rule, url);

    return {
      clipType: rule.clipType,
      properties: properties,
      html: content.innerHTML,
    };
  } catch (error) {
    console.error("Error fetching URL:", error);
    throw error;
  }
}
