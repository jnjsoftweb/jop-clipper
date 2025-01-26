import { App, TFile } from "obsidian";

export const getFilesInFolder = async (app: App, folderPath: string) => {
  console.log('Getting all files in vault');
  
  // vault 정보 출력
  console.log('Vault info:', {
    adapter: app.vault.adapter.getName(),
    configDir: app.vault.configDir
  });

  try {
    // adapter를 통해 파일 목록 가져오기
    const files = await app.vault.adapter.list('');
    console.log('Files from adapter:', files);
    
    // 파일 정보 출력
    files.files.forEach(filePath => {
      console.log('File path:', filePath);
    });

    // 폴더 정보 출력
    files.folders.forEach(folderPath => {
      console.log('Folder path:', folderPath);
    });

    return files;
  } catch (error) {
    console.error('Error getting files:', error);
    return { files: [], folders: [] };
  }
};

// 재귀적으로 모든 파일 가져오기
const getAllFiles = (folder: any): TFile[] => {
  const files: TFile[] = [];
  
  if (!folder || !folder.children) {
    return files;
  }

  folder.children.forEach((child: any) => {
    if (child instanceof TFile) {
      files.push(child);
    } else {
      files.push(...getAllFiles(child));
    }
  });

  return files;
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