import { App, TFile } from 'obsidian';
import { ClipProperties } from '../types';
import { createMarkdown } from './markdown';
import { applyTemplate } from '../settings';

const saveMarkdownToVault = async (
  app: App,
  pattern: string,
  properties: ClipProperties,
  html: string,
  template: string
): Promise<TFile> => {
  try {
    // 마크다운 생성
    const markdown = await createMarkdown(pattern, properties, html);

    // 템플릿 적용
    const content = applyTemplate(template, properties, markdown);

    // 파일명 생성 (title 기반)
    const fileName = `${properties.title}.md`;

    // 파일 저장
    const file = await app.vault.create(fileName, content);
    return file;
  } catch (error) {
    console.error('Error saving markdown to vault:', error);
    throw error;
  }
};

export { saveMarkdownToVault };
