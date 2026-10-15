/** Regras conferidas no Livro Básico DIGITAL 1.25. Sem dependência de Foundry. */
export const ABILITIES = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };
export const BACKGROUNDS = [
  ['Agente de organização', 122, 3, 10], ['Agouro', 122, 3, 10],
  ['Aristocrata', 123, 3, 30, 10], ['Artista', 123, 3, 0], ['Assistente Magitec', 123, 3, 10],
  ['Caçador', 124, 3, 0], ['Comerciante', 124, 3, 30], ['Contrabandista', 124, 3, 10],
  ['Cosmopolita', 125, 3, 90], ['Detetive', 125, 3, 10], ['Devedor', 125, 10, 30], ['Erudito', 125, 3, 10],
  ['Estudioso Feérico', 126, 3, 10], ['Herói do Povo', 126, 2, 0], ['Juramentado', 126, 3, 10],
  ['Militar', 127, 3, 10], ['Navegante', 127, 3, 10], ['Procurado', 127, 3, 10],
  ['Proletário', 128, 6, 10], ['Viajante Intrépido', 128, 5, 30]
].map(([name, page, dice, bonus, sides = 6]) => ({ name, page, dice, sides, bonus, budgetOnly: name === 'Viajante Intrépido', debt: name === 'Devedor' }));
export const normalize = value => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function modifier(total) {
  if (!Number.isInteger(total) || total < 3 || total > 18) throw Error('A soma dos três dados deve estar entre 3 e 18.');
  return Math.floor((total - 10) / 2);
}
export function wallet(total) {
  if (!Number.isSafeInteger(total) || total < 0) throw Error('O dinheiro deve ser um inteiro não negativo em Trocados.');
  return { k: Math.floor(total / 1000), p: Math.floor(total % 1000 / 10), t: total % 10 };
}
export const walletTotal = ({ k = 0, p = 0, t = 0 }) => k*1000+p*10+t;
/** Preço legível nas três moedas do Cap. 3 (p. 219): 10 Trocado = 1 Pila,
 *  100 Pila = 1 Kurmac. Mostra só as moedas diferentes de zero, da maior para a
 *  menor; abaixo de 10 Trocados não vale a pena quebrar o preço de uma vela. */
export function precoFormatado(total) {
  const value = Math.max(0, Math.floor(Number(total) || 0));
  if (value < 10) return `T$ ${value}`;
  const { k, p, t } = wallet(value);
  return [k ? `K$ ${k.toLocaleString('pt-BR')}` : null, p ? `P$ ${p}` : null, t ? `T$ ${t}` : null].filter(Boolean).join(' · ');
}
