import { App, Plugin, MarkdownView, Notice, TFile, TFolder } from "obsidian";
import "./styles.css";
import { ClipperData } from "./data";
import { fetchData } from "./core/html";
import { createMarkdown } from "./core/markdown";
import { saveMarkdownToVault } from "./core/vault";
import { sanitizeName, getFilesInFolder } from "./utils";
import { 
  ClipperSettings, 
  DEFAULT_SETTINGS, 
  applyTemplate, 
  ClipperSettingTab 
} from "./settings";

export default class ClipperPlugin extends Plugin {
  settings: ClipperSettings;
  data: ClipperData;

  async onload() {
    console.log("loading plugin");

    await this.loadSettings();
    this.data = new ClipperData();

    // 템플릿 폴더가 없으면 생성
    await this.ensureTemplateFolder();
    // 템플릿 파일 로드
    await this.loadTemplateFiles();

    this.addRibbonIcon("scissors", "JOP Clipper", () => {
      this.clipCurrentPage();
    });

    this.addCommand({
      id: "clip-page",
      name: "Save Clipping Markdown for URL in Clipboard",
      callback: async () => {
        console.log("Save Clipping Markdown for URL in Clipboard");
        await this.clipCurrentPage();
      },
    });

    this.addCommand({
      id: "clip-text",
      name: "Clip Text",
      callback: async () => {
        console.log("clip text command triggered");
        await this.clipSelection();
      },
    });

    this.addSettingTab(new ClipperSettingTab(this.app, this));
  }

  async ensureTemplateFolder(): Promise<void> {
    const folderPath = this.settings.templateFolder;
    console.log("Ensuring template folder exists:", folderPath);
    
    // vault가 준비될 때까지 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result = await getFilesInFolder(this.app, folderPath);
    console.log("Files and folders in vault:", {
      files: result.files.length,
      folders: result.folders.length
    });

    try {
      // 폴더 경로가 이미 존재하는지 확인
      const exists = result.folders.includes(folderPath);
      if (!exists) {
        console.log("Creating template folder:", folderPath);
        try {
          await this.app.vault.adapter.mkdir(folderPath);
          console.log("Template folder created successfully");
        } catch (error) {
          console.error("Error creating folder:", error);
          throw error;
        }
      } else {
        console.log("Template folder already exists");
      }
    } catch (error) {
      console.error("Failed to create template folder:", error);
      throw error;
    }
  }

  async loadTemplateFiles(): Promise<void> {
    try {
      const folderPath = this.settings.templateFolder;
      console.log("Loading templates from folder:", folderPath);

      
      // 기존 템플릿 유지 (기본 템플릿)
      const defaultTemplates = DEFAULT_SETTINGS.templates;
      this.settings.templates = { ...defaultTemplates };

      // 폴더 존재 여부 확인
      const folder = this.app.vault.getAbstractFileByPath(folderPath);
      if (!folder || !(folder instanceof TFolder)) {
        console.log("Template folder not found or not a folder:", folderPath);
        await this.ensureTemplateFolder();
        return;
      }

      // 폴더 내용 로깅
      console.log("Template folder contents:", {
        path: folder.path,
        name: folder.name,
        children: folder.children.map(child => ({
          path: child.path,
          name: child.name,
          type: child instanceof TFolder ? "folder" : "file",
          extension: child instanceof TFile ? child.extension : undefined
        }))
      });

      // 템플릿 파일 찾기 (폴더의 직접적인 자식 파일들만)
      const templateFiles = folder.children
        .filter(child => 
          child instanceof TFile && 
          child.extension === 'md' && 
          !child.name.startsWith('_')
        ) as TFile[];

      console.log("Template files found:", templateFiles.map(f => ({
        path: f.path,
        name: f.name,
        extension: f.extension
      })));

      // 폴더에서 찾은 템플릿 추가
      for (const file of templateFiles) {
        const content = await this.app.vault.read(file);
        const templateName = file.basename;
        this.settings.templates[templateName] = content;
        console.log("Loaded template:", templateName);
      }

      await this.saveSettings();
    } catch (error) {
      // 에러가 발생해도 기본 템플릿은 유지
      console.error("Failed to load template files:", error);
      new Notice("Failed to load template files. Check the console for details.");
    }
  }

  async saveTemplateFile(templateName: string, content: string): Promise<void> {
    const folderPath = this.settings.templateFolder;
    const normalizedPath = folderPath.startsWith('/') ? folderPath : '/' + folderPath;
    const filePath = `${normalizedPath}/${templateName}.md`;
    const existingFile = this.app.vault.getAbstractFileByPath(filePath);

    if (existingFile instanceof TFile) {
      await this.app.vault.modify(existingFile, content);
    } else {
      await this.app.vault.create(filePath, content);
    }
  }

  private async clipCurrentPage() {
    try {
      const url = await navigator.clipboard.readText();
      if (!url.startsWith("http")) {
        throw new Error("Invalid URL in clipboard");
      }

      const { pattern, properties, html } = await fetchData(url, this.app.vault);
      const markdown = createMarkdown(pattern, properties, html);
      const filename = sanitizeName(properties.title);

      // 패턴에 맞는 템플릿 선택 또는 기본 템플릿 사용
      const template = this.settings.templates[pattern] || this.settings.templates[this.settings.defaultTemplate];

      await saveMarkdownToVault(this.app, markdown, filename, "Clippings", properties, template);

      new Notice("Page clipped successfully!");
    } catch (error) {
      console.error("Error clipping page:", error);
      new Notice(`Failed to clip page: ${error.message}`);
    }
  }

  private async clipSelection() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      const editor = view.editor;
      const selection = editor.getSelection();
      if (selection) {
        console.log("선택된 텍스트:", selection);
      }
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async deleteTemplate(templateName: string): Promise<void> {
    const folderPath = this.settings.templateFolder;
    const normalizedPath = folderPath.startsWith('/') ? folderPath : '/' + folderPath;
    const filePath = `${normalizedPath}/${templateName}.md`;
    const newFilePath = `${normalizedPath}/_${templateName}.md`;
    const file = this.app.vault.getAbstractFileByPath(filePath);

    if (file instanceof TFile) {
      await this.app.vault.rename(file, newFilePath);
      delete this.settings.templates[templateName];
      
      // 기본 템플릿이 삭제된 경우 다른 템플릿으로 변경
      if (this.settings.defaultTemplate === templateName) {
        const templates = Object.keys(this.settings.templates);
        this.settings.defaultTemplate = templates.length > 0 ? templates[0] : "web-default";
      }
      
      await this.saveSettings();
    }
  }

  async addTemplate(templateName: string, content: string): Promise<void> {
    if (templateName.startsWith('_')) {
      throw new Error("Template name cannot start with '_'");
    }
    
    await this.saveTemplateFile(templateName, content);
    this.settings.templates[templateName] = content;
    await this.saveSettings();
  }
}
