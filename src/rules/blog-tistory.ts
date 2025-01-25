import { PatternRule } from "../types";

export const BlogTistoryRule: PatternRule = {
  pattern: "blog/tistory",
  urlPatterns: ["tistory.com"],
  fetchType: "fetchSimple",
  properties: {
    title: {
      selector: "meta[property='og:title']",
      attribute: "content",
    },
    author: {
      selector: "meta[name='by']",
      attribute: "content",
    },
    date: {
      selector: "meta[property='article:published_time']",
      attribute: "content",
    },
    description: {
      selector: "meta[property='og:description']",
      attribute: "content",
    },
    tags: {
      value: ["clipping/blog/tistory"],
    },
    created: {
      callback: "today",
    },
  },
  rootSelector: ".tt_article_useless_p_margin",
  removeSelectors: ["script", "style"],
}; 