import { PatternRule, ClipProperties } from "../types";

export const DefaultProperties: ClipProperties = {
  title: "Untitled",
  url: "",
  author: "",
  date: "",
  description: "",
  tags: [],
  created: "",
};

export const DefaultRule: PatternRule = {
  pattern: "webpage",
  urlPatterns: ["*"],
  fetchType: "fetchSimple",
  properties: {
    title: {
        selector: "title",
        attribute: "text",
    },
    author: {
        selector: "meta[name='by']",
        attribute: "content",
    },
    date: {
        selector: "meta[name='date']",
        attribute: "content",
    },
    description: {
        selector: "meta[name='description']",
        attribute: "content",
    },
    tags: {
      value: ["clipping/web"],
    },
    created: {
      callback: "today",
    },
  },
  rootSelector: "body",
  removeSelectors: ["script", "style", "header", "footer", "nav"],
};
