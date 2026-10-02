import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import MagicString from 'magic-string';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const traverse = traverseModule.default || traverseModule;
const root = resolve(process.cwd(), 'src');
const pageFiles = {
  'pages/Index.tsx': 'home', 'components/home/MinimalHome.tsx': 'home',
  'components/home/NextMatchBar.tsx': 'home', 'components/home/HomeFloatingActions.tsx': 'home',
  'pages/Terapeutas.tsx': 'terapeutas', 'components/terapeutas/TherapistCard.tsx': 'terapeutas',
  'components/terapeutas/VacancyCard.tsx': 'terapeutas', 'components/terapeutas/BookingDrawer.tsx': 'terapeutas',
  'pages/AgendarSessao.tsx': 'terapeutas',
  'pages/Cursos.tsx': 'cursos', 'pages/CursoDetalhe.tsx': 'cursos', 'pages/MeusCursos.tsx': 'meus-cursos',
  'pages/Quiz.tsx': 'quiz', 'pages/Radio.tsx': 'radio', 'pages/RadioStation.tsx': 'radio',
  'pages/Futebol.tsx': 'futebol', 'components/futebol/BrasileiraoTable.tsx': 'futebol',
  'pages/Comunidade.tsx': 'comunidade', 'pages/Diario.tsx': 'diario',
  'components/diario/EmotionTacticalBoard.tsx': 'diario', 'components/diario/MatchExpectationCard.tsx': 'diario',
  'pages/BemEstar.tsx': 'bem-estar', 'pages/MinhaTemporada.tsx': 'minha-temporada',
  'pages/SetorSaude.tsx': 'setor-saude', 'pages/OSMF.tsx': 'osmf',
  'pages/ZonaMista.tsx': 'zona-mista', 'pages/FanaticaShop.tsx': 'loja',
  'components/shop/ShopHeader.tsx': 'loja', 'components/shop/CategoryTabs.tsx': 'loja',
  'components/shop/ClubFilter.tsx': 'loja', 'components/shop/FeaturedBanner.tsx': 'loja',
  'pages/FanaticazeTV.tsx': 'fanaticaze-tv', 'pages/Perfil.tsx': 'perfil',
  'pages/Notificacoes.tsx': 'notificacoes', 'pages/Configuracoes.tsx': 'configuracoes',
};
const tags = new Set(['h1','h2','h3','h4','h5','h6','p','span','button','label','li','small','strong','em','a','div']);
function segment(text) {
  // Only ordinary fixed interface labels. Never include IDs, numbers, emoji-only copy or long articles.
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact || compact.length > 180 || !/[A-Za-zÀ-ÿ]{3}/.test(compact)) return null;
  return compact;
}
export function analyzeFanCopy(code, filename, transform = false) {
  const path = relative(root, filename).replaceAll('\\','/');
  const page = pageFiles[path];
  if (!page) return null;
  let ast;
  try { ast = parse(code, { sourceType: 'module', plugins: ['typescript','jsx'] }); }
  catch { return null; }
  const magic = transform ? new MagicString(code) : null;
  const items = [];
  const occurrences = new Map();
  traverse(ast, {
    JSXText(p) {
      const node = p.node;
      const parent = p.parent;
      if (parent.type !== 'JSXElement' || parent.openingElement.name.type !== 'JSXIdentifier') return;
      const tag = parent.openingElement.name.name;
      if (!tags.has(tag)) return;
      const text = segment(node.value);
      if (!text) return;
      // Preserve text adjacent to an inline icon or dynamic value.
      const before = node.value.match(/^\s*/)?.[0] || '';
      const after = node.value.match(/\s*$/)?.[0] || '';
      const token = `${tag}:${text}`;
      const n = (occurrences.get(token) || 0) + 1;
      occurrences.set(token, n);
      const id = createHash('sha256').update(`${path}:${token}:${n}`).digest('hex').slice(0, 16);
      items.push({ id, page, text, section: path.split('/').pop()?.replace(/\.tsx$/, '') || page, tag });
      if (magic) {
        const leading = before && parent.children.length > 1 ? ' ' : '';
        const trailing = after && parent.children.length > 1 ? ' ' : '';
        magic.overwrite(node.start, node.end, `${leading}<EditableFanText id="${id}" fallback={${JSON.stringify(text)}} />${trailing}`);
      }
    },
  });
  if (magic && items.length) {
    if (!code.includes('import EditableFanText from "@/components/fan/EditableFanText"')) magic.prepend('import EditableFanText from "@/components/fan/EditableFanText";\n');
    return { code: magic.toString(), map: magic.generateMap({ hires: true }) };
  }
  return transform ? null : items;
}
export const fanCopyPlugin = () => ({
  name: 'fan-copy',
  enforce: 'pre',
  transform(code, id) {
    const file = id.split('?')[0];
    if (!file.endsWith('.tsx') || !file.startsWith(root)) return null;
    return analyzeFanCopy(code, file, true);
  },
});

// Generates the catalogue from exactly the text nodes the plugin enhances.
export function writeFanCopyCatalog() {
  const items = Object.keys(pageFiles).flatMap(file => {
    const absolute = resolve(root, file);
    try { return analyzeFanCopy(readFileSync(absolute, 'utf8'), absolute) || []; }
    catch { return []; }
  });
  writeFileSync(resolve(root, 'generated/fanCopy.json'), JSON.stringify(items, null, 2) + '\n');
  return items.length;
}
