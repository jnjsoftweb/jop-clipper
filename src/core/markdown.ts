import TurndownService from "turndown";

interface ClipProperties {
  title?: string;
  url: string;
  author?: string;
  date?: string;
  tags?: string[];
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

  if (properties.title) frontMatter.push(`title: "${properties.title}"`);
  if (properties.url) frontMatter.push(`url: "${properties.url}"`);
  if (properties.author) frontMatter.push(`author: "${properties.author}"`);
  if (properties.date) frontMatter.push(`date: "${properties.date}"`);
  if (properties.tags && properties.tags.length > 0) {
    frontMatter.push(`tags: [${properties.tags.join(", ")}]`);
  }

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

export function createMarkdown(clipType: string, properties: ClipProperties, html: string): string {
  try {
    switch (clipType) {
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
