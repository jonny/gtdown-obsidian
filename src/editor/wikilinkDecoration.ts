import { Decoration, type DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import type { App } from 'obsidian';

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

function buildWikilinkDecos(view: EditorView): DecorationSet {
  const cursorLine = view.state.doc.lineAt(view.state.selection.main.head).number;
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      if (line.number !== cursorLine) {
        WIKILINK_RE.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = WIKILINK_RE.exec(line.text)) !== null) {
          const start = line.from + m.index;
          const end = start + m[0].length;
          builder.add(start, end, Decoration.mark({ class: 'cm-wikilink' }));
        }
      }
      pos = line.to + 1;
    }
  }

  return builder.finish();
}

export const wikilinkDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = buildWikilinkDecos(view); }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildWikilinkDecos(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);

export function wikilinkClickHandler(app: App, getSourcePath: () => string) {
  return EditorView.domEventHandlers({
    click(event: MouseEvent, view: EditorView) {
      if (!event.metaKey) return false;
      const target = event.target as HTMLElement;
      if (!target.classList.contains('cm-wikilink')) return false;

      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (pos === null) return false;

      const line = view.state.doc.lineAt(pos);
      WIKILINK_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = WIKILINK_RE.exec(line.text)) !== null) {
        const start = line.from + m.index;
        const end = start + m[0].length;
        if (pos >= start && pos <= end) {
          // [[link|display]] → use link part; [[link#heading]] preserved as-is
          const inner = m[1];
          const linkText = inner.includes('|') ? inner.split('|')[0] : inner;
          app.workspace.openLinkText(linkText.trim(), getSourcePath());
          event.preventDefault();
          return true;
        }
      }
      return false;
    },
  });
}
