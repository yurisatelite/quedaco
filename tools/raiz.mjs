// Raiz do repositório, deduzida da própria localização deste arquivo (tools/).
// Os utilitários daqui gravam em .local/ e liam caminhos absolutos chumbados
// (E:/CODEX-RPG/...), que quebraram quando o repositório mudou de lugar.
// Com isto, funcionam de onde quer que a pasta esteja.
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const naRaiz = (...partes) => join(RAIZ, ...partes);
export const local = (...partes) => join(RAIZ, '.local', ...partes);
