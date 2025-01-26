import { App, TFile } from "obsidian";
import { ClipProperties } from "../types";

const DEFAULT_TEMPLATE = `
> {{created}}

{{content}}
`;

const customTemplate = `
> {{created}}

![{{title}}]({{url}})

{{content}}
`;

const applyTemplate = (template: string, properties: ClipProperties, content: string): string => {
  let result = template;
  
  // properties의 모든 키에 대해 {{key}} 패턴을 해당 값으로 치환
  Object.entries(properties).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value?.toString() || "");
  });
  
  // {{content}}를 markdown 본문으로 치환
  result = result.replace(/{{content}}/g, content);
  
  return result;
};

const cleanMarkdown = (text: string): string => {
  return text
    .replace(/^\\/, "") // 시작 부분의 백슬래시 제거
    .replace(/\\(?=---)/g, "") // --- 앞의 백슬래시 제거
    .replace(/\\(?=\[)/g, "") // [ 앞의 백슬래시 제거
    .replace(/\\(?=\])/g, "") // ] 앞의 백슬래시 제거
    .replace(/\\(?=-)/g, "") // - 앞의 백슬래시 제거
    .replace(/\\(?=\.)/g, ""); // . 앞의 백슬래시 제거
};

const saveMarkdownToVault = async (
  app: App, 
  markdown: string, 
  filename: string, 
  folder: string = "",
  properties?: ClipProperties,
  template: string = DEFAULT_TEMPLATE
): Promise<TFile> => {
  try {
    // 원본 내용 로깅
    console.log("=== Original Content ===");
    console.log(markdown.substring(0, 200));

    // frontmatter와 content 분리
    const [frontmatter, content] = markdown.split("---\n\n");
    
    // template 적용
    const templatedContent = properties 
      ? applyTemplate(template, properties, cleanMarkdown(content))
      : cleanMarkdown(content);
    
    // 최종 markdown 생성
    const finalMarkdown = `${frontmatter}---\n\n${templatedContent}`;

    // 정리된 내용 로깅
    console.log("=== Cleaned Content ===");
    console.log(finalMarkdown.substring(0, 200));

    // 파일 경로 생성
    const path = folder ? `${folder}/${filename}.md` : `${filename}.md`;

    // 이미 존재하는 파일인지 확인
    const existingFile = app.vault.getAbstractFileByPath(path);
    if (existingFile) {
      throw new Error(`File already exists: ${path}`);
    }

    // 새 파일 생성
    const file = await app.vault.create(path, finalMarkdown);
    console.log("File created:", path);
    return file;
  } catch (error) {
    console.error("Error saving to vault:", error);
    throw error;
  }
};

export {
  cleanMarkdown,
  saveMarkdownToVault,
};
