import { PatternRule } from "../types";
import { BlogTistoryRule } from "./blog-tistory";
import { BlogNaverRule, fetchWithRedirect_naverBlog } from "./blog-naver";
import { DefaultRule, DefaultProperties } from "./web-default";
import { YoutubeVideoRule } from "./youtube-video";

const SETTINGS: PatternRule[] = [
  YoutubeVideoRule,
  BlogTistoryRule,
  BlogNaverRule,
];

export { DefaultRule, DefaultProperties, SETTINGS, fetchWithRedirect_naverBlog };
