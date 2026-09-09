# Onde guardar imagens para o QUEDAÇO usar depois

Resposta à dúvida: "o que posso deixar em 'banco de dados' pra a gente acessar e trocar
as imagens? Se eu deixar em pastas divididas por nome / tags, dá pra usar?"

Resumo: **sim**. O Foundry não tem "tags" de imagem, mas tem um sistema de arquivos que
o módulo consegue ler. O caminho bom é **pasta + nome de arquivo por convenção**, com um
**JSON de exceções** opcional. Abaixo as opções, da mais simples à mais robusta.

---

## O que o Foundry oferece

| Recurso | Serve para | Limite |
|---|---|---|
| **Sistema de arquivos** (`Data/…`, "Ferramentas de Arquivo") | Guardar PNG/WebP/JPG/SVG/WebM em pastas. O módulo pode **listar** uma pasta em runtime (`FilePicker.browse`). | Upload pela interface some 1 arquivo por vez; sem tags; nomes são a única metadata. |
| **`FilePicker`** (o que usamos hoje) | Mestre escolhe **1 arquivo** por entrada (região, local, mapa). Guardado num setting. | Manual, um por um. |
| **Settings do módulo** (`world`) | Guardar o mapa `{ id → caminho }`. | Texto/へJSON; editável por código ou por uma tela de config. |
| **Compêndio de Journal/Scene** | Cada local vira uma `JournalEntry` com página de imagem, ou uma `Scene`. Pesquisável, linkável, arrastável. | Mais trabalho pra montar; é "documento", não "arquivo". |
| **Tabelas (RollTable) / flags** | Associações id→imagem editáveis na mesa. | Gambiarra; não recomendo. |
| **Armazenamento S3/externo** | Mesma coisa que `Data/`, com URL. | Só se a mesa já usa S3. |

Não existe: buscar imagem por "tag", álbum, EXIF. A organização é **pasta + nome**.

---

## Opção A — convenção de pastas (recomendada)

Você cria **uma pasta no armazenamento da mesa** (não vai dentro do módulo — o módulo
nunca embute imagem do livro nem arte sua) e joga os arquivos com nome = **id da
entrada**. O QUEDAÇO passa a procurar sozinho.

```
worlds/<seu-mundo>/quedaco/            (ou um caminho que você escolher uma vez)
├── regioes/
│   ├── mirmir.webp
│   ├── norvak.webp
│   └── ...
├── locais/
│   ├── kravokia.webp
│   ├── kravokia--mercado.webp        (duplo hífen = "variante/sub-lugar")
│   └── ...
├── npcs/
│   ├── talia-ferreira.webp           (slug do nome, minúsculo, sem acento)
│   └── ...
├── monstros/
│   ├── bicho-papao.webp
│   └── ...
└── itens/
    ├── espada-longa.webp
    └── ...
```

Regras da convenção (o módulo normaliza tudo antes de comparar):
- **minúsculas, sem acento, espaços viram `-`**. "Bicho-papão" → `bicho-papao`.
- Regiões e locais usam o **`id`** que já existe em `src/book-world.mjs` (ex. `mirmir`,
  `kravokia`) — é o mais confiável. NPC/monstro/item por **slug do nome**.
- Extensões aceitas, nessa ordem de preferência: `.webp`, `.png`, `.jpg`, `.svg`.
- "Tag" simples via sufixo com `--`: `kravokia--porto.webp`, `kravokia--noite.webp`.
  O módulo pega a base (`kravokia`) e oferece as variantes numa lista.

Vantagem: você despeja as imagens quando quiser, sem mexer em setting nenhum. O módulo
escaneia a pasta na hora de renderizar e casa pelo nome.

## Opção B — JSON de exceções (por cima da A)

Um arquivo `quedaco-imagens.json` na mesma pasta, para casos que a convenção não pega
(nome esquisito, querer forçar uma arte específica):

```json
{
  "locais": { "kravokia": "worlds/x/arte/capital-final-v3.webp" },
  "npcs":   { "talia-ferreira": "worlds/x/npc/talia.png" },
  "monstros": { "nuvem-de-besouros-de-aetherium": "worlds/x/mon/besouros.webp" }
}
```

Precedência: **JSON de exceção > arquivo por convenção > imagem do documento no Foundry >
ícone padrão por categoria**.

## Opção C — só settings (o que já existe, ampliado)

Continua o `FilePicker` por entrada, mas com um botão "Escolher pasta" que preenche
várias de uma vez pela convenção da Opção A. Menos flexível que A+B.

---

## Recomendação

**A + B.** Você mantém uma pasta com subpastas `regioes/ locais/ npcs/ monstros/ itens/`
e nomes por slug; para os teimosos, uma linha no `quedaco-imagens.json`. O módulo ganha
uma função `resolveImage(tipo, idOuNome)` com essa precedência e um setting único
`quedaco.assetRoot` (o caminho da pasta, escolhido uma vez).

Isso vira uma tarefa de Codex quando você quiser — hoje já dá pra ir **colocando os
arquivos na pasta** com os nomes certos; nada se perde.

### Formatos e tamanho
- **WebP** para arte (bom peso), **PNG** só quando precisa de transparência dura,
  **SVG** para símbolos. Evite JPG para tokens.
- Miniatura de lista: ~400–600 px do lado maior já basta. Arte de detalhe: até ~1600 px.
- Mapa de continente: pode ser grande (até ~4000–6000 px); acima disso a gente
  conversa sobre fatiar (fora do escopo atual).
