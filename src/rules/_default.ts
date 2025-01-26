import { PatternRule, ClipProperties } from "../types";

const DefaultProperties: ClipProperties = {
  title: "Untitled",
  url: "",
  author: "",
  date: "",
  description: "",
  tags: [],
  created: "",
};

const DefaultRule: PatternRule = {
  pattern: "webpage",
  urlPatterns: ["*"],
  fetchType: "fetchSimple",
  properties: {
    title: {
      selector: "meta[property='og:title']",
      attribute: "content",
    },
    author: {
      selector: "meta[name='author']",
      attribute: "content",
    },
    date: {
      selector: "meta[property='article:published_time']",
      attribute: "content",
      callback: "formatDate",
    },
    description: {
      selector: "meta[property='og:description']",
      attribute: "content",
    },
    tags: {
      value: ["clipping/webpage"],
    },
    created: {
      callback: "today",
    },
  },
  rootSelector: "body",
  removeSelectors: ["script", "style"],
} as const;

export {
  DefaultProperties,
  DefaultRule,
};
