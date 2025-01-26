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
    date: {
      selector: "meta[itemprop='datePublished']",
      attribute: "content",
      callback: "formatDate",
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
    },
    created: {
      callback: "today",
    },
    rawHtml: {
      selector: "html",
      attribute: "outerHTML",
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
}; 

export {
  YoutubeVideoRule,
}; 