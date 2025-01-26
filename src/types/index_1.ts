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
  properties: Record<string, PropertyRule>;
  rootSelector: string;
  removeSelectors: string[];
  replaceHtml?: string;
}

export interface ClipProperties {
  title: string;
  url: string;
  author?: string;
  date?: string;
  created?: string;
  tags?: string[];
  description?: string;
  [key: string]: string | string[] | undefined;
}

export interface ClipData {
  pattern: string;
  properties: ClipProperties;
  html: string;
}

export type RedirectCallback = (doc: Document) => Promise<string | null>;
