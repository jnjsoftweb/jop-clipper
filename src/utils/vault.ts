import { App, TFile } from "obsidian";

function cleanMarkdown(text: string): string {
  return text
    .replace(/^\\/, "") // 시작 부분의 백슬래시 제거
    .replace(/\\(?=---)/g, "") // --- 앞의 백슬래시 제거
    .replace(/\\(?=\[)/g, "") // [ 앞의 백슬래시 제거
    .replace(/\\(?=\])/g, "") // ] 앞의 백슬래시 제거
    .replace(/\\(?=-)/g, "") // - 앞의 백슬래시 제거
    .replace(/\\(?=\.)/g, ""); // . 앞의 백슬래시 제거
}

export async function saveMarkdownToVault(app: App, markdown: string, filename: string, folder: string = ""): Promise<TFile> {
  try {
    // 원본 내용 로깅
    console.log("=== Original Content ===");
    console.log(markdown.substring(0, 200));

    // 백슬래시 제거
    const cleanedMarkdown = cleanMarkdown(markdown);

    // 정리된 내용 로깅
    console.log("=== Cleaned Content ===");
    console.log(cleanedMarkdown.substring(0, 200));

    // 파일 경로 생성
    const path = folder ? `${folder}/${filename}.md` : `${filename}.md`;

    // 이미 존재하는 파일인지 확인
    const existingFile = app.vault.getAbstractFileByPath(path);
    if (existingFile) {
      throw new Error(`File already exists: ${path}`);
    }

    // 새 파일 생성
    const file = await app.vault.create(path, cleanedMarkdown);
    console.log("File created:", path);
    return file;
  } catch (error) {
    console.error("Error saving to vault:", error);
    throw error;
  }
}
