# Manual de instalação e operação

| | |
| --- | --- |
| Documento | Manual técnico: instalação, operação e solução de problemas |
| Versão | 1.0, 28/09/2026 |
| Público | Quem instala, roda, atualiza o conteúdo ou apresenta o Saltopia |
| Relacionados | [Manual do visitante](manual-do-visitante.md) · [Manual do parceiro](manual-do-parceiro.md) · [Arquitetura](../architecture/README.md) · [`CONTRIBUTING.md`](../../CONTRIBUTING.md) |

## 1. Requisitos

| Item | Versão | Para quê |
| --- | --- | --- |
| Node.js | 20 ou mais novo | Rodar a aplicação e os scripts |
| Docker Desktop | atual | Subir o banco MariaDB |
| Python 3 com Pillow | 3 | Só para reconstruir o logo e tratar fotos |
| Navegador com WebGL2 | Chrome recomendado | Ver o mapa 3D |
| Grok CLI (Grok Build) | opcional | Gerar fotos que faltarem |

## 2. Instalação

```bash
git clone https://github.com/Ssnowzx/SaltoPia.git
cd SaltoPia

docker compose up -d            # MariaDB na porta 3307 e Adminer na 8080
cd web
npm install
cp .env.example .env            # já aponta para o banco do Docker
npx prisma migrate dev          # cria as tabelas
npm run db:seed                 # 15 lugares, 25 experiências, 135 itens de cardápio
npm run dev                     # http://localhost:3001
```

O banco sobe com usuário, senha e nome `serranopolis`, e o `.env.example` já traz esse
endereço (`127.0.0.1:3307`). O Adminer, em `http://localhost:8080`, mostra o banco pelo
navegador (servidor `db`).

## 3. Operação

### 3.1 Rodar

| Comando (em `web/`) | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento na porta 3001 |
| `npm run build` e `npm start` | Build de produção e servidor de produção (porta 3001) |
| `npm run db:up` / `npm run db:down` | Sobe ou para o banco (o mesmo que `docker compose`) |
| `npm run db:studio` | Abre o Prisma Studio para ver os dados |

### 3.2 Atualizar o conteúdo

O conteúdo não se edita no banco: ele mora em arquivos, e o seed grava no banco.

| Para mudar | Edite | Depois rode |
| --- | --- | --- |
| Texto, cor, oferta ou posição de um lugar; as experiências | `web/prisma/content/places.ts` | `npm run db:seed` |
| O cardápio de um lugar | `web/prisma/content/menus.ts` | `npm run db:seed` |
| Os textos do concurso | `web/src/lib/contest/content.ts` | nada: vale no próximo carregamento |
| A cor de um lugar (e o brasão) | `accent` em `places.ts` | `npm run db:seed` e `npm run build:crests` |

O seed é a fonte da verdade. Ele reescreve todos os campos a cada execução e apaga lugares
que não estejam mais no arquivo. Os limites de texto e as regras de cor são conferidos
por `npm test`. Um texto grande demais ou uma cor proibida fazem o teste falhar.

### 3.3 Fotos

1. `npm run images:prompts` lista, em `docs/grok/manifest.jsonl`, as fotos que ainda não
   existem, cada uma com o prompt completo.
2. O Grok Build gera as fotos a partir do manifesto (a instrução pronta está em
   `docs/grok/README.md`).
3. `npm run images:sharpen` converte PNG e JPEG para WebP, recupera a nitidez e limpa o
   cache de imagens.
4. `npm run check:assets` conta o que ainda falta.

Enquanto a foto de um item do cardápio não existe, a página mostra um substituto desenhado
no lugar dela, e nunca uma imagem quebrada.

### 3.4 Verificar antes de apresentar ou publicar

```bash
npm test               # 107 testes da lógica e do conteúdo
npm run check          # layout do mundo, assets, tipos e lint
npm run build          # build de produção de todas as páginas
```

**Apresente com o build de produção**, não com o `npm run dev`: depois do `npm run build`,
rode `npm run start` e abra `http://localhost:3001`. O servidor de desenvolvimento compila
cada página na primeira visita e fica disputando a CPU com o navegador. Numa máquina fraca,
a primeira abertura demora mais e o mapa tem menos fôlego.

Para demonstrar o convite do concurso de novo na mesma sessão, abra qualquer página com
`?convite` no endereço, por exemplo `http://localhost:3001/?convite`.

## 4. Solução de problemas

| Sintoma | Causa | Solução |
| --- | --- | --- |
| Prisma: "Authentication failed" (P1000) | Já existe um MySQL na porta 3306 e ele respondeu no lugar do container | Use a porta **3307**, como no `.env.example` |
| `prisma migrate dev` falha ao criar o *shadow database* | O usuário do banco não tem permissão de DDL | O grant está em `docker/mariadb-init/` e só roda num volume vazio. Recrie o banco: `docker compose down -v && docker compose up -d` (**apaga os dados**) |
| `migrate` falha logo depois do `docker compose up` | O MariaDB ainda não aceita conexões | Espere o container ficar *healthy* (`docker ps`) |
| Troquei uma foto e a tela não mudou | O otimizador de imagens guarda a cópia pela URL | Rode `npm run images:sharpen`, que limpa o cache certo. Para visitantes, uma imagem que muda de conteúdo precisa de um nome novo |
| `npx tsc --noEmit` reclama de `LayoutProps` ou `PageProps` | Os tipos de rota só existem depois do build | Rode `npm run build` antes |
| Uma página dá erro 500 depois de mudar o `schema.prisma` | O servidor de desenvolvimento carregou o cliente Prisma antigo | Rode `npx prisma generate` e reinicie o `npm run dev` |
| O mapa fica em branco num computador | Falta WebGL2, ou a aba está em segundo plano | Use Chrome com aceleração de hardware. O mapa reduz a qualidade sozinho em máquinas lentas |
| Quero forçar uma qualidade do mapa | Para testes | `?quality=low`, `medium` ou `high` no endereço |
| O mapa fica lento ou engasga numa máquina fraca | Rodando com `npm run dev`, ou uma placa de vídeo fraca | Use `npm run build` e `npm run start`. O mapa baixa a qualidade sozinho em poucos segundos; para começar já leve, abra com `?quality=low` |

## 5. Publicação (futura)

A publicação numa VPS está planejada e não exige mudar código:
1. Configure `DATABASE_URL` no `.env` do servidor.
2. Rode `npx prisma migrate deploy`. Ele não usa *shadow database*, e o usuário de produção
   **não** deve receber o grant de DDL.
3. Rode `npm run db:seed`, `npm run build` e `npm start`, atrás de um proxy HTTPS.
