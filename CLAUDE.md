# Serranópolis — regras do projeto

Estas regras valem para **este repositório** e somam-se ao `~/.claude/CLAUDE.md` global.
Onde houver conflito, o global vence nas regras de segurança; aqui vence no que é
específico do projeto.

---

## 1. O que é este projeto

Uma experiência web imersiva que deixa o visitante explorar **Serranópolis**, um bairro
fictício de Lages, Santa Catarina, na Serra Catarinense. Trabalho acadêmico de 5º semestre,
avaliado numa **apresentação ao vivo**.

O modelo de interação é o do `visitmeatopia.com`: um mundo 3D navegável como hub, com
páginas de conteúdo penduradas nele. A arquitetura e o timing são reproduzidos; **nenhum
asset, texto ou nome é copiado**.

A arquitetura medida do site de referência está em
`openspec/changes/add-serranopolis-experience/design.md` — Context. Leia antes de mexer em
qualquer coisa visual. Os números lá são medidos, não estimados; não os re-derive.

**Vai virar produto** (decidido em 2026-09-28). O trabalho acadêmico é o começo; o
destino é um produto que apresenta a comunidade e os estabelecimentos parceiros. Por isso
o foco é:
- **estrutura de dados** (`docs/architecture/data-model.md`);
- **documentação bem escrita e nos padrões de engenharia** (é o projeto final de
  **Engenharia de Sistemas**: documentação, manual e apresentação individual são
  obrigatórios; a nota olha escrita documental, validação da ideia, criatividade e
  resolução):
  - visão e escopo;
  - SRS na ISO/IEC/IEEE 29148, com matriz de rastreabilidade;
  - arquitetura em arc42 com C4 e ADRs;
  - plano de testes na ISO/IEC/IEEE 29119-3;
  - manuais do visitante, do parceiro e de instalação e operação (`docs/manual/`);
- **código limpo**.

O índice de tudo está em `docs/README.md`; o processo, em `CONTRIBUTING.md`.

---

## 2. Spec primeiro — sem exceção

**Nenhum código novo sem spec.** O fluxo é sempre:

```
1. openspec new change "<nome-em-kebab-case>"
2. proposal → specs → design → tasks
3. openspec validate <nome>          ← precisa passar
4. só então implementar
5. openspec archive <nome>           ← quando a change estiver entregue
```

**Por quê:** a nota da apresentação depende de mostrar processo, não só resultado. Um commit
que aparece sem spec correspondente é um commit que não tem como ser defendido na banca.

Regras de fronteira:

- **Muda comportamento observável?** → precisa de spec. Sempre.
- **É refactor puro, tooling ou doc?** → pode ir sem spec, mas a change precisa marcar
  `skip_specs: true` no `.openspec.yaml`. Não invente um requisito só para o validate passar.
- **Achou uma divergência entre a spec e o código?** → a spec é a verdade. Corrija o código,
  ou abra uma change que corrija a spec — nunca deixe as duas discordando em silêncio.
- **Spec descreve comportamento, não implementação.** Se dá para trocar a biblioteca sem
  mudar o texto da spec, o texto está certo. Nome de classe, de função ou de framework em
  spec é erro — isso vai no `design.md`.

Specs e artefatos OpenSpec são escritos em **inglês**, como o resto do código.

---

## 3. Stack

| Camada | Escolha |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Linguagem | TypeScript `strict: true` |
| Estilo | Tailwind CSS v4 — tokens em `web/src/app/globals.css` |
| 3D | three.js + `@react-three/fiber` + `@react-three/drei` |
| Animação | GSAP + `@gsap/react` (`useGSAP`) |
| Scroll | Lenis — **só nas páginas de conteúdo**, nunca no hub 3D |
| Banco | **MariaDB 11.4**, em **Docker** no desenvolvimento local |
| ORM | **Prisma 7** (`provider = "mysql"` — é o conector que fala com MariaDB) |
| Deploy | VPS, **depois**. Agora é só desenvolvimento local. |

### Sobre o banco

O `design.md` fecha content como módulos TypeScript tipados e lista "headless CMS" como
não-objetivo, com a ressalva de que **trocar a fonte de dados não muda nenhuma spec**.
MariaDB + Prisma é exatamente essa troca: os tipos `Place` e `Experience` continuam sendo o
contrato, e o Prisma passa a ser quem os preenche.

- O acesso ao banco fica **isolado numa camada de dados**. Nenhum componente importa
  `PrismaClient` direto.
- Toda mudança de schema entra por **migration versionada** (`prisma migrate dev`), nunca
  por `db push` fora de um spike descartável.
- Nomes de tabela e coluna em `snake_case` e **inglês** (`place_id`, `created_at`). Cuidado
  com palavra reservada de SQL: prefira `position`, `kind`, `tier` a `order`, `type`, `rank`.
