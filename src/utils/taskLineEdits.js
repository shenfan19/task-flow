// Pure text-editing helpers for the two ways the Tasks plugin writes ids and
// dependencies: the Dataview-style inline fields "[id:: <id>]" and
// "[dependsOn:: <id1>,<id2>]", and the emoji shorthand "🆔 <id>" and
// "⛔ <id1>,<id2>". Both are read from every line. A field already on a line
// is edited in the style it has; a field added to a line that has none is
// written in the style asked for, which the Style card sets. Kept separate
// from the store/canvas code so this line-surgery logic can be tested and
// reasoned about on its own.

const ID_SYMBOL = 'id';
const DEPENDS_ON_SYMBOL = 'dependsOn';
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// The two styles a field can be written in, as the Style card lists them.
export const TASK_FORMATS = [
  { value: 'emoji', label: 'Tasks emoji' },
  { value: 'dataview', label: 'Dataview' }
];

const ID_EMOJI = '\u{1F194}';
const DEPENDS_ON_EMOJI = '\u26D4';
const EMOJI_ID = /\u{1F194}\uFE0F?\s*([A-Za-z0-9_-]+)/u;
const EMOJI_DEPENDS_ON = /( *)\u26D4\uFE0F?\s*([A-Za-z0-9_-]+(?: *, *[A-Za-z0-9_-]+)*)/u;
const emojiField = (emoji, value) => ` ${emoji} ${value}`;

