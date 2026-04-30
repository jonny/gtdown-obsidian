import { autocompletion, type CompletionContext, type CompletionResult, type Completion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import type { App } from 'obsidian';

function makeWikilinkSource(app: App) {
  return (context: CompletionContext): CompletionResult | null => {
    const line = context.state.doc.lineAt(context.pos);
    const textBefore = line.text.slice(0, context.pos - line.from);

    const bracketIdx = textBefore.lastIndexOf('[[');
    if (bracketIdx === -1) return null;
    if (textBefore.slice(bracketIdx + 2).includes(']]')) return null;

    const from = line.from + bracketIdx + 2;
    const files = app.vault.getMarkdownFiles();

    const options: Completion[] = files.map(file => ({
      label: file.basename,
      type: 'text',
      apply: (view: EditorView, _: Completion, from: number, to: number) => {
        view.dispatch({
          changes: { from, to, insert: file.basename + ']]' },
          selection: { anchor: from + file.basename.length + 2 },
        });
      },
    }));

    return { from, options, validFor: /^[^\]]*$/ };
  };
}

export function wikilinkCompletion(app: App) {
  return autocompletion({
    override: [makeWikilinkSource(app)],
    activateOnTyping: true,
    maxRenderedOptions: 20,
  });
}
