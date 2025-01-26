import { PatternRule } from "../types";
import { YoutubeVideoRule } from "./youtube-video";
import { BlogTistoryRule } from "./blog-tistory";
import { WebDefaultRule, DefaultProperties } from "./web-default";
import { BlogNaverRule, fetchWithRedirect_naverBlog } from "./blog-naver";

export const SETTINGS: PatternRule[] = [
  YoutubeVideoRule,
  BlogTistoryRule,
  BlogNaverRule,
  WebDefaultRule,
];

export { 
  WebDefaultRule,
  DefaultProperties,
  fetchWithRedirect_naverBlog,
};