- `.env` nunca é commitado. `.env.example` é, com as chaves e sem os valores.

### Docker no desenvolvimento local

O banco sobe com `docker compose up -d` (ou `npm run db:up` de dentro de `web/`). O compose
sobe dois serviços: **MariaDB** e **Adminer** (interface web em `http://localhost:8080`).

Três detalhes desta máquina que já custaram tempo — não os redescubra:

1. **A porta do host é a 3307, não a 3306.** Existe um `mysqld` nativo rodando em
   `127.0.0.1:3306` nesta máquina. Se o container publicar na 3306, o Prisma conecta
   silenciosamente no MySQL nativo e falha com "Authentication failed" — o erro não diz que
   você acertou o servidor errado.
2. **O usuário da aplicação precisa de DDL para o shadow database.** O `prisma migrate dev`
   cria e derruba um banco descartável a cada execução, e o `MARIADB_USER` não nasce com
   esse direito. O grant está em `docker/mariadb-init/01-grant-shadow-db.sql`, que roda
   sozinho na primeira inicialização de um volume vazio. **Na VPS isso não se repete:** lá
   roda `prisma migrate deploy`, que não usa shadow database, e o usuário de produção não
   deve receber esse grant.
3. **O healthcheck existe por um motivo.** O MariaDB aceita o `docker compose up` bem antes
   de aceitar conexões, e o `migrate` falha de forma confusa nessa janela.

Um quarto, do Next e não do banco:

4. **Trocar uma imagem em `public/` não muda nada na tela.** O otimizador guarda a cópia
   em `.next/dev/cache/images` e indexa **pela URL, não pelo arquivo**. Hard refresh e
   reiniciar o servidor não resolvem, e `.next/cache/images` é outra pasta, não a usada.
   `npm run images:sharpen` e `npm run build:logo` limpam a pasta certa no fim da passagem.
   **O navegador do visitante também guarda pela URL.** O logo corrigido continuou com os
   risquinhos na tela do dono, e nada no servidor alcança esse cache. Quando uma imagem
   muda de conteúdo e precisa sumir para todos, ela ganha **um nome novo**, como
   `logo-saltopia.png` virou `saltopia-wordmark.png`.

Recriar o banco do zero (perde os dados, roda o init script de novo):

```bash
docker compose down -v && docker compose up -d && (cd web && npx prisma migrate dev)
```

### Sobre o deploy

Enquanto o foco for local, **nada de código específico de VPS** — sem caminho absoluto de
servidor, sem assumir Nginx, sem hardcode de domínio. Configuração sai de variável de
ambiente com default local que funciona. A migração para a VPS precisa ser uma mudança de
`.env`, não de código.

---

## 4. Clean code

Vale o que está no global. O que este projeto acrescenta:

- **Sem `any`.** Nem em código 3D, onde é tentador. Use os tipos de `@types/three`.
- **Sem herança de classe.** Composição, inclusive nos objetos de cena.
- **Função com mais de 50 linhas se quebra.** Cenas 3D atraem funções gigantes de setup —
  quebre por responsabilidade (câmera, luz, terreno, props), não por número de linhas.
- **Nada de número mágico.** Duração, easing, cor e posição de câmera saem de token ou de
  constante nomeada. Se aparece `2` no meio de um `gsap.to`, ele vira `DURATION_FLIGHT`.
- **Um componente, uma responsabilidade.** O componente que desenha o pin não é o mesmo que
  calcula a projeção 3D→2D.
- **Sem código comentado.** Apague — o git lembra.
- **Sem `console.log` em commit.**
- **Comentário explica o porquê, não o quê.** `// Ordena por score DESC porque...` sim;
  `// incrementa contador` não.
- **Nenhuma cor da referência.** A interface é noite `#1F2346`, vinho `#7B2D3F` e champanhe
  `#D9BF86` sobre creme. Nada de laranja-avermelhado, verde-petróleo, menta ou mostarda:
  o dono pediu ("não é uma cópia descarada"). `tests/palette.test.ts` e
  `tests/content.test.ts` falham se um token ou a cor de um lugar ficar a menos de 0,08
  (OKLab) das cores da referência. O teal e o araucária foram aposentados e não voltam.
- **Documentação anda junto com o código.** Mudou o modelo de dados? Atualize
  `docs/architecture/data-model.md` no mesmo commit. Mudou algo que o visitante ou o
  parceiro vê? Atualize o manual dele (`docs/manual/`). Requisito novo entra no SRS e na
  matriz de rastreabilidade (`docs/requirements/`); decisão que amarra o futuro vira ADR
  (`docs/architecture/decisions/`); mudança visível entra no `CHANGELOG.md`. Documento
  desatualizado é pior que documento nenhum.
