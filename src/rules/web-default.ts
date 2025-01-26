import { PatternRule, ClipProperties } from "../types";

const DefaultProperties: ClipProperties = {
  title: "Untitled",
  url: "",
  author: "",
  published: "",
  description: "",
  tags: [],
  clipped: "",
};

const WebDefaultRule: PatternRule = {
  pattern: "webpage",
  urlPatterns: ["http://", "https://"],
  fetchType: "fetchSimple",
  properties: {
    title: {
      selector: "meta[property='og:title']",
      attribute: "content",
      callback: "sanitizeName",
    },
    url: {
      selector: "meta[property='og:url']",
      attribute: "content",
    },
    author: {
      selector: "meta[property='article:author']",
      attribute: "content",
      value: "Unknown",
    },
    published: {
      selector: "meta[property='article:published_time']",
      attribute: "content",
      callback: "formatDate",
      value: "1970-01-01",
    },
    description: {
      selector: "meta[property='og:description']",
      attribute: "content",
      value: "",
    },
    tags: {
      value: ["clipping/webpage"],
    },
    clipped: {
      callback: "today",
    },
  },
  rootSelector: "body",
  removeSelectors: [
    "script",
    "style",
    "nav",
    "header",
    "footer",
  ],
} as const;

export {
  DefaultProperties,
  WebDefaultRule,
};
