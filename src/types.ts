export interface PropertyRule {
  selector?: string;
  attribute?: string;
  callback?: string;
  value?: string | string[];
}

export interface PatternRule {
  pattern: string;
  urlPatterns: string[];
  fetchType: "fetchSimple" | "fetchWithRedirect" | "fetchByChrome";
  callback?: string;
  properties: {
    [key: string]: PropertyRule;
  };
  rootSelector: string;
  removeSelectors?: string[];
  postHtml?: string;
  postMarkdown?: string;
  preFrontmatter?: string;
}

export interface ClipProperties {
  title: string;
  url: string;
  author: string;
  published: string;
  clipped: string;
  description: string;
  tags: string[];
  [key: string]: any;
}

export interface ClipData {
  pattern: string;
  properties: ClipProperties;
  html: string;
}

export type RedirectCallback = (doc: Document) => Promise<string | null>;
