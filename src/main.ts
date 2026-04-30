import { Plugin, TFile } from "obsidian";
import { GTDownView, GTDOWN_VIEW_TYPE } from "./GTDownView";

export default class GTDownPlugin extends Plugin {
  async onload() {
    this.registerView(GTDOWN_VIEW_TYPE, (leaf) => new GTDownView(leaf));
    this.registerExtensions(["gtd"], GTDOWN_VIEW_TYPE);

    // registerExtensions doesn't apply to files detected via the filesystem
    // watcher. Deferred so Obsidian finishes setting up the leaf first.
    this.registerEvent(
      this.app.workspace.on("file-open", (file: TFile | null) => {
        if (!file || file.extension !== "gtd") return;
        setTimeout(() => {
          this.app.workspace.iterateAllLeaves((leaf) => {
            const state = leaf.getViewState();
            if (
              state.state?.file === file.path &&
              leaf.view.getViewType() !== GTDOWN_VIEW_TYPE
            ) {
              leaf.setViewState({
                type: GTDOWN_VIEW_TYPE,
                state: { file: file.path },
                active: true,
              });
            }
          });
        }, 0);
      })
    );

    this.addCommand({
      id: "new-gtd-file",
      name: "New GTDown file",
      callback: async () => {
        const path = this.unusedPath("Untitled.gtd");
        const file = await this.app.vault.create(path, "Inbox:\n\t- \n");
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file);
      },
    });

    this.addCommand({
      id: "import-gtd-file",
      name: "Import GTDown file",
      callback: () => this.importGtdFile(),
    });
  }

  onunload() {}

  private async importGtdFile(): Promise<void> {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".gtd";
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
      for (const f of files) {
        const content = await f.text();
        const path = this.unusedPath(f.name);
        const created = await this.app.vault.create(path, content);
        const leaf = this.app.workspace.getLeaf(files.length === 1 ? false : true);
        await leaf.openFile(created);
      }
    };
    input.click();
  }

  // Returns a vault path that doesn't already exist, appending -1, -2 etc if needed.
  private unusedPath(filename: string): string {
    const dot = filename.lastIndexOf(".");
    const base = dot >= 0 ? filename.slice(0, dot) : filename;
    const ext = dot >= 0 ? filename.slice(dot) : "";
    let path = filename;
    let n = 1;
    while (this.app.vault.getAbstractFileByPath(path)) {
      path = `${base}-${n}${ext}`;
      n++;
    }
    return path;
  }
}
