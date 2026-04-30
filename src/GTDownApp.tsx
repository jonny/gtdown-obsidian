import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { EditorView } from '@codemirror/view';
import { TodoEditor } from './editor/TodoEditor';
import { Sidebar } from './Sidebar';
import { setFilterEffect, setHashFilterEffect, setProjectFilterEffect } from './editor/tagFilter';
import { isProjectLine } from './editor/projectDecoration';

interface Props {
  onReady: (setContent: (c: string) => void) => void;
  onContentChange: (c: string) => void;
}

export function GTDownApp({ onReady, onContentChange }: Props) {
  const [content, setContent] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [hashFilterTags, setHashFilterTags] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    onReady(setContent);
  // onReady is stable (passed from GTDownView constructor scope) — no dep needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { projects, allTags, allHashtags } = useMemo(() => {
    const projectList: Array<{ name: string; lineNum: number }> = [];
    const tagSet = new Set<string>();
    const hashSet = new Set<string>();
    content.split('\n').forEach((line, i) => {
      if (isProjectLine(line))
        projectList.push({ name: line.replace(/:\s*$/, '').trim(), lineNum: i + 1 });
      for (const m of line.matchAll(/@([\w-]+)/g)) tagSet.add('@' + m[1]);
      for (const m of line.matchAll(/#([\w-]+)/g)) hashSet.add('#' + m[1]);
    });
    return { projects: projectList, allTags: [...tagSet].sort(), allHashtags: [...hashSet].sort() };
  }, [content]);

  const handleSetFilter = useCallback((tag: string) => {
    setFilterTags(prev => {
      const next = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
      editorViewRef.current?.dispatch({ effects: setFilterEffect.of(next) });
      return next;
    });
  }, []);

  const handleSetHashFilter = useCallback((tag: string) => {
    setHashFilterTags(prev => {
      const next = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
      editorViewRef.current?.dispatch({ effects: setHashFilterEffect.of(next) });
      return next;
    });
  }, []);

  const handleSetProjectFilter = useCallback((project: string | null) => {
    setProjectFilter(project);
    editorViewRef.current?.dispatch({ effects: setProjectFilterEffect.of(project) });
  }, []);

  const handleChange = useCallback((c: string) => {
    setContent(c);
    onContentChange(c);
  }, [onContentChange]);

  return (
    <div className="gtdown-layout">
      <Sidebar
        projects={projects}
        tags={allTags}
        hashtags={allHashtags}
        activeFilter={filterTags}
        activeHashFilter={hashFilterTags}
        activeProjectFilter={projectFilter}
        onSetFilter={handleSetFilter}
        onSetHashFilter={handleSetHashFilter}
        onSetProjectFilter={handleSetProjectFilter}
      />
      <div className="gtdown-editor-wrap">
        <TodoEditor
          initialContent={content}
          onChange={handleChange}
          onSave={() => {}}
          onFilterChange={setFilterTags}
          onHashFilterChange={setHashFilterTags}
          onEditorReady={(view) => { editorViewRef.current = view; }}
          onEditorDestroy={() => { editorViewRef.current = null; }}
        />
      </div>
    </div>
  );
}
