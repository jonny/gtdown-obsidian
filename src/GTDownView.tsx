import { TextFileView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";

export const GTDOWN_VIEW_TYPE = "gtdown-view";

export class GTDownView extends TextFileView {
  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return GTDOWN_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.file?.basename ?? "GTDown";
  }

  getIcon(): string {
    return "check-square";
  }

  // Called by Obsidian when file content is loaded or the file changes on disk
  setViewData(data: string, clear: boolean): void {
    this.render();
  }

  // Called by Obsidian when it wants to save — return current content
  getViewData(): string {
    return this.data;
  }

  // Called when the view is cleared (e.g. switching files)
  clear(): void {
    this.render();
  }

  private render(): void {
    if (!this.root) return;
    this.root.render(
      <div style={{ padding: "1rem", fontFamily: "monospace" }}>
        <strong>GTDown — {this.file?.name ?? "no file"}</strong>
        <pre style={{ marginTop: "0.5rem", fontSize: "0.85em", whiteSpace: "pre-wrap" }}>
          {this.data ?? ""}
        </pre>
      </div>
    );
  }

  async onOpen(): Promise<void> {
    this.root = createRoot(this.containerEl.children[1] as HTMLElement);
    this.render();
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
    this.root = null;
  }
}
