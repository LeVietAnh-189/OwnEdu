import Prism from 'prismjs';

// Load commonly used syntax definitions in correct dependency order
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup'; // HTML / XML
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';

const LANG_MAP: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  terminal: 'bash',
  html: 'markup',
  xml: 'markup',
  cs: 'csharp',
  'c++': 'cpp',
};

/**
 * Highlights a code string using PrismJS for the specified programming language.
 * Returns HTML string with syntax token classes.
 */
export function highlightCode(code: string, lang: string = 'sql'): string {
  if (!code) return '';
  const cleanLang = (lang || 'sql').toLowerCase().trim();
  const targetLang = LANG_MAP[cleanLang] || cleanLang;
  const grammar = Prism.languages[targetLang] || Prism.languages.sql || Prism.languages.javascript;
  const resolvedLang = Prism.languages[targetLang] ? targetLang : (Prism.languages.sql ? 'sql' : 'javascript');

  try {
    return Prism.highlight(code, grammar, resolvedLang);
  } catch {
    // Fallback: safe HTML escape
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
