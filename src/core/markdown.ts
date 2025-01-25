import TurndownService from "turndown";

interface ClipProperties {
  title: string;
  url: string;
  author: string;
  date: string;
  tags: string[];
  created: string;
  [key: string]: any;
}

const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

function createFrontMatter(properties: ClipProperties): string {
  const frontMatter = ["---"];

  // 필수 속성들을 순서대로 추가
  frontMatter.push(`title: "${properties.title}"`);
  frontMatter.push(`url: "${properties.url}"`);
  frontMatter.push(`author: "${properties.author}"`);
  frontMatter.push(`date: "${properties.date}"`);
  frontMatter.push(`created: "${properties.created}"`);

  // tags는 배열이므로 특별 처리
  frontMatter.push(`tags: [${properties.tags.join(", ")}]`);

  // 추가 속성이 있다면 처리
  Object.entries(properties).forEach(([key, value]) => {
    if (!["title", "url", "author", "date", "tags", "created"].includes(key)) {
      if (Array.isArray(value)) {
        frontMatter.push(`${key}: [${value.join(", ")}]`);
      } else if (typeof value === "string") {
        frontMatter.push(`${key}: "${value}"`);
      } else {
        frontMatter.push(`${key}: ${value}`);
      }
    }
  });

  frontMatter.push("---", "", "");
  return frontMatter.join("\n");
}

function createYoutubeMarkdown(properties: ClipProperties, html: string): string {
  const markdown = turndownService.turndown(html);
  const frontMatter = createFrontMatter(properties);

  // YouTube 영상 임베드 추가
  const videoId = new URL(properties.url).searchParams.get("v");
  const embed = videoId ? `\n![[${videoId}]]\n` : "";

  return frontMatter + embed + markdown;
}

function createTistoryMarkdown(properties: ClipProperties, html: string): string {
  const markdown = turndownService.turndown(html);
  const frontMatter = createFrontMatter(properties);
  return frontMatter + markdown;
}

function createDefaultMarkdown(properties: ClipProperties, html: string): string {
  const markdown = turndownService.turndown(html);
  const frontMatter = createFrontMatter(properties);
  return frontMatter + markdown;
}

export function createMarkdown(pattern: string, properties: ClipProperties, html: string): string {
  try {
    switch (pattern) {
      case "youtube":
        return createYoutubeMarkdown(properties, html);
      case "tistory":
        return createTistoryMarkdown(properties, html);
      default:
        return createDefaultMarkdown(properties, html);
    }
  } catch (error) {
    console.error("Error converting to Markdown:", error);
    throw error;
  }
}

/**
 * HTML을 Markdown으로 변환하는 함수
 */
export function convHtmlToMarkdown(html: string): string {
  try {
    const markdown = turndownService.turndown(html);
    return markdown;
  } catch (error) {
    console.error("Error converting HTML to Markdown:", error);
    throw error;
  }
}
