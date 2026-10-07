// Pure text-editing helpers for the Tasks plugin's Dataview-style inline
// field syntax: "[id:: <id>]" and "[dependsOn:: <id1>,<id2>]". Kept separate
// from the store/canvas code so this line-surgery logic can be tested and
// reasoned about on its own.
//
// TODO: this only writes the Dataview format, because that's what this
// vault is configured to use. Tasks also supports an emoji-shorthand format
// (🆔 <id> / ⛔ <id1>,<id2>) for vaults configured that way instead — add
// that back, either auto-detected or as a plugin setting, as a follow-up.
// (An earlier version of this file wrote the emoji format unconditionally,
// which silently broke dependency edits on a Dataview-format vault: it wrote
// tags the Tasks plugin's parser didn't recognize in that mode.)

const ID_SYMBOL = 'id';
const DEPENDS_ON_SYMBOL = 'dependsOn';
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateTaskId(existingIds) {
  let id;
  do {
    id = Array.from({ length: 6 }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join('');
  } while (existingIds.has(id));
  return id;
}

// An Obsidian block reference (" ^abc123") must stay at the very end of the
// line, so a new tag is spliced in just before it rather than appended after.
function insertBeforeBlockLink(line, tag) {
  const blockLinkMatch = line.match(/( \^[a-zA-Z0-9-]+)$/);
  if (!blockLinkMatch) return line + tag;
  const cut = line.length - blockLinkMatch[0].length;
  return line.slice(0, cut) + tag + line.slice(cut);
}

// Tasks' own Dataview serializer writes two leading spaces before a brand
// new bracketed field, to work around a real Obsidian rendering bug where
// consecutive square-bracketed inline fields can go invisible without it —
// see https://github.com/obsidian-tasks-group/obsidian-tasks/issues/1913
function newInlineField(key, value) {
  return `  [${key}:: ${value}]`;
}

export function addIdTag(line, id) {
  if (new RegExp(`\\[${ID_SYMBOL}:: *[a-zA-Z0-9-_]+ *\\]`).test(line)) return line; // already has one
  return insertBeforeBlockLink(line, newInlineField(ID_SYMBOL, id));
}

export function addDependsOnTag(line, depId) {
  const regex = new RegExp(`\\[${DEPENDS_ON_SYMBOL}:: *([a-zA-Z0-9-_, ]+?) *\\]`);
  const match = line.match(regex);
  if (!match) return insertBeforeBlockLink(line, newInlineField(DEPENDS_ON_SYMBOL, depId));

  const ids = match[1].split(',').map((s) => s.trim()).filter(Boolean);
  if (ids.includes(depId)) return line;
  ids.push(depId);
  return line.slice(0, match.index) + `[${DEPENDS_ON_SYMBOL}:: ${ids.join(',')}]` + line.slice(match.index + match[0].length);
}

export function removeDependsOnTag(line, depId) {
  const regex = new RegExp(`( *\\[${DEPENDS_ON_SYMBOL}:: *([a-zA-Z0-9-_, ]+?) *\\])`);
  const match = line.match(regex);
  if (!match) return line;

  const ids = match[2].split(',').map((s) => s.trim()).filter((id) => id && id !== depId);
  const replacement = ids.length > 0 ? ` [${DEPENDS_ON_SYMBOL}:: ${ids.join(',')}]` : '';
  return line.slice(0, match.index) + replacement + line.slice(match.index + match[0].length);
}

// Characters the Tasks plugin allows in an id.
export const isValidTaskId = (id) => /^[A-Za-z0-9_-]+$/.test(id);

// Replaces `oldId` with `newId` wherever the line names it: in its own id
// field and in its list of dependencies, in the Dataview style this plugin
// writes and in the Tasks emoji style (🆔 and ⛔). Everything else on the
// line, other ids in the same list included, stays as it is.
export function renameIdInLine(line, oldId, newId) {
  const swap = (list) => {
    const ids = list.split(',').map((s) => s.trim());
    return ids.includes(oldId) ? ids.map((id) => (id === oldId ? newId : id)).join(',') : list;
  };
  return line
    .replace(/([[(]id::\s*)([A-Za-z0-9_-]+)(\s*[\])])/g, (m, head, id, tail) => (id === oldId ? head + newId + tail : m))
    .replace(/(\u{1F194}\uFE0F?\s*)([A-Za-z0-9_-]+)/gu, (m, head, id) => (id === oldId ? head + newId : m))
    .replace(/([[(]dependsOn::\s*)([^\])]*?)(\s*[\])])/g, (m, head, list, tail) => head + swap(list) + tail)
    .replace(/(\u26D4\uFE0F?\s*)([A-Za-z0-9_,-]+)/gu, (m, head, list) => head + swap(list));
}

// A fresh unchecked task line with the same indentation and list marker as
// `line` (the task it is created next to), so it lands as that task's
// sibling rather than as a child of it or of its parent.
export function newSiblingTaskLine(line, description) {
  const match = line.match(/^(\s*)([-*+]|\d+[.)])(\s+)\[.\]/);
  const [, indent, marker, gap] = match ?? ['', '', '-', ' '];
  return `${indent}${marker}${gap}[ ] ${description}`;
}