- **Conteúdo é dado.** Texto, cor, cardápio e oferta moram em `web/prisma/content/` (ou em
  `lib/contest/content.ts`), nunca num componente. Lugar novo ou prato novo é mudança de
  conteúdo, não de código.

### Idioma

| Onde | Idioma |
| --- | --- |
| Identificadores, arquivos, comentários, commits, specs | **inglês** |
| Texto que o visitante lê — rótulo, botão, erro, conteúdo | **português do Brasil** |
| Conversa comigo | **português do Brasil** |

Uma constante em inglês guardando texto em português é o padrão certo:
`const EMPTY_STATE = 'Nada por aqui ainda'`.

---

## 5. Regras específicas de 3D e animação

Estas existem porque a apresentação roda numa máquina que ninguém testou.

- **Toda animação respeita `prefers-reduced-motion`.** Sem exceção. E reduzir movimento
  nunca pode tornar um destino inalcançável — a spec `design-system` define o contrato.
- **O fallback sem WebGL é requisito, não enfeite.** Ele é construído *antes* do hub 3D.
  Fallback feito por último é fallback que nunca foi visto.
- **Orçamento de payload 3D: 8 MB comprimido.** Estourou, corta variedade de objeto antes
  de cortar quantidade — cidade repetitiva lê melhor que cidade vazia.
- **`devicePixelRatio` travado em 2.** Tela densa não pode multiplicar custo de fragmento.
- **Nada de `useState` dentro do loop de render.** Posição de pin é escrita direto no nó do
  DOM; 60 reconciliações por segundo é bug, não detalhe.
- **Foto de página é fotografia, gerada no Grok a partir de brief.** O fluxo é
  `npm run images:prompts` (gera `docs/grok/manifest.jsonl` só com o que falta), depois o
  Grok Build percorre o manifesto (`docs/grok/README.md`), depois `npm run images:sharpen`.
  O brief de cada item mora junto do conteúdo (`photo` em `menus.ts`). Foto que ainda não
  existe vira um substituto desenhado, nunca uma imagem quebrada.
- **Modelo 3D vem de fonte CC0** (Kenney, Quaternius, Poly Pizza) e a origem de cada arquivo
  fica registrada em `web/public/models/CREDITS.md`. CC0 não exige atribuição; trabalho
  acadêmico exige conseguir mostrar de onde veio tudo. Hoje os únicos modelos baixados são
  as seis pessoas (personagem do modo a pé e moradores), pedidas só depois do primeiro
  quadro do mundo.
- **Pé pisa no que está desenhado.** A altura de quem anda vem de um height field
  rasterizado da geometria desenhada (`web/src/lib/walk/height-field.ts`), nunca de uma
  regra calculada à parte. Superfície nova onde se pisa entra nesse campo. Duas vezes uma
  regra foi usada e duas vezes os pés afundaram (praça, depois calçada).
- **Download de modelo pode falhar.** Todo `useGLTF` fica dentro de um `ErrorBoundary`
  (`react-error-boundary`): sem isso, um modelo que não chega derruba o hub inteiro.
- **Nunca tire um passe de um EffectComposer em execução.** O composer é recriado por
  nível de qualidade (`key={tier}`). Tirar o AO de um composer vivo congelou o canvas, e os
  pins, que são HTML, continuaram se mexendo por cima — parecia "pins se afastando".
- **Árvore plantada às centenas tem forma simples.** Araucárias e árvores de copa larga
  são 92% dos triângulos do mundo. Além de 200 m da câmera elas usam a forma simples
  (`SIMPLE_MODEL_REGISTRY`, ADR-0015). Modelo novo plantado às centenas ganha a sua, ou
  pesa em toda vista.
- **Mixer de animação é do modelo, não do componente.** O `useAnimations` do drei manteve
  um mixer ao trocar de pessoa no criador. A nova pessoa deslizava com as pernas paradas.
  Cada modelo cria e libera o seu (`lib/walk/character-animation.ts`).
- **Pessoa clonada usa um esqueleto só.** O `SkeletonUtils.clone` dá um esqueleto a cada
  parte, e o three atualiza e reenvia todos a cada render: eram 177 para 15 moradores.
  `lib/walk/skeletons.ts` junta as partes num esqueleto só.
- **Trabalho lento vai em fatias.** Nada que leve mais de um quadro roda inteiro durante a
  visita. O mapa de caminhada e a grade de rotas são preparados em fatias de 4–12 ms
  (`lib/idle-work.ts`). Rodando de uma vez só, a grade congelou a entrada no modo a pé por
  um segundo.

---

## 6. Testes

