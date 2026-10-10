import { TasksPluginAPI } from '../api/TasksPluginAPI';
import { PRIORITY_LEVELS } from './taskLineEdits';

// The emoji that mark a due, scheduled or done date in the Tasks emoji format.
const EMOJI_FOR_DATE = { due: '\u{1F4C5}', scheduled: '\u23F3', completion: '\u2705' };

// A small plan written into the vault to show what a linked task list looks
// like: each task names the tasks it waits for in [dependsOn:: ], using
// their [id:: ]. Offered on the empty canvas and as a command, for anyone
// who has not used the Tasks plugin's dependencies before.
export const SAMPLE_PATH = 'Tasks Flowchart sample.md';

// The ids carry a prefix so they cannot clash with ids already in the vault.
// Dates are counted from today, so the time axis shows a plan in progress
// whenever the note is made: `date` is a date field and its offset in days.
const SAMPLE_TASKS = [
  { done: true, name: 'Kickoff meeting', tags: '#planning', id: 'tfs-kick', date: ['completion', -10] },
  { done: true, name: 'Gather requirements', tags: '#planning', id: 'tfs-req', deps: 'tfs-kick', date: ['completion', -7] },
  { name: 'Design mockups', tags: '#design', id: 'tfs-design', deps: 'tfs-req', priority: 'high', date: ['scheduled', -2] },
  { name: 'Write copy', tags: '#content', id: 'tfs-copy', deps: 'tfs-req', date: ['scheduled', -1] },
  { name: 'Set up hosting', tags: '#dev', id: 'tfs-host', deps: 'tfs-req', priority: 'low' },
  { name: 'Build pages', tags: '#dev', id: 'tfs-build', deps: 'tfs-design,tfs-copy', date: ['due', 4] },
  { name: 'Press kit', tags: '#content', id: 'tfs-press', deps: 'tfs-copy', date: ['due', 6] },
  { name: 'Connect CMS', tags: '#dev', id: 'tfs-cms', deps: 'tfs-build,tfs-host', priority: 'medium' },
  { name: 'QA pass', tags: '#dev', id: 'tfs-qa', deps: 'tfs-cms', priority: 'highest', date: ['due', 10] },
  { name: 'Launch', tags: '#milestone', id: 'tfs-launch', deps: 'tfs-qa,tfs-press', date: ['due', 14] },
  { name: 'Announce on blog', tags: '#content', deps: 'tfs-launch' }
];

const isoDay = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Fields are written the way the Tasks plugin writes them in the format
// chosen in Style, at the end of the line, so the Tasks plugin reads every
// one of them too. The Dataview fields are two spaces apart.
function sampleNoteContent(globalFilter, format) {
  const lines = SAMPLE_TASKS.map((t) => {
    const fields = [];
    if (format === 'emoji') {
      const emoji = PRIORITY_LEVELS.find((l) => l.field === t.priority)?.emoji;
      if (emoji) fields.push(emoji);
      if (t.deps) fields.push(`\u26D4 ${t.deps}`);
      if (t.id) fields.push(`\u{1F194} ${t.id}`);
      if (t.date) fields.push(`${EMOJI_FOR_DATE[t.date[0]]} ${isoDay(t.date[1])}`);
      const filter = globalFilter ? `${globalFilter} ` : '';
      return `- [${t.done ? 'x' : ' '}] ${filter}${t.name} ${t.tags} ${fields.join(' ')}`.trimEnd();
    }
    if (t.id) fields.push(`[id:: ${t.id}]`);
    if (t.deps) fields.push(`[dependsOn:: ${t.deps}]`);
    if (t.priority) fields.push(`[priority:: ${t.priority}]`);
    if (t.date) fields.push(`[${t.date[0]}:: ${isoDay(t.date[1])}]`);
    const filter = globalFilter ? `${globalFilter} ` : '';
    return `- [${t.done ? 'x' : ' '}] ${filter}${t.name} ${t.tags}  ${fields.join('  ')}`;
  });
  return [
    'A small website launch plan. Each task lists the tasks it waits for in `[dependsOn:: ]`, by their `[id:: ]`, and Tasks Flowchart draws an arrow for each of them.',
    '',
    '- Drag from one node onto another to link two tasks, or onto empty canvas to add a new one.',
    '- Double-click a node to edit the task.',
    '- Turn on **Time axis** in View to order the tasks by date.',
    '',
    'Delete this note when you are done with it.',
    '',
    ...lines,
    ''
  ].join('\n');
}

// Set when the sample note is written, until an open graph has laid out its
// tasks: they arrive at random places, since they have no saved positions.
let pendingLayoutPath = null;

// True once for the graph that should lay out the sample's tasks, now that
// `tasks` includes them.
export function takePendingSampleLayout(tasks) {
  if (!pendingLayoutPath || !tasks.some((t) => t.path === pendingLayoutPath)) return false;
  pendingLayoutPath = null;
  return true;
}

// Writes the sample note, or finds the one written before, which is left as
// it is. Resolves to the note's file.
export async function createSampleNote(app, format = 'dataview') {
  const existing = app.vault.getAbstractFileByPath(SAMPLE_PATH);
  if (existing) return existing;
  const globalFilter = await new TasksPluginAPI(app).getGlobalFilter();
  const file = await app.vault.create(SAMPLE_PATH, sampleNoteContent(globalFilter, format));
  pendingLayoutPath = SAMPLE_PATH;
  return file;
}
