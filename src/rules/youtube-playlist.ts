import { PatternRule } from "../types";

const YoutubePlaylistRule: PatternRule = {
  pattern: "youtube/playlist",
  urlPatterns: ["youtube.com/playlist"],
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
      value: ["clipping/youtube/playlist"],
    },
    clipped: {
      callback: "today",
    },
  },
  rootSelector: ".tt_article_useless_p_margin",
  removeSelectors: ["script", "style"],
} as const;

export {
  YoutubePlaylistRule,
}; 