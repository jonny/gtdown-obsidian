import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";

export const GTDOWN_VIEW_TYPE = "gtdown-view";

export class GTDownView extends ItemView {
  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return GTDOWN_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "GTDown";
  }

  getIcon(): string {
    return "check-square";
  }

  async onOpen(): Promise<void> {
    this.root = createRoot(this.containerEl.children[1] as HTMLElement);
    this.root.render(
      <div style={{ padding: "1rem", fontFamily: "monospace" }}>
        GTDown — coming soon
      </div>
    );
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
  }
}
