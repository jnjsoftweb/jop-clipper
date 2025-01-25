import { App, Plugin, PluginSettingTab, Setting, Command, MarkdownView, Notice } from "obsidian";
import "./styles.css";
import { ClipperData } from "./data";
import { fetchData } from "./core/html";
import { createMarkdown } from "./core/markdown";
import { saveMarkdownToVault } from "./core/vault";
import { sanitizeName } from "./utils";
interface ClipperSettings {
  apiKey: string;
}

const DEFAULT_SETTINGS: ClipperSettings = {
  apiKey: "",
};

export default class ClipperPlugin extends Plugin {
  settings: ClipperSettings;
  data: ClipperData;

  async onload() {
    console.log("loading plugin");

    await this.loadSettings();
    this.data = new ClipperData();

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

  private async clipCurrentPage() {
    try {
      // 클립보드에서 URL 가져오기
      const url = await navigator.clipboard.readText();
      if (!url.startsWith("http")) {
        throw new Error("Invalid URL in clipboard");
      }

      // URL에서 pattern, properties, html 가져오기
      const { pattern, properties, html } = await fetchData(url, this.app.vault);

      // pattern, properties, html에서 Markdown 생성
      const markdown = createMarkdown(pattern, properties, html);

      // 파일 이름 생성
      const filename = sanitizeName(properties.title);

      // Markdown을 볼트에 저장
      await saveMarkdownToVault(this.app, markdown, filename, "Clippings");

      // 성공 메시지 표시
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
}

class ClipperSettingTab extends PluginSettingTab {
  plugin: ClipperPlugin;

  constructor(app: App, plugin: ClipperPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "JOP Clipper Settings" });

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("Enter your API key")
      .addText((text) =>
        text
          .setPlaceholder("Enter your API key")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
