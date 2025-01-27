import { App, Plugin, MarkdownView, Notice, TFile, TFolder } from 'obsidian';
import './styles.css';
import { ClipperData } from './data';
import { fetchData } from './core/html';
// import { createMarkdown } from "./core/markdown";
import { saveMarkdownToVault } from './core/vault';
// import { sanitizeName } from "./utils";
import {
  ClipperSettings,
  DEFAULT_SETTINGS,
  // applyTemplate,
  ClipperSettingTab,
} from './settings';

export default class ClipperPlugin extends Plugin {
  settings: ClipperSettings;
  data: ClipperData;

  async onload() {
    console.log('loading plugin');

    await this.loadSettings();
    this.data = new ClipperData();

    // 템플릿 폴더가 없으면 생성
    // await this.ensureTemplateFolder();
    // 템플릿 파일 로드
    await this.loadTemplateFiles();

    this.addRibbonIcon('scissors', 'JOP Clipper', () => {
      this.clipCurrentPage();
    });

    this.addCommand({
      id: 'clip-page',
      name: 'Save Clipping Markdown for URL in Clipboard',
      callback: async () => {
        console.log('Save Clipping Markdown for URL in Clipboard');
        await this.clipCurrentPage();
      },
    });

    this.addCommand({
      id: 'clip-text',
      name: 'Clip Text',
      callback: async () => {
        console.log('clip text command triggered');
        await this.clipSelection();
      },
    });

    this.addSettingTab(new ClipperSettingTab(this.app, this));
  }

  async loadTemplateFiles(): Promise<void> {
    try {
      const folderPath = this.settings.templateFolder;
      console.log('Loading templates from folder:', folderPath);

      // 기존 템플릿 유지 (기본 템플릿)
      const defaultTemplates = DEFAULT_SETTINGS.templates;
      this.settings.templates = { ...defaultTemplates };

      // adapter를 통해 폴더 내용 가져오기
      const result = await this.app.vault.adapter.list(folderPath);
      console.log('Template folder contents:', result);

      // 템플릿 파일 찾기 (마크다운 파일만, '_'로 시작하지 않는 파일)
      const templateFiles = result.files
        .filter((file) => file.endsWith('.md') && !file.split('/').pop()?.startsWith('_'))
        .map((file) => ({
          path: file,
          name: file.split('/').pop() || '',
        }));

      console.log('Template files found:', templateFiles);

      // 폴더에서 찾은 템플릿 추가
      for (const file of templateFiles) {
        const content = await this.app.vault.adapter.read(file.path);
        const templateName = file.name.replace('.md', '');
        this.settings.templates[templateName] = content;
        console.log('Loaded template:', templateName);
      }

      await this.saveSettings();
    } catch (error) {
      // 에러가 발생해도 기본 템플릿은 유지
      console.error('Failed to load template files:', error);
      new Notice('Failed to load template files. Check the console for details.');
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

  async clipCurrentPage() {
    try {
      // 클립보드에서 URL 가져오기
      const url = await navigator.clipboard.readText();
      console.log('URL from clipboard:', url);

      // 데이터 가져오기
      const data = await fetchData(url);
      console.log('Fetched data:', data);

      // 템플릿 선택
      const template = this.settings.templates[data.pattern] || this.settings.templates[this.settings.defaultTemplate];

      // 마크다운으로 저장
      const file = await saveMarkdownToVault(this.app, data.pattern, data.properties, data.html, template);

      // 성공 메시지
      new Notice(`Saved to ${file.path}`);
    } catch (error) {
      console.error('Error clipping page:', error);
      new Notice('Failed to clip page. Check the console for details.');
    }
  }

  private async clipSelection() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      const editor = view.editor;
      const selection = editor.getSelection();
      if (selection) {
        console.log('선택된 텍스트:', selection);
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
        this.settings.defaultTemplate = templates.length > 0 ? templates[0] : 'web-default';
      }

      await this.saveSettings();
    }
  }

  async addTemplate(templateName: string, content: string): Promise<void> {
    if (templateName.startsWith('_')) {
      throw new Error("Template name cannot start with '_'");
    }

    try {
      // 1. 파일 시스템에 템플릿 파일 저장
      const folderPath = this.settings.templateFolder;
      const filePath = `${folderPath}/${templateName}.md`;
      await this.app.vault.adapter.write(filePath, content);
      console.log('Template file saved to:', filePath);

      // 2. 설정에 템플릿 추가
      this.settings.templates[templateName] = content;
      await this.saveSettings();

      // 3. Vault 새로고침
      // @ts-ignore: index 프로퍼티가 private이지만 필요한 경우 사용
      await this.app.vault.adapter.index?.indexAll();
      console.log('Vault refreshed');

      console.log('Template added successfully:', {
        name: templateName,
        path: filePath,
        content: content,
      });
    } catch (error) {
      console.error('Failed to add template:', error);
      throw error;
    }
  }
}
