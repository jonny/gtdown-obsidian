import { Plugin, TFile } from "obsidian";
import { GTDownView, GTDOWN_VIEW_TYPE } from "./GTDownView";

export default class GTDownPlugin extends Plugin {
  async onload() {
    this.registerView(GTDOWN_VIEW_TYPE, (leaf) => new GTDownView(leaf));
    this.registerExtensions(["gtd"], GTDOWN_VIEW_TYPE);

    // Explicitly set view type for .gtd files — registerExtensions alone doesn't
    // reliably redirect externally copied files that Obsidian treated as unknown types.
    this.registerEvent(
      this.app.workspace.on("file-open", (file: TFile | null) => {
        if (!file || file.extension !== "gtd") return;
        const leaf = this.app.workspace.getMostRecentLeaf();
        if (leaf && leaf.view.getViewType() !== GTDOWN_VIEW_TYPE) {
          leaf.setViewState({
            type: GTDOWN_VIEW_TYPE,
            state: { file: file.path },
            active: true,
          });
        }
      })
    );

    this.addCommand({
      id: "new-gtd-file",
      name: "New GTDown file",
      callback: async () => {
        const file = await this.app.vault.create(
          "Untitled.gtd",
          "Inbox:\n\t- \n"
        );
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file);
      },
    });
  }

  onunload() {}
}
