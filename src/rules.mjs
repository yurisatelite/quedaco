/** Regras conferidas no Livro Básico DIGITAL 1.25. Sem dependência de Foundry. */
export const ABILITIES = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };
export const CLASS_RULES = {
  Combatente: { die: 10, fixed: 6, money: { dice: 3, bonus: 10 }, page: 132 },
  Especialista: { die: 8, fixed: 5, money: { dice: 3, bonus: 10 }, page: 140 },
  Ocultista: { die: 6, fixed: 4, money: { dice: 3, bonus: 15 }, page: 148 }
};
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
export function classRules(name) {
  return Object.entries(CLASS_RULES).find(([key]) => normalize(key) === normalize(name))?.[1] ?? null;
}
export function backgroundRules(name) {
  return BACKGROUNDS.find(b => normalize(b.name) === normalize(name).replace('detetivo', 'detetive')) ?? null;
}
export function modifier(total) {
  if (!Number.isInteger(total) || total < 3 || total > 18) throw Error('A soma dos três dados deve estar entre 3 e 18.');
  return Math.floor((total - 10) / 2);
}
export function conventionalRoll(dice) {
  if (!Array.isArray(dice) || dice.length !== 4 || dice.some(d => !Number.isInteger(d) || d < 1 || d > 6)) throw Error('Informe quatro resultados de d6 válidos.');
  const sorted = [...dice].sort((a, b) => a - b);
  const total = sorted.slice(1).reduce((a, b) => a + b, 0);
  return { dice: [...dice], discarded: sorted[0], total, value: modifier(total) };
}
export function validateAttributes(values, method = 'manual', baseValues = null, boost = null) {
  const errors = [];
  if (!Array.isArray(values) || values.length !== 6 || values.some(n => !Number.isInteger(n) || n < -4 || n > 4)) return ['Preencha os seis atributos com valores inteiros entre −4 e +4.'];
  if (method === 'fixed') {
    if (!baseValues || [...baseValues].sort((a,b)=>a-b).join(',') !== '-1,0,1,1,2,3') errors.push('Distribua +3, +2, +1, +1, 0 e −1, sem repetir uma posição da distribuição.');
    if (!Number.isInteger(boost) || boost < 0 || boost > 5) errors.push('Escolha o atributo que recebe +1.');
    if (values.some(v => v > 3)) errors.push('Na distribuição fixa, nenhum atributo pode ultrapassar +3.');
    if (baseValues && values.some((v,i)=>v !== baseValues[i] + (i === boost ? 1 : 0))) errors.push('O ajuste final não corresponde à distribuição fixa.');
  }
  if (['conventional', 'ordered'].includes(method) && values.reduce((a,b)=>a+b,0) < (method === 'ordered' ? 4 : 6)) errors.push('O total está abaixo do mínimo; rerrole o menor resultado.');
  return errors;
}
export function hitPoints(className, con, level = 1, rolls = null) {
  const cls = classRules(className);
  if (!cls || !Number.isInteger(con) || !Number.isInteger(level) || level < 1 || level > 12) throw Error('Classe, Constituição ou nível inválido.');
  if (rolls && (rolls.length !== level-1 || rolls.some(n=>!Number.isInteger(n)||n<1||n>cls.die))) throw Error('Informe um dado de vida válido por nível após o primeiro.');
  return cls.die + (rolls ? rolls.reduce((a,b)=>a+b,0) : cls.fixed*(level-1)) + con*level;
}
export function wallet(total) {
  if (!Number.isSafeInteger(total) || total < 0) throw Error('O dinheiro deve ser um inteiro não negativo em Trocados.');
  return { k: Math.floor(total / 1000), p: Math.floor(total % 1000 / 10), t: total % 10 };
}
export const walletTotal = ({ k = 0, p = 0, t = 0 }) => k*1000+p*10+t;
export function carryingCapacity(strength){if(!Number.isInteger(strength)||strength< -4||strength>10)throw Error('Força inválida para calcular volume.');if(strength<=-3)return 10;if(strength===-2)return 12;if(strength===-1)return 14;if(strength===0)return 16;return 19+(strength-1)*3;}
export function moneyResult(rule, diceSum) {
  if (!rule || !Number.isInteger(diceSum) || diceSum < rule.dice || diceSum > rule.dice*(rule.sides??6)) throw Error('Soma dos dados fora do intervalo permitido.');
  return diceSum + rule.bonus;
}
export function startingMoney(className, backgroundName, classSum, backgroundSum) {
  const cls = classRules(className), bg = backgroundRules(backgroundName);
  if (!cls || !bg) throw Error('Esta opção ainda não tem dinheiro mapeado. Confira o conteúdo da mesa.');
  const fromClass = moneyResult(cls.money, classSum), fromBackground = moneyResult(bg, backgroundSum);
  const cash = fromClass + (bg.budgetOnly ? 0 : fromBackground);
  return { cash, wallet: wallet(cash), fromClass, fromBackground, equipmentBudget: bg.budgetOnly ? fromBackground : 0, debt: bg.debt ? fromBackground*10 : 0 };
}