// Index of the last line belonging to the list item at `lineNumber`: the
// item itself plus everything after it indented deeper (its subtasks and
// continuation lines). A new sibling is inserted right after this, so it
// never steals the original task's subtasks.
export function listItemBlockEnd(lines, lineNumber) {
  const indentOf = (s) => s.match(/^\s*/)[0].replace(/\t/g, '    ').length;
  const baseIndent = indentOf(lines[lineNumber]);
  let end = lineNumber;
  for (let i = lineNumber + 1; i < lines.length; i++) {
    if (lines[i].trim() === '') break;
    if (indentOf(lines[i]) <= baseIndent) break;
    end = i;
  }
  return end;
}

// Dataview-style inline fields anywhere on a line, in either bracket style:
// "[key:: value]" or "(key:: value)".
const INLINE_FIELD = /[[(]([A-Za-z][\w-]*)::\s*([^\])]*?)\s*[\])]/g;

// Every inline field on the line, keyed by field name (first one wins). The
// Tasks plugin only reads fields from the end of a line backwards and stops
// at the first piece of plain text, so a line such as
// "- [x] Write copy  [id:: copy]  archived on 2026-09-27" loses its id there.
// Tasks Flowchart reads the fields wherever they are, so links survive text that
// other plugins append after them.
export function readInlineFields(line) {
  const fields = {};
  for (const match of line.matchAll(INLINE_FIELD)) {
    if (!(match[1] in fields)) fields[match[1]] = match[2];
  }
  return fields;
}

// A task's display text without any inline fields, for the case where the
// Tasks plugin left unread fields inside its description.
export function stripInlineFields(text) {
  return text.replace(INLINE_FIELD, ' ').replace(/\s+/g, ' ').trim();
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A tag as the whole word it is: preceded by the line start or whitespace and
// not followed by more tag characters, so "#work" never matches inside
// "#work2" or "#work/sub".
const tagRegex = (tag) => new RegExp(`(^|\\s)${escapeRegExp(tag)}(?![\\p{L}\\p{N}_/-])`, 'giu');

// Turns what the user typed into a tag with its leading "#", or null when it
// cannot be one: Obsidian tags have no spaces and are not only digits.
export function normalizeTag(text) {
  const name = text.trim().replace(/^#+/, '');
  if (!/^[\p{L}\p{N}_/-]+$/u.test(name) || /^\d+$/.test(name)) return null;
  return `#${name}`;
}

export function addTagToLine(line, tag) {
  if (tagRegex(tag).test(line)) return line;
  return insertBeforeBlockLink(line, ` ${tag}`);
}

export function removeTagFromLine(line, tag) {
  return line.replace(tagRegex(tag), '');
}

// The Tasks plugin's priority levels, in its enum order. `value` is the
// Priority enum string the plugin reports, `field` the Dataview value and
// `emoji` the shorthand of the emoji format.
export const PRIORITY_LEVELS = [
  { value: '0', label: 'Highest', field: 'highest', emoji: '\u{1F53A}' },
  { value: '1', label: 'High', field: 'high', emoji: '⏫' },
  { value: '2', label: 'Medium', field: 'medium', emoji: '\u{1F53C}' },
  { value: '3', label: 'None', field: null, emoji: null },
  { value: '4', label: 'Low', field: 'low', emoji: '\u{1F53D}' },
  { value: '5', label: 'Lowest', field: 'lowest', emoji: '⏬' }
];

// The enum string of None, the level with no marker on the line.
export const NONE_PRIORITY = '3';

// The levels as menus and filters list them: from Highest down to Lowest,
// then None on its own at the end.
export const PRIORITY_LEVELS_NONE_LAST = [
  ...PRIORITY_LEVELS.filter((l) => l.value !== NONE_PRIORITY),
  ...PRIORITY_LEVELS.filter((l) => l.value === NONE_PRIORITY)
];

const DATAVIEW_PRIORITY = /( *)[[(]priority:: *(?:highest|high|medium|low|lowest) *[\])]/;
const EMOJI_PRIORITY = /( *)(?:\u{1F53A}|⏫|\u{1F53C}|\u{1F53D}|⏬)️?/u;

// Sets the line's priority to the level with the given enum string, in the
// format the line already uses (a line with none yet gets the Dataview
// field). Level '3' (None) removes it.
export function setPriorityInLine(line, value) {
  const level = PRIORITY_LEVELS.find((l) => l.value === value);
  if (!level) return line;
  if (DATAVIEW_PRIORITY.test(line)) {
    return line.replace(DATAVIEW_PRIORITY, (m, gap) => (level.field ? `${gap}[priority:: ${level.field}]` : ''));
  }
  if (EMOJI_PRIORITY.test(line)) {
    return line.replace(EMOJI_PRIORITY, (m, gap) => (level.emoji ? `${gap}${level.emoji}` : ''));
  }
  return level.field ? insertBeforeBlockLink(line, newInlineField('priority', level.field)) : line;
}
