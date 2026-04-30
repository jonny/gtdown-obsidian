import { useState } from 'react';

interface SidebarProps {
  projects: Array<{ name: string; lineNum: number }>;
  tags: string[];
  hashtags: string[];
  activeFilter: string[];
  activeHashFilter: string[];
  activeProjectFilter: string | null;
  onSetProjectFilter: (project: string | null) => void;
  onSetFilter: (tag: string) => void;
  onSetHashFilter: (tag: string) => void;
  onArchiveDone: () => void;
  onDeleteArchive: () => void;
}

const SAVED_SEARCHES = [
  { label: 'Now', filter: '@now' },
  { label: 'Not Done', filter: '!@done' },
  { label: 'Done', filter: '@done' },
];

function Section({ title, children, pinBottom = false }: { title: string; children: React.ReactNode; pinBottom?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <section className={`sidebar-section${pinBottom ? ' sidebar-section--bottom' : ''}`}>
      <button className="sidebar-heading sidebar-heading--toggle" onClick={() => setOpen(o => !o)}>
        <span className={`sidebar-chevron${open ? '' : ' sidebar-chevron--collapsed'}`}>›</span>
        {title}
      </button>
      {open && children}
    </section>
  );
}

export function Sidebar({ projects, tags, hashtags, activeFilter, activeHashFilter, activeProjectFilter, onSetProjectFilter, onSetFilter, onSetHashFilter, onArchiveDone, onDeleteArchive }: SidebarProps) {
  return (
    <aside className="sidebar">
      <Section title="Projects">
        {projects.length === 0 ? (
          <p className="sidebar-empty">No projects yet</p>
        ) : (
          <ul className="sidebar-list">
            {projects.map((p) => (
              <li key={p.lineNum}>
                <button
                  className={`sidebar-item${activeProjectFilter === p.name ? ' sidebar-item--active' : ''}`}
                  onClick={() => onSetProjectFilter(activeProjectFilter === p.name ? null : p.name)}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Searches">
        <ul className="sidebar-list">
          {SAVED_SEARCHES.map(({ label, filter }) => (
            <li key={filter}>
              <button
                className={`sidebar-item${activeFilter.includes(filter) ? ' sidebar-item--active' : ''}`}
                onClick={() => onSetFilter(filter)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {tags.length > 0 && (
        <Section title="Tags">
          <ul className="sidebar-list">
            {tags.map((tag) => (
              <li key={tag}>
                <button
                  className={`sidebar-item sidebar-item--tag${activeFilter.includes(tag) ? ' sidebar-item--active' : ''}`}
                  onClick={() => onSetFilter(tag)}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {hashtags.length > 0 && (
        <Section title="Labels">
          <ul className="sidebar-list">
            {hashtags.map((tag) => (
              <li key={tag}>
                <button
                  className={`sidebar-item sidebar-item--hash${activeHashFilter.includes(tag) ? ' sidebar-item--active' : ''}`}
                  onClick={() => onSetHashFilter(tag)}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Actions" pinBottom>
        <ul className="sidebar-list">
          <li>
            <button className="sidebar-item sidebar-item--action" onClick={onArchiveDone}>
              Archive done
            </button>
          </li>
          <li>
            <button className="sidebar-item sidebar-item--action" onClick={onDeleteArchive}>
              Delete archive
            </button>
          </li>
        </ul>
      </Section>
    </aside>
  );
}