export function generateTaskId(existingIds) {
  let id;
  do {
    id = Array.from({ length: 6 }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join('');
  } while (existingIds.has(id));
  return id;
}

// A note saved with Windows line endings leaves a "\r" at the end of each line
// once its text is split on "\n". Text added after that "\r" lands on a new
// line, since a lone "\r" is a line break too, so edits run on the line
// without it and the "\r" is put back afterwards.
export const withoutEol = (line) => (line.endsWith('\r') ? line.slice(0, -1) : line);

export function editKeepingEol(line, edit) {
  return edit(withoutEol(line)) + line.slice(withoutEol(line).length);
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

export function addIdTag(line, id, format = 'dataview') {
  if (new RegExp(`\\[${ID_SYMBOL}:: *[a-zA-Z0-9-_]+ *\\]`).test(line) || EMOJI_ID.test(line)) return line; // already has one
  const field = format === 'emoji' ? emojiField(ID_EMOJI, id) : newInlineField(ID_SYMBOL, id);
  return insertBeforeBlockLink(line, field);
}

export function addDependsOnTag(line, depId, format = 'dataview') {
  const regex = new RegExp(`\\[${DEPENDS_ON_SYMBOL}:: *([a-zA-Z0-9-_, ]+?) *\\]`);
  const match = line.match(regex);
  if (match) {
    const ids = match[1].split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.includes(depId)) return line;
    ids.push(depId);
    return line.slice(0, match.index) + `[${DEPENDS_ON_SYMBOL}:: ${ids.join(',')}]` + line.slice(match.index + match[0].length);
  }

  const emoji = line.match(EMOJI_DEPENDS_ON);
  if (emoji) {
    const ids = emoji[2].split(',').map((id) => id.trim());
    if (ids.includes(depId)) return line;
    ids.push(depId);
    return line.slice(0, emoji.index) + `${emoji[1]}${DEPENDS_ON_EMOJI} ${ids.join(',')}` + line.slice(emoji.index + emoji[0].length);
  }
  const field = format === 'emoji' ? emojiField(DEPENDS_ON_EMOJI, depId) : newInlineField(DEPENDS_ON_SYMBOL, depId);
  return insertBeforeBlockLink(line, field);
}

export function removeDependsOnTag(line, depId) {
  const regex = new RegExp(`( *\\[${DEPENDS_ON_SYMBOL}:: *([a-zA-Z0-9-_, ]+?) *\\])`);
  const match = line.match(regex);
  if (match) {
    const ids = match[2].split(',').map((s) => s.trim()).filter((id) => id && id !== depId);
    const replacement = ids.length > 0 ? ` [${DEPENDS_ON_SYMBOL}:: ${ids.join(',')}]` : '';
    return line.slice(0, match.index) + replacement + line.slice(match.index + match[0].length);
  }

  const emoji = line.match(EMOJI_DEPENDS_ON);
  if (!emoji) return line;
  const ids = emoji[2].split(',').map((id) => id.trim()).filter((id) => id !== depId);
  const replacement = ids.length > 0 ? ` ${DEPENDS_ON_EMOJI} ${ids.join(',')}` : '';
  return line.slice(0, emoji.index) + replacement + line.slice(emoji.index + emoji[0].length);
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

// The emoji that mark a date, paired with the Dataview field name they stand
// for: due, scheduled, start and done.
const EMOJI_DATES = [['\u{1F4C5}', 'due'], ['\u23F3', 'scheduled'], ['\u{1F6EB}', 'start'], ['\u2705', 'completion']];

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
  // The emoji style is read into the same names, so the rest of the plugin
  // does not care which style a line is written in.
  const id = line.match(EMOJI_ID);
  if (id && !('id' in fields)) fields.id = id[1];
  const dependsOn = line.match(EMOJI_DEPENDS_ON);
  if (dependsOn && !('dependsOn' in fields)) fields.dependsOn = dependsOn[2];
  for (const [emoji, key] of EMOJI_DATES) {
    const date = line.match(new RegExp(`${emoji}\\uFE0F?\\s*(\\d{4}-\\d{2}-\\d{2})`, 'u'));
    if (date && !(key in fields)) fields[key] = date[1];
  }
  return fields;
}

// The emoji fields that are metadata and never part of a task's name: id,
// dependencies, dates and priority.
const EMOJI_STRIP =
  /(?:\u{1F194}\uFE0F?\s*[A-Za-z0-9_-]+|\u26D4\uFE0F?\s*[A-Za-z0-9_-]+(?: *, *[A-Za-z0-9_-]+)*|[\u{1F4C5}\u23F3\u{1F6EB}\u2795\u2705\u274C]\uFE0F?\s*\d{4}-\d{2}-\d{2}|[\u{1F53A}\u23EB\u{1F53C}\u{1F53D}\u23EC]\uFE0F?)/gu;

// A task's display text without any inline fields, for the case where the
// Tasks plugin left unread fields inside its description.
export function stripInlineFields(text) {
  return text.replace(INLINE_FIELD, ' ').replace(EMOJI_STRIP, ' ').replace(/\s+/g, ' ').trim();
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

// The Tasks emoji-format fields: dates, priority, id, dependencies, recurrence
// and on-completion. A recurrence rule is free text, so it runs up to the next
// emoji field or bracket.
const EMOJI_FIELD =
  /(?:[\u{1F4C5}\u{23F3}\u{1F6EB}➕✅❌]️?\s*\d{4}-\d{2}-\d{2}|[\u{1F194}⛔]️?\s*[A-Za-z0-9_,-]+|\u{1F3C1}️?\s*\S+|[\u{1F53A}⏫\u{1F53C}\u{1F53D}⏬]️?|\u{1F501}️?[^\u{1F4C5}\u{23F3}\u{1F6EB}➕✅❌\u{1F194}⛔\u{1F3C1}\u{1F53A}⏫\u{1F53C}\u{1F53D}⏬[(]*?)/u;
const TRAILING_FIELD = new RegExp(`\\s*(?:[[(][A-Za-z][\\w-]*::\\s*[^\\])]*?\\s*[\\])]|${EMOJI_FIELD.source})\\s*$`, 'u');

// Index where the run of fields at the end of `text` begins, or the text
// length when it does not end in a field. The Tasks plugin reads fields from
// the end of a line backwards and stops at the first plain text, so anything
// put after that run hides the fields from it.
function trailingFieldsStart(text) {
  let end = text.length;
  for (;;) {
    const match = text.slice(0, end).match(TRAILING_FIELD);
    if (!match) return end;
    end = match.index;
  }
}

// Adds the tag to the description, ahead of the line's trailing fields. That
// keeps the fields where the Tasks plugin looks for them and puts the tag in
// the description, where it is read as a tag. Appending the tag after the
// fields made the plugin lose the fields and the tag along with them.
export function addTagToLine(line, tag) {
  if (tagRegex(tag).test(line)) return line;
  const blockLink = line.match(/( \^[a-zA-Z0-9-]+)$/)?.[0] ?? '';
  const body = line.slice(0, line.length - blockLink.length);
  const cut = trailingFieldsStart(body);
  return `${body.slice(0, cut)} ${tag}${body.slice(cut)}${blockLink}`;
}

// The tags written on a task line, found by reading the line itself so that a
// tag counts wherever it sits relative to the inline fields, which the Tasks
// plugin does not guarantee. Fields and the block link are left out, so their
// values cannot pass as tags. A tag has no spaces and is not only digits.
export function readLineTags(line) {
  const text = stripInlineFields(line.replace(/ \^[a-zA-Z0-9-]+$/, ''));
  const tags = [];
  for (const match of text.matchAll(/(?:^|\s)(#[\p{L}\p{N}_/-]+)/gu)) {
    if (!/^#\d+$/.test(match[1]) && !tags.includes(match[1])) tags.push(match[1]);
  }
  return tags;
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

// One hue per level, shared by the filter chips and the priority lanes: warm
// for the high levels to cool for the low ones, None last in purple.
export const PRIORITY_HUES = { '0': 0, '1': 25, '2': 50, '4': 200, '5': 230, '3': 270 };

// The levels as menus and filters list them: from Highest down to Lowest,
// then None on its own at the end.
export const PRIORITY_LEVELS_NONE_LAST = [
  ...PRIORITY_LEVELS.filter((l) => l.value !== NONE_PRIORITY),
  ...PRIORITY_LEVELS.filter((l) => l.value === NONE_PRIORITY)
];

const DATAVIEW_PRIORITY = /( *)[[(]priority:: *(?:highest|high|medium|low|lowest) *[\])]/;
const EMOJI_PRIORITY = /( *)(?:\u{1F53A}|⏫|\u{1F53C}|\u{1F53D}|⏬)️?/u;

// Sets the line's priority to the level with the given enum string, in the
// format the line already uses (a line with none yet gets a field in `format`).
// Level '3' (None) removes it.
export function setPriorityInLine(line, value, format = 'dataview') {
  const level = PRIORITY_LEVELS.find((l) => l.value === value);
  if (!level) return line;
  if (DATAVIEW_PRIORITY.test(line)) {
    return line.replace(DATAVIEW_PRIORITY, (m, gap) => (level.field ? `${gap}[priority:: ${level.field}]` : ''));
  }
  if (EMOJI_PRIORITY.test(line)) {
    return line.replace(EMOJI_PRIORITY, (m, gap) => (level.emoji ? `${gap}${level.emoji}` : ''));
  }
  if (!level.field) return line;
  return insertBeforeBlockLink(line, format === 'emoji' ? ` ${level.emoji}` : newInlineField('priority', level.field));
}

// The priority a line is written with, as the Tasks plugin's enum string, or
// null when it has none. Read for a line the plugin parsed in the other style.
export function readPriority(line) {
  const field = line.match(/[[(]priority:: *(highest|high|medium|low|lowest) *[\])]/);
  if (field) return PRIORITY_LEVELS.find((l) => l.field === field[1]).value;
  const emoji = line.match(/\u{1F53A}|\u23EB|\u{1F53C}|\u{1F53D}|\u23EC/u);
  return emoji ? PRIORITY_LEVELS.find((l) => l.emoji === emoji[0]).value : null;
}
