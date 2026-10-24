// Interface text. English is the source language and also the key: t('Layout')
// returns the English text unless the chosen language has a dictionary with
// that key, so a missing translation shows English rather than a blank or a
// key name. Add a language by adding a dictionary file, an entry in DICTS, a
// case in obsidianLocale and an option in the View card.
import { ref } from 'vue';
import zhCN from './zh-CN';
import zhTW from './zh-TW';
import ja from './ja';
import ko from './ko';
import de from './de';
import fr from './fr';
import es from './es';
import ru from './ru';

type Dictionary = Record<string, string>;
type Params = Record<string, string | number>;

const DICTS: Record<string, Dictionary> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ja,
  ko,
  de,
  fr,
  es,
  ru
};

// The language is a choice the user can change in the View card: 'auto' follows
// Obsidian, the others fix it. It is kept in localStorage, next to the panel
// position, and is a ref so every t() call made while a component renders is
// tracked and the interface redraws at once. Texts fixed when the plugin loads
// (command names, the ribbon tooltip) update after Obsidian restarts.
export type LanguageChoice = 'auto' | 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'de' | 'fr' | 'es' | 'ru';

export const LANGUAGE_CHOICES: LanguageChoice[] = ['auto', 'en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es', 'ru'];

const STORAGE_KEY = 'task-flow-language';

function readChoice(): LanguageChoice {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as LanguageChoice | null;
    if (saved && LANGUAGE_CHOICES.includes(saved)) return saved;
  } catch {
    // Without storage the language just follows Obsidian.
  }
  return 'auto';
}

export const languageChoice = ref<LanguageChoice>(readChoice());

export function setLanguage(choice: LanguageChoice): void {
  languageChoice.value = choice;
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // The choice then only lasts until Obsidian restarts.
  }
}

// Obsidian keeps its interface language in localStorage ('zh' for Simplified
// Chinese, 'zh-TW' for Traditional, 'ja', 'de' and so on for the others); an
// English install has no entry.
function obsidianLocale(): string | null {
  let raw = '';
  try {
    raw = window.localStorage.getItem('language') ?? '';
  } catch {
    raw = '';
  }
  const code = raw.toLowerCase();
  if (code === 'zh-tw' || code === 'zh-hk' || code === 'zh-hant') return 'zh-TW';
  if (code === 'zh' || code === 'zh-cn' || code === 'zh-hans') return 'zh-CN';
  const base = code.split('-')[0];
  return base in DICTS ? base : null;
}

function currentDictionary(): Dictionary {
  const choice = languageChoice.value;
  const locale = choice === 'auto' ? obsidianLocale() : choice;
  return (locale && DICTS[locale]) || {};
}

const fill = (text: string, params?: Params): string => (params
  ? text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole))
  : text);

export function t(text: string, params?: Params): string {
  return fill(currentDictionary()[text] ?? text, params);
}

// A count with its noun: tp(3, '{n} task', '{n} tasks'). English picks the
// singular for 1 and the plural otherwise. A dictionary is keyed by both forms
// when its language inflects; one without a singular entry, like Chinese, uses
// the plural entry for every count. Russian, whose forms depend on the last
// digits, words these as 'tasks: {n}' to avoid the inflection.
export function tp(count: number, one: string, other: string, params?: Params): string {
  const dictionary = currentDictionary();
  const text = (count === 1 && dictionary[one]) || dictionary[other] || (count === 1 ? one : other);
  return fill(text, { ...params, n: count });
}
