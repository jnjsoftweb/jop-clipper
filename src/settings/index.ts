import { App, PluginSettingTab, Setting, Notice, TFile, Modal } from "obsidian";
import { ClipProperties } from "../types";
import type ClipperPlugin from "../main";

export interface ClipperSettings {
  apiKey: string;
  templates: {
    [key: string]: string;
  };
  defaultTemplate: string;
  templateFolder: string;
}

export const DEFAULT_SETTINGS: ClipperSettings = {
  apiKey: "",
  templates: {
    "web-default": `{{content}}`,
    "youtube-video": `{{content}}`
  },
  defaultTemplate: "web-default",
  templateFolder: "93. templates/jop-clipper"
};

export const applyTemplate = (template: string, properties: ClipProperties, content: string): string => {
  let result = template;
  
  // properties의 모든 키에 대해 {{key}} 패턴을 해당 값으로 치환
  Object.entries(properties).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value?.toString() || "");
  });
  
  // {{content}}를 markdown 본문으로 치환
  result = result.replace(/{{content}}/g, content);
  
  return result;
};

export class ClipperSettingTab extends PluginSettingTab {
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

    new Setting(containerEl)
      .setName("Template Folder")
      .setDesc("Folder path for template files")
      .addText((text) =>
        text
          .setPlaceholder("templates")
          .setValue(this.plugin.settings.templateFolder)
          .onChange(async (value) => {
            this.plugin.settings.templateFolder = value;
            await this.plugin.loadTemplateFiles();
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Templates" });

    // 템플릿 추가 버튼
    new Setting(containerEl)
      .setName("Add Template")
      .setDesc("Create a new template")
      .addButton((button) => {
        button
          .setButtonText("Add Template")
          .setCta()
          .onClick(async () => {
            const modal = new AddTemplateModal(this.app, async (templateName, content) => {
              try {
                await this.plugin.addTemplate(templateName, content);
                this.display(); // 설정 화면 새로고침
                new Notice(`Template '${templateName}' added successfully!`);
              } catch (error) {
                new Notice(`Failed to add template: ${error.message}`);
              }
            });
            modal.open();
          });
      });

    // 기본 템플릿 선택
    new Setting(containerEl)
      .setName("Default Template")
      .setDesc("Select the default template to use when no specific template is found")
      .addDropdown((dropdown) => {
        Object.keys(this.plugin.settings.templates).forEach((key) => {
          dropdown.addOption(key, key);
        });
        dropdown.setValue(this.plugin.settings.defaultTemplate);
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultTemplate = value;
          await this.plugin.saveSettings();
        });
      });

    // 각 템플릿 설정
    Object.entries(this.plugin.settings.templates).forEach(([key, value]) => {
      const templateSetting = new Setting(containerEl)
        .setName(`Template: ${key}`)
        .setDesc(`Edit the template for ${key}`)
        .addTextArea((text) => {
          text
            .setPlaceholder("Enter template")
            .setValue(value)
            .onChange(async (value) => {
              this.plugin.settings.templates[key] = value;
              await this.plugin.saveTemplateFile(key, value);
              await this.plugin.saveSettings();
            });
          text.inputEl.rows = 10;
          text.inputEl.cols = 50;
        })
        .addButton((button) => {
          button
            .setButtonText("Delete")
            .setWarning()
            .onClick(async () => {
              const modal = new DeleteTemplateModal(this.app, async (confirmed) => {
                if (confirmed) {
                  await this.plugin.deleteTemplate(key);
                  this.display(); // 설정 화면 새로고침
                  new Notice(`Template '${key}' deleted successfully!`);
                }
              });
              modal.open();
            });
        });
    });
  }
}

export class AddTemplateModal extends Modal {
  constructor(
    app: App,
    private onSubmit: (templateName: string, content: string) => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Add New Template" });

    const nameInputContainer = contentEl.createDiv({ cls: "template-input-container" });
    nameInputContainer.createEl("label", { text: "Template Name:", cls: "template-label" });
    const nameInput = nameInputContainer.createEl("input", {
      type: "text",
      placeholder: "Enter template name",
      cls: "template-input"
    });

    const contentInputContainer = contentEl.createDiv({ cls: "template-input-container" });
    contentInputContainer.createEl("label", { text: "Template Content:", cls: "template-label" });
    const contentInput = contentInputContainer.createEl("textarea", {
      placeholder: "Enter template content",
      cls: "template-input template-content"
    });
    contentInput.rows = 10;
    contentInput.cols = 50;

    const buttonContainer = contentEl.createDiv({ cls: "template-button-container" });
    const submitButton = buttonContainer.createEl("button", {
      text: "Add",
      cls: "mod-cta"
    });
    const cancelButton = buttonContainer.createEl("button", {
      text: "Cancel"
    });

    submitButton.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      const content = contentInput.value.trim();
      
      if (!name) {
        new Notice("Template name is required!");
        return;
      }
      
      this.onSubmit(name, content);
      this.close();
    });

    cancelButton.addEventListener("click", () => {
      this.close();
    });

    this.containerEl.addClass("template-modal");
    contentEl.createEl("style", {
      text: `
        .template-modal .template-input-container {
          margin-bottom: 1rem;
        }
        .template-modal .template-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        .template-modal .template-input {
          width: 100%;
          padding: 0.5rem;
          border-radius: 4px;
          border: 1px solid var(--background-modifier-border);
        }
        .template-modal .template-content {
          min-height: 200px;
          font-family: var(--font-monospace);
        }
        .template-modal .template-button-container {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .template-modal button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
        }
      `
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export class DeleteTemplateModal extends Modal {
  constructor(
    app: App,
    private onConfirm: (confirmed: boolean) => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Delete Template" });
    contentEl.createEl("p", { text: "Are you sure you want to delete this template?" });

    const buttonContainer = contentEl.createDiv();
    const confirmButton = buttonContainer.createEl("button", {
      text: "Delete",
      cls: "mod-warning",
    });
    const cancelButton = buttonContainer.createEl("button", {
      text: "Cancel",
    });

    confirmButton.addEventListener("click", () => {
      this.onConfirm(true);
      this.close();
    });

    cancelButton.addEventListener("click", () => {
      this.onConfirm(false);
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
