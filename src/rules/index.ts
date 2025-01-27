import { PatternRule } from '../types';
import {
  YoutubeVideoRule,
  extractYoutubeDescription,
  extractYoutubeTags,
  preFrontmatter_youtube,
  postMarkdown_youtube,
} from './youtube-video';
import { BlogTistoryRule } from './blog-tistory';
import { WebDefaultRule, DefaultProperties } from './web-default';
import { BlogNaverRule, fetchWithRedirect_naverBlog, postHtml_naver } from './blog-naver';

export const SETTINGS: PatternRule[] = [YoutubeVideoRule, BlogTistoryRule, BlogNaverRule, WebDefaultRule];

export {
  WebDefaultRule,
  DefaultProperties,
  fetchWithRedirect_naverBlog,
  postHtml_naver,
  extractYoutubeDescription,
  extractYoutubeTags,
  preFrontmatter_youtube,
  postMarkdown_youtube,
};
