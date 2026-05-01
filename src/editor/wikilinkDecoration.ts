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
    // Use mousedown (not click) so we fire before CM6 moves the cursor,
    // which would otherwise rebuild decorations and remove cm-wikilink from the span.
    mousedown(event: MouseEvent, view: EditorView) {
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (pos === null) return false;

      const line = view.state.doc.lineAt(pos);
      WIKILINK_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = WIKILINK_RE.exec(line.text)) !== null) {
        const start = line.from + m.index;
        const end = start + m[0].length;
        if (pos >= start && pos <= end) {
          const inner = m[1];
          const linkText = inner.includes('|') ? inner.split('|')[0] : inner;
          void app.workspace.openLinkText(linkText.trim(), getSourcePath());
          event.preventDefault();
          return true;
        }
      }
      return false;
    },
  });
}
