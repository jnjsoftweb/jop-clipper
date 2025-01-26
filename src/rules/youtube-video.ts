import { PatternRule } from "../types";

const YoutubeVideoRule: PatternRule = {
  pattern: "youtube/video",
  urlPatterns: ["youtube.com/watch", "youtu.be"],
  fetchType: "fetchSimple",
  properties: {
    title: {
      selector: "meta[property='og:title']",
      attribute: "content",
      callback: "sanitizeName",
    },
    author: {
      selector: "link[itemprop='name']",
      attribute: "content",
    },
    published: {
      selector: "meta[itemprop='datePublished']",
      attribute: "content",
      callback: "formatDate",
    },
    clipped: {
      callback: "today",
    },
    description: {
      selector: "script",
      attribute: "text",
      callback: "extractYoutubeDescription",
    },
    tags: {
      selector: "script",
      attribute: "text",
      callback: "extractYoutubeTags",
      value: ["clipping/youtube/video"],
    }
  },
  rootSelector: "#player",
  removeSelectors: [
    "script", 
    "style",
    "#secondary",
    "#comments",
    "#related",
  ],
  preFrontmatter: "preFrontmatter_youtube",
  postMarkdown: "postMarkdown_youtube"
}; 

export {
  YoutubeVideoRule,
}; 