- Mínimo 80% de cobertura na lógica — projeção 3D→2D, seleção de conteúdo, camada de dados.
- Padrão AAA (`// ARRANGE`, `// ACT`, `// ASSERT`), nome em inglês começando com `should`.
- Um teste por comportamento. Testes isolados, sem depender de ordem.
- Mocke só API externa. Não mocke o Prisma inteiro — use um banco de teste.
- Componente 3D não se testa por screenshot; testa-se a **função pura** que ele usa.
- `npm test` (dentro de `web/`) roda os testes de `web/tests/` com o test runner do Node via
  tsx. Qualidade automática se testa no Chrome real, com janela e sem `?quality=` fixo:
  captura headless que fixa o nível nunca vê a troca de nível.
- Desempenho se compara em **build de produção**, com vsync ligado e a CPU limitada para
  simular máquina fraca. A versão anterior roda ao lado, num worktree de `HEAD`. Rodada sem
  limite de quadros só mede vazão média. O p90 dela mostra a fila da GPU enchendo e
  esvaziando, não engasgo: isso já fez culpar os moradores por um engasgo que não existia.

---

## 7. Git

- Conventional Commits, mensagem em **inglês**, no imperativo.
- 1 commit = 1 razão lógica.
- Branch em kebab-case a partir de `main`: `feature/world-map-camera`.
- Antes de commitar: `npm test`, `npm run lint` e `npx tsc --noEmit` limpos, sem `console.log`.
- Remoto: `origin` = `https://github.com/Ssnowzx/SaltoPia` (privado), branch `main`.
- O commit referencia a change do OpenSpec quando existir:
  `feat: add camera flight (add-serranopolis-experience)`.

> **Nota sobre `tsc`:** `npx tsc --noEmit` só passa **depois** de um `npm run build`, porque
> o Next 16 gera tipos de rota (`LayoutProps`, `PageProps`) em `.next/types`. Em tree limpa,
> rode o build antes.

---

## 8. Comandos

```bash
cd web
npm run dev          # desenvolvimento local
npm run build        # build de produção (gera os tipos de rota)
npm run start        # serve o build de produção na 3001 — é o que se usa para apresentar
npm run lint
npm test             # testes da lógica pura (web/tests/)
npm run test:coverage    # os mesmos, com cobertura
npm run check        # layout, assets, tipos e lint de uma vez
npx tsc --noEmit     # depois do build
npm run db:seed      # reescreve lugares, experiências e cardápios de prisma/content/
npm run images:prompts   # manifesto das fotos que faltam, para o Grok
npm run images:sharpen   # depois de colocar fotos novas (converte, afia, limpa o cache)
npm run build:crests     # brasões na cor de cada lugar
npm run build:logo       # os dois arquivos do logo a partir de logo.png

cd ..
openspec list                    # changes e specs
openspec validate <change>       # precisa passar antes de implementar
openspec status --change <nome>  # o que falta na change
```

---

## 9. Estrutura

```
.
├── CLAUDE.md                  ← este arquivo
├── CONTRIBUTING.md            ← o processo: spec, código, teste, doc, commit
├── CHANGELOG.md               ← Keep a Changelog, por data e change
├── docs/
│   ├── README.md              ← índice da documentação, por disciplina e norma
│   ├── requirements/          ← visão e escopo, SRS (29148), rastreabilidade
│   ├── architecture/          ← arc42 + C4, ADRs, modelo de dados, building blocks
│   ├── testing/               ← plano de testes (29119-3) e relatório
│   ├── manual/                ← manuais: visitante, parceiro, instalação e operação
│   ├── image-prompts.md       ← briefs de imagem para o Grok
│   └── grok/                  ← como gerar as fotos que faltam (manifesto não vai pro git)
├── openspec/
│   ├── config.yaml            ← contexto do projeto, lido pelos workflows
│   ├── specs/                 ← specs vigentes (preenchidas ao arquivar changes)
│   └── changes/               ← changes em andamento
└── web/                       ← a aplicação Next.js
    ├── prisma/                ← schema, migrations e seed
    │   └── content/           ← o conteúdo: lugares, experiências, cardápios
    ├── public/images/         ← heroes, experiences, places/ (galerias), menu/, contest/
    ├── public/models/         ← modelos 3D CC0 + CREDITS.md
    ├── scripts/               ← checks, brasões, logo, fotos, manifesto do Grok
    ├── tests/                 ← testes unitários (npm test)
    └── src/
        ├── app/               ← rotas: /, /[place], /[place]/experiencias/[x], /embaixador
        ├── components/        ← world-map/ (hub 3D), walk-mode/, content/ (páginas), contest/
        ├── lib/               ← camada de dados, helpers
        │   ├── places.ts      ← o único módulo que fala com o banco sobre lugares
        │   ├── world/         ← o mundo gerado em código
        │   ├── walk/          ← modo a pé e moradores, lógica pura
        │   └── contest/       ← texto, calendário e regra do convite do concurso
        └── types/             ← tipos compartilhados (o contrato dos dados)
```
