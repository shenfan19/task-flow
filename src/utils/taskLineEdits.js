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
