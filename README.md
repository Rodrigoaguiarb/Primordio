# Primórdio — Servidor do Beta

Jogo de estratégia em ticks (MMO de guerra). Servidor Node.js + SQLite, cliente web mobile-first. Tudo num repositório só.

---

## O que é cada coisa

```
primordio-server/
├── src/
│   ├── server.js        API HTTP (Express) — toda ordem é validada aqui
│   ├── tick.js          o relógio do mundo: roda o fechamento de cada tick
│   ├── combat.js        resolvedor de batalha (fórmula validada)
│   ├── gamedata.js      raças, unidades, pesquisas, constantes (ajuste o balanceamento aqui)
│   ├── db.js            banco SQLite + schema
│   └── sqlite-adapter.js  ponte para o SQLite nativo do Node (sem compilação)
├── public/
│   ├── index.html       o jogo (é o que o jogador abre)
│   └── admin.html       painel de administração (/admin)
└── package.json
```

O banco vive num arquivo (`db/primordio.db`), criado sozinho na primeira execução.

---

## Rodar na sua máquina (teste local)

Precisa de **Node 22 ou superior** (o servidor usa o SQLite nativo do Node, que só existe a partir do 22).

```bash
cd primordio-server
npm install
ADMIN_KEY=escolha-uma-chave npm start
```

Abra:
- **http://localhost:3000** → o jogo
- **http://localhost:3000/admin** → administração (use a ADMIN_KEY)

No admin: **Criar round → Gerar convites → Iniciar**. Depois entre no jogo com um convite.
Para testar rápido sem esperar, use **"Forçar 1 tick"** no admin.

---

## Subir para a internet (Railway)

O Railway é o caminho mais simples: conecta no seu GitHub, detecta o Node sozinho e dá uma URL pública.

### 1. Suba o código para o GitHub
Crie um repositório novo e mande esta pasta para ele (pelo site do GitHub ou por linha de comando).

### 2. No Railway
1. Crie conta em **railway.app** (login com GitHub).
2. **New Project → Deploy from GitHub repo →** escolha o repositório.
3. O Railway detecta `package.json` e roda `npm start` automaticamente.
4. Em **Variables**, adicione:
   - `ADMIN_KEY` = uma senha forte sua (é o que protege o /admin)
5. Em **Settings → Networking → Generate Domain** para ganhar a URL pública.

### 3. Persistência do banco (importante)
Por padrão o Railway apaga arquivos a cada redeploy. Para o mundo não sumir:
1. No serviço, **Settings → Volumes → New Volume**.
2. Monte em `/app/db` (mount path).
3. Adicione a variável `DB_PATH` = `/app/db/primordio.db`.

Pronto — o banco passa a viver no volume e sobrevive a reinícios.

### Custo
Plano Hobby do Railway dá um crédito mensal que cobre folgado um beta deste tamanho (~US$5/mês de uso). Sem cron externo: o próprio servidor roda o tick internamente.

---

## Operação do beta (passo a passo)

1. Entre em `sua-url/admin` com a ADMIN_KEY.
2. **Criar round** — defina duração (1440 ticks = 30 dias a 30min, ou menos para um beta curto) e ritmo (sugiro **120s** para o beta andar rápido).
3. **Gerar convites** — quantos jogadores você quer. Cada código serve para um clã. Toque para copiar.
4. Distribua: o jogador abre `sua-url/`, digita o código + nome do clã + nome do líder, e recebe uma raça sorteada.
5. **Iniciar** — o relógio começa. O mundo avança sozinho a cada intervalo.
6. Acompanhe pelo admin (status, tick, nº de clãs).

**Pausar/retomar** congela o mundo sem perder nada. **Encerrar** trava o ranking e declara o campeão (maior XP). **Resetar** zera tudo e libera os convites de novo.

### Ritmo do tick
Você pode mudar o ritmo a qualquer momento (campo "ritmo do tick" no admin). Começar a 120s para a galera ver o jogo andar, e depois subir para 1800s (30 min) quando virar sério, é uma estratégia boa de beta.

---

## Ajustar o jogo

Quase todo o balanceamento está em **`src/gamedata.js`**, no objeto `CONST`:
- `TAXA_PRODUCAO` — recursos por trabalhador por tick
- `VIAGEM` — ticks de ida/volta de um ataque
- `PROTECAO_TICKS` — proteção de iniciante
- `PISO_TRAB_PROTEGIDO` / `TETO_ROUBO_TICK` — limites do roubo de mercenários
- `RECURSOS_INICIAIS` / `TROPAS_INICIAIS` — com o que cada clã nasce
- `TERRITORIOS` — tamanho do mundo

As tabelas de unidades (`RACAS`) seguem a ordem:
`[classe, A1, A2, A3, Ini, Def, Atq, QAtq, Dano, Vida, Xp, Ouro, Madeira, Alimento, Turno]`

Mudou algo? Só reiniciar o servidor (no Railway, um novo deploy).

---

## Notas técnicas

- **Sem senha por enquanto**: a sessão do jogador é um token guardado no navegador dele. Para um beta fechado por convite, é suficiente. Se quiser login com senha depois, dá para somar.
- **Espionagem e magias**: as pesquisas de espionagem já existem na árvore; os efeitos de espião e as magias entram quando você me passar a tabela (o resolvedor de batalha já está preparado para receber modificadores).
- **Raças**: Humano, Ferlix e Urgrosh estão completas. Elfo, Anão e Norfss entram quando transcrevermos as tabelas que faltam.
