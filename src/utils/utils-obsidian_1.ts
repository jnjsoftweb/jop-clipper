import { App, TFile } from "obsidian";

interface GetFilesOptions {
  extensions?: string[];
  recursive?: boolean;
  excludeSubfolders?: string[];
}

export const getFilesInFolder = (app: App, folderPath: string, options: GetFilesOptions = {}) => {
  const {
    extensions = [], // 특정 확장자만 필터링
    recursive = true, // 하위 폴더 포함 여부
    excludeSubfolders = [] // 제외할 하위 폴더
  } = options;

  // 경로 정규화
  const normalizedPath = folderPath === '/' ? '' : folderPath;
  console.log('Searching in folder:', normalizedPath || 'root');

  const files = app.vault.getFiles();
  console.log('Total files in vault:', files.length);

  const folderFiles = files.filter(file => {
    // 루트 폴더인 경우 모든 파일 포함
    if (normalizedPath === '') {
      // 제외할 하위 폴더 체크
      if (excludeSubfolders.some(subfolder => file.path.startsWith(subfolder + '/'))) {
        return false;
      }
      // 재귀 검색이 비활성화된 경우 최상위 파일만 포함
      if (!recursive && file.path.includes('/')) {
        return false;
      }
      // 확장자 필터링
      if (extensions.length > 0) {
        return extensions.includes(file.extension.toLowerCase());
      }
      return true;
    }

    // 특정 폴더 검색
    if (!file.path.startsWith(normalizedPath)) {
      return false;
    }

    // 재귀 검색이 비활성화된 경우 직계 파일만 포함
    if (!recursive) {
      const relativePath = file.path.slice(normalizedPath.length);
      if (relativePath.includes('/')) {
        return false;
      }
    }

    // 제외할 하위 폴더 체크
    if (excludeSubfolders.some(subfolder => 
      file.path.startsWith(normalizedPath + '/' + subfolder + '/'))) {
      return false;
    }

    // 확장자 필터링
    if (extensions.length > 0) {
      const fileExt = file.extension.toLowerCase();
      return extensions.includes(fileExt);
    }

    return true;
  });

  console.log('Found files:', folderFiles.length);
  return folderFiles;
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