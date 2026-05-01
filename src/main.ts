import { Notice, Plugin, TFile } from "obsidian";
import { GTDownView, GTDOWN_VIEW_TYPE } from "./GTDownView";

export default class GTDownPlugin extends Plugin {
  onload(): Promise<void> {
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
              void leaf.setViewState({
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
      name: "New file",
      callback: async () => {
        const path = await this.unusedPath("Untitled.gtd");
        await this.app.vault.create(path, "Inbox:\n\t- \n");
        await this.openGtdPath(path);
      },
    });

    this.addCommand({
      id: "import-gtd-file",
      name: "Import file",
      callback: () => this.importGtdFile(),
    });
    return Promise.resolve();
  }

  onunload() {}

  private importGtdFile(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []).filter((f) => {
        if (f.name.endsWith(".gtd")) return true;
        new Notice(`Skipped "${f.name}" — not a .gtd file`);
        return false;
      });
      for (const f of files) {
        const content = await f.text();
        const path = await this.unusedPath(f.name);
        await this.app.vault.create(path, content);
        await this.openGtdPath(path);
      }
    };
    input.click();
  }

  private async openGtdPath(path: string): Promise<void> {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({
      type: GTDOWN_VIEW_TYPE,
      state: { file: path },
      active: true,
    });
  }

  // Returns a vault path that doesn't already exist, appending -1, -2 etc if needed.
  // Checks both the vault registry and the filesystem to catch files that exist on
  // disk but aren't indexed (e.g. copied externally before the plugin was active).
  private async unusedPath(filename: string): Promise<string> {
    const dot = filename.lastIndexOf(".");
    const base = dot >= 0 ? filename.slice(0, dot) : filename;
    const ext = dot >= 0 ? filename.slice(dot) : "";
    let path = filename;
    let n = 1;
    while (
      this.app.vault.getAbstractFileByPath(path) ||
      (await this.app.vault.adapter.exists(path))
    ) {
      path = `${base}-${n}${ext}`;
      n++;
    }
    return path;
  }
}
