import { TextFileView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { GTDownApp } from "./GTDownApp";

export const GTDOWN_VIEW_TYPE = "gtdown-view";

export class GTDownView extends TextFileView {
  private root: Root | null = null;
  private updateContent: ((content: string) => void) | null = null;
  private currentContent = "";

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string { return GTDOWN_VIEW_TYPE; }
  getDisplayText(): string { return this.file?.basename ?? "GTDown"; }
  getIcon(): string { return "check-square"; }

  // Called by Obsidian when the file is loaded or reloaded from disk
  setViewData(data: string, _clear: boolean): void {
    this.currentContent = data;
    this.updateContent?.(data);
  }

  // Called by Obsidian when it wants to write the file
  getViewData(): string {
    return this.currentContent;
  }

  // Called when the view is cleared (e.g. switching to a different file)
  clear(): void {
    this.currentContent = "";
    this.updateContent?.("");
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.addClass("gtdown-root");
    this.root = createRoot(container);
    this.root.render(
      <GTDownApp
        onReady={(setter) => { this.updateContent = setter; }}
        onContentChange={(content) => {
          this.currentContent = content;
          this.requestSave();
        }}
      />
    );
  }

  async onClose(): Promise<void> {
    this.updateContent = null;
    this.root?.unmount();
    this.root = null;
  }
}
