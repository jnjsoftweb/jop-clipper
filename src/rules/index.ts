import { PatternRule } from "../types";
import { BlogTistoryRule } from "./blog-tistory";
import { BlogNaverRule } from "./blog-naver";
import { DefaultRule, DefaultProperties } from "./_default";
import { YoutubeVideoRule } from "./youtube-video";

export const SETTINGS: PatternRule[] = [
  YoutubeVideoRule,
  BlogTistoryRule,
  BlogNaverRule,
];

export { DefaultRule, DefaultProperties };
