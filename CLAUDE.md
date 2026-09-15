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
- **Modelo 3D vem de fonte CC0** (Kenney, Quaternius, Poly Pizza) e a origem de cada arquivo
  fica registrada em `web/public/models/CREDITS.md`. CC0 não exige atribuição; trabalho
  acadêmico exige conseguir mostrar de onde veio tudo.

---

## 6. Testes

- Mínimo 80% de cobertura na lógica — projeção 3D→2D, seleção de conteúdo, camada de dados.
- Padrão AAA (`// ARRANGE`, `// ACT`, `// ASSERT`), nome em inglês começando com `should`.
- Um teste por comportamento. Testes isolados, sem depender de ordem.
- Mocke só API externa. Não mocke o Prisma inteiro — use um banco de teste.
- Componente 3D não se testa por screenshot; testa-se a **função pura** que ele usa.

---

## 7. Git

- Conventional Commits, mensagem em **inglês**, no imperativo.
- 1 commit = 1 razão lógica.
- Branch em kebab-case a partir de `main`: `feature/world-map-camera`.
- Antes de commitar: `npm run lint` e `npx tsc --noEmit` limpos, sem `console.log`.
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
npm run lint
npx tsc --noEmit     # depois do build

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
├── docs/
│   └── image-prompts.md       ← briefs de imagem para o Grok
├── openspec/
│   ├── config.yaml            ← contexto do projeto, lido pelos workflows
│   ├── specs/                 ← specs vigentes (preenchidas ao arquivar changes)
│   └── changes/               ← changes em andamento
└── web/                       ← a aplicação Next.js
    ├── prisma/                ← schema e migrations
    ├── public/models/         ← modelos 3D CC0 + CREDITS.md
    └── src/
        ├── app/               ← rotas
        ├── components/
        ├── lib/               ← camada de dados, helpers
        └── types/             ← tipos compartilhados
```
