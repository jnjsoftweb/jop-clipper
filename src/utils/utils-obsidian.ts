import { App, TFile } from "obsidian";

export const getFilesInFolder = async (app: App, folderPath: string) => {
  return await app.vault.adapter.list(folderPath);
};

// 재귀적으로 모든 파일 가져오기
const getAllFiles = async (app: App, folder: any) => {
  return await app.vault.adapter.list('');
};


// // 사용 예시
// const options = {
//   extensions: ['md', 'txt'], // markdown과 텍스트 파일만
//   recursive: true,
//   excludeSubfolders: ['archive', 'temp']
// };

// const folderPath = "Documents/Notes/";
// const files = await getFilesInFolder(folderPath, options);
// files.forEach(file => {
//   console.log(`파일명: ${file.name}, 경로: ${file.path}`);
// });