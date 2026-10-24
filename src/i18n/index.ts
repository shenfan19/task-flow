// Interface text. English is the source language and also the key: t('Layout')
// returns the English text unless the Obsidian language has a dictionary with
// that key, so a missing translation shows English rather than a blank or a
// key name. Add a language by adding a dictionary file and an entry in DICTS
// and in pickLocale.
import zhCN from './zh-CN';
import zhTW from './zh-TW';

type Dictionary = Record<string, string>;
type Params = Record<string, string | number>;

const DICTS: Record<string, Dictionary> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW
};

// Obsidian keeps its interface language in localStorage ('zh' for Simplified
// Chinese, 'zh-TW' for Traditional); an English install has no entry. The
// language only changes after a restart of Obsidian, so reading it once at
// load is enough.
function pickLocale(): string | null {
  let raw = '';
  try {
    raw = window.localStorage.getItem('language') ?? '';
  } catch {
    raw = '';
  }
  const code = raw.toLowerCase();
  if (code === 'zh-tw' || code === 'zh-hk' || code === 'zh-hant') return 'zh-TW';
  if (code === 'zh' || code === 'zh-cn' || code === 'zh-hans') return 'zh-CN';
  return null;
}

const locale = pickLocale();
const dictionary: Dictionary = (locale && DICTS[locale]) || {};

const fill = (text: string, params?: Params): string => (params
  ? text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole))
  : text);

export function t(text: string, params?: Params): string {
  return fill(dictionary[text] ?? text, params);
}

// A count with its noun: tp(3, '{n} task', '{n} tasks'). English picks the
// singular for 1 and the plural otherwise; a dictionary is keyed by the plural
// form and has no singular, since Chinese does not inflect.
export function tp(count: number, one: string, other: string, params?: Params): string {
  const key = dictionary[other] ? other : count === 1 ? one : other;
  return fill(dictionary[key] ?? key, { ...params, n: count });
}
