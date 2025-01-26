import { PatternRule } from "../types";

const BlogTistoryRule: PatternRule = {
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
    published: {
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
    clipped: {
      callback: "today",
    },
  },
  rootSelector: ".tt_article_useless_p_margin",
  removeSelectors: ["script", "style"],
}; 

export {
  BlogTistoryRule,
}; 