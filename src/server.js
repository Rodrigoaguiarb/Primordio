// ============================================================
// server.js — API HTTP do jogo. O front conversa só com isto.
// Toda ordem é validada aqui (servidor = única fonte de verdade).
// ============================================================
import express from "express";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { db, initSchema } from "./db.js";
import { iniciarAgendador, processarTick } from "./tick.js";
import {
  RACAS, MERC, DESCR, PESQ, CONST, NIVEIS,
  ESPIOES, ESPIONAGEM, chanceEspionagem, forcaEspionagem,
  statsUnidade, classeDaUnidade, pesquisaDaClasse, nivelPorXP
} from "./gamedata.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, "..", "public")));

initSchema();
iniciarAgendador();

// rota amigável: /admin abre a página de administração
app.get("/admin", (req, res) => res.sendFile(join(__dirname, "..", "public", "admin.html")));

const ADMIN_KEY = process.env.ADMIN_KEY || "troque-esta-chave";
const agora = () => Date.now();
const getRound = () => db.prepare("SELECT * FROM round WHERE id=1").get();

// resolve clã pela sessão (header x-token)
function clanDoToken(req) {
  const token = req.header("x-token");
  if (!token) return null;
  return db.prepare("SELECT * FROM clans WHERE token=?").get(token);
}
function exigeClan(req, res) {
  const c = clanDoToken(req);
  if (!c) { res.status(401).json({ erro: "Sessão inválida. Faça login pelo convite." }); return null; }
  return c;
}
function exigeAdmin(req, res) {
  if (req.header("x-admin-key") !== ADMIN_KEY) { res.status(403).json({ erro: "Acesso negado." }); return false; }
  return true;
}

// ---------- DADOS ESTÁTICOS (para o front montar tabelas) ----------
app.get("/api/dados", (req, res) => {
  res.json({ RACAS, MERC, DESCR, PESQ, CONST, NIVEIS, ESPIOES, ESPIONAGEM });
});

// ---------- CADASTRO POR CONVITE ----------
app.post("/api/cadastrar", (req, res) => {
  const round = getRound();
  if (round.status === "encerrado") return res.status(400).json({ erro: "O round foi encerrado." });
  const { convite, cla, lider } = req.body || {};
  if (!convite || !cla || !lider) return res.status(400).json({ erro: "Informe convite, nome do clã e nome do líder." });

  const conv = db.prepare("SELECT * FROM convites WHERE codigo=?").get(convite.trim());
  if (!conv) return res.status(400).json({ erro: "Convite inválido." });
  if (conv.usado_por) return res.status(400).json({ erro: "Este convite já foi usado." });

  // encontra um slot livre (preenche territórios em ordem, para não nascer sozinho)
  const ocupados = db.prepare("SELECT territorio, slot FROM clans").all();
  const ocupSet = new Set(ocupados.map(o => o.territorio + "." + o.slot));
  let escolhido = null;
  for (let t = 1; t <= CONST.TERRITORIOS && !escolhido; t++)
    for (let s = 1; s <= CONST.SLOTS_POR_TERRITORIO && !escolhido; s++)
      if (!ocupSet.has(t + "." + s)) escolhido = { t, s };
  if (!escolhido) return res.status(400).json({ erro: "O mundo está cheio. Aguarde o próximo round." });

  const racas = Object.keys(RACAS);
  const raca = racas[Math.floor(Math.random() * racas.length)];
  const token = nanoid();
  const ini = CONST.RECURSOS_INICIAIS;

  const tx = db.transaction(() => {
    const r = db.prepare(`INSERT INTO clans
      (token, nome, lider, raca, territorio, slot, xp, nivel, ouro, madeira, alimento, trab_livres, protecao, criado_em)
      VALUES (?,?,?,?,?,?,0,1,?,?,?,?,?,?)`)
      .run(token, cla.trim().slice(0, 24), lider.trim().slice(0, 20), raca, escolhido.t, escolhido.s,
        ini.ouro, ini.madeira, ini.alimento, CONST.TROPAS_INICIAIS, CONST.PROTECAO_TICKS, agora());
    const clanId = r.lastInsertRowid;
    db.prepare("UPDATE convites SET usado_por=? WHERE codigo=?").run(clanId, convite.trim());
    // pesquisa inicial
    db.prepare("INSERT OR IGNORE INTO pesquisas (clan_id, pid) VALUES (?,?)").run(clanId, CONST.PESQUISA_INICIAL);
    // 4 slots vazios
    for (let i = 0; i < 4; i++)
      db.prepare("INSERT INTO slots (clan_id, idx, fase, restam, carga) VALUES (?,?,'base',0,0)").run(clanId, i);
    // fundo do território (cria se não existir)
    db.prepare("INSERT OR IGNORE INTO fundos (territorio) VALUES (?)").run(escolhido.t);
  });
  tx();

  res.json({ token, raca, descricao: DESCR[raca], territorio: escolhido.t, slot: escolhido.s });
});

// ---------- ESTADO DO MEU CLÃ ----------
app.get("/api/estado", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const round = getRound();
  const exercito = {};
  db.prepare("SELECT unidade, qtd FROM exercito WHERE clan_id=? AND qtd>0").all(c.id).forEach(r => exercito[r.unidade] = r.qtd);
  const fila = db.prepare("SELECT unidade, qtd, pronto_em FROM fila_tropas WHERE clan_id=?").all(c.id)
    .map(f => ({ ...f, restam: f.pronto_em - round.tick }));
  const pesquisas = db.prepare("SELECT pid FROM pesquisas WHERE clan_id=?").all(c.id).map(r => r.pid);
  const pesqAtivas = db.prepare("SELECT pid, conclui_em FROM fila_pesquisas WHERE clan_id=?").all(c.id)
    .map(p => ({ pid: p.pid, restam: p.conclui_em - round.tick }));
  const slots = db.prepare("SELECT idx, fase, alvo, tropas, restam, carga FROM slots WHERE clan_id=? ORDER BY idx").all(c.id)
    .map(s => ({ ...s, tropas: s.tropas ? JSON.parse(s.tropas) : null }));
  const relatorios = db.prepare("SELECT tick, texto FROM relatorios WHERE clan_id=? ORDER BY id DESC LIMIT 12").all(c.id);

  res.json({ round, clan: c, exercito, fila, pesquisas, pesqAtivas, slots, relatorios });
});

// ---------- ALOCAÇÃO DE TRABALHADORES ----------
app.post("/api/alocar", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const { recurso, delta } = req.body || {};
  const campo = { ouro: "trab_ouro", madeira: "trab_madeira", alimento: "trab_alimento" }[recurso];
  if (!campo) return res.status(400).json({ erro: "Recurso inválido." });
  if (delta > 0 && c.trab_livres <= 0) return res.status(400).json({ erro: "Sem trabalhadores livres." });
  if (delta < 0 && c[campo] <= 0) return res.status(400).json({ erro: "Nada para retirar." });
  const d = delta > 0 ? 1 : -1;
  db.prepare(`UPDATE clans SET ${campo}=${campo}+?, trab_livres=trab_livres-? WHERE id=?`).run(d, d, c.id);
  res.json({ ok: true });
});

// ---------- RECRUTAR ----------
app.post("/api/recrutar", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const { unidade, qtd } = req.body || {};
  const q = Math.max(1, parseInt(qtd) || 1);

  // --- espiões / contra-espiões: unidades permanentes, exigem pesquisa própria ---
  if (ESPIOES[unidade]) {
    const e = ESPIOES[unidade];
    const feita = db.prepare("SELECT 1 FROM pesquisas WHERE clan_id=? AND pid=?").get(c.id, e.pesq);
    if (!feita) return res.status(400).json({ erro: `Pesquise ${PESQ[e.pesq].nome} para produzir ${unidade}.` });
    const custo = { ouro: e.custo.ouro * q, madeira: e.custo.madeira * q, alimento: e.custo.alimento * q };
    if (c.ouro < custo.ouro || c.madeira < custo.madeira || c.alimento < custo.alimento)
      return res.status(400).json({ erro: "Recursos insuficientes." });
    const round = getRound();
    db.transaction(() => {
      db.prepare("UPDATE clans SET ouro=ouro-?, madeira=madeira-?, alimento=alimento-? WHERE id=?")
        .run(custo.ouro, custo.madeira, custo.alimento, c.id);
      db.prepare("INSERT INTO fila_tropas (clan_id, unidade, qtd, pronto_em) VALUES (?,?,?,?)")
        .run(c.id, unidade, q, round.tick + e.ticks);
    })();
    return res.json({ ok: true });
  }

  let u;
  if (unidade === "Mercenário") u = statsUnidade(c.raca, "Mercenário");
  else {
    if (!RACAS[c.raca][unidade]) return res.status(400).json({ erro: "Unidade inexistente." });
    const classe = classeDaUnidade(c.raca, unidade);
    const pid = pesquisaDaClasse(classe);
    if (pid) {
      const feita = db.prepare("SELECT 1 FROM pesquisas WHERE clan_id=? AND pid=?").get(c.id, pid);
      if (!feita) return res.status(400).json({ erro: `Pesquise ${classe} para liberar esta unidade.` });
    }
    u = statsUnidade(c.raca, unidade);
  }
  const custo = { ouro: u.ouro * q, madeira: u.madeira * q, alimento: u.alimento * q };
  if (c.ouro < custo.ouro || c.madeira < custo.madeira || c.alimento < custo.alimento)
    return res.status(400).json({ erro: "Recursos insuficientes." });

  const round = getRound();
  db.transaction(() => {
    db.prepare("UPDATE clans SET ouro=ouro-?, madeira=madeira-?, alimento=alimento-? WHERE id=?")
      .run(custo.ouro, custo.madeira, custo.alimento, c.id);
    db.prepare("INSERT INTO fila_tropas (clan_id, unidade, qtd, pronto_em) VALUES (?,?,?,?)")
      .run(c.id, unidade, q, round.tick + u.turno);
  })();
  res.json({ ok: true });
});

// ---------- PESQUISAR ----------
app.post("/api/pesquisar", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const { pid } = req.body || {};
  const p = PESQ[pid];
  if (!p) return res.status(400).json({ erro: "Pesquisa inexistente." });
  if (db.prepare("SELECT 1 FROM pesquisas WHERE clan_id=? AND pid=?").get(c.id, pid))
    return res.status(400).json({ erro: "Já concluída." });
  // uma pesquisa por cadeia (espionagem permite paralelo entre esp/ctr? aqui: trava por cadeia)
  const ativas = db.prepare("SELECT pid FROM fila_pesquisas WHERE clan_id=?").all(c.id).map(r => r.pid);
  if (ativas.includes(pid)) return res.status(400).json({ erro: "Já em andamento." });
  if (p.cadeia !== "e" && ativas.some(a => PESQ[a].cadeia === p.cadeia))
    return res.status(400).json({ erro: "Esta cadeia já tem pesquisa em andamento." });
  if (p.req && !db.prepare("SELECT 1 FROM pesquisas WHERE clan_id=? AND pid=?").get(c.id, p.req))
    return res.status(400).json({ erro: `Requer ${PESQ[p.req].nome}.` });
  if (c.ouro < p.ouro || c.madeira < p.madeira || c.alimento < p.alimento)
    return res.status(400).json({ erro: "Recursos insuficientes." });

  const round = getRound();
  db.transaction(() => {
    db.prepare("UPDATE clans SET ouro=ouro-?, madeira=madeira-?, alimento=alimento-? WHERE id=?")
      .run(p.ouro, p.madeira, p.alimento, c.id);
    db.prepare("INSERT INTO fila_pesquisas (clan_id, pid, conclui_em) VALUES (?,?,?)")
      .run(c.id, pid, round.tick + p.ticks);
  })();
  res.json({ ok: true });
});

// ---------- ENVIAR SLOT DE ATAQUE ----------
app.post("/api/atacar", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const { idx, alvo, tropas } = req.body || {};
  const slot = db.prepare("SELECT * FROM slots WHERE clan_id=? AND idx=?").get(c.id, idx);
  if (!slot) return res.status(400).json({ erro: "Slot inválido." });
  if (slot.fase !== "base") return res.status(400).json({ erro: "Slot em uso." });

  const [t, s] = String(alvo).split(".").map(Number);
  if (!t || !s || t < 1 || t > CONST.TERRITORIOS || s < 1 || s > CONST.SLOTS_POR_TERRITORIO)
    return res.status(400).json({ erro: "Coordenada inválida." });
  if (t === c.territorio) return res.status(400).json({ erro: "Clãs do seu território são aliados." });
  const alvoClan = db.prepare("SELECT * FROM clans WHERE territorio=? AND slot=?").get(t, s);
  if (!alvoClan) return res.status(400).json({ erro: "Não há clã nessa coordenada." });

  // valida tropas contra o exército real
  const env = {}; let total = 0;
  for (const [u, q] of Object.entries(tropas || {})) {
    const tem = db.prepare("SELECT qtd FROM exercito WHERE clan_id=? AND unidade=?").get(c.id, u);
    const lim = Math.min(parseInt(q) || 0, tem ? tem.qtd : 0);
    if (lim > 0) { env[u] = lim; total += lim; }
  }
  if (total === 0) return res.status(400).json({ erro: "Aloque pelo menos uma tropa." });

  const round = getRound();
  db.transaction(() => {
    for (const [u, q] of Object.entries(env)) {
      db.prepare("UPDATE exercito SET qtd=qtd-? WHERE clan_id=? AND unidade=?").run(q, c.id, u);
    }
    db.prepare("UPDATE slots SET fase='indo', alvo=?, tropas=?, restam=?, carga=0 WHERE clan_id=? AND idx=?")
      .run(alvo, JSON.stringify(env), CONST.VIAGEM, c.id, idx);
  })();
  res.json({ ok: true });
});

// ---------- ESPIONAR ----------
app.post("/api/espionar", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const { alvo, tipo, espioes } = req.body || {};

  if (!ESPIONAGEM.TIPOS[tipo]) return res.status(400).json({ erro: "Tipo de espionagem inválido." });
  const enviar = Math.max(1, parseInt(espioes) || 0);
  if (c.espioes < 1) return res.status(400).json({ erro: "Você não tem espiões. Pesquise Espionagem e produza espiões primeiro." });
  if (enviar > c.espioes) return res.status(400).json({ erro: "Você não tem essa quantidade de espiões." });

  const [t, s] = String(alvo).split(".").map(Number);
  if (!t || !s || t < 1 || t > CONST.TERRITORIOS || s < 1 || s > CONST.SLOTS_POR_TERRITORIO)
    return res.status(400).json({ erro: "Coordenada inválida." });
  if (t === c.territorio && s === c.slot) return res.status(400).json({ erro: "Não dá para espionar a si mesmo." });
  const alvoClan = db.prepare("SELECT * FROM clans WHERE territorio=? AND slot=?").get(t, s);
  if (!alvoClan) return res.status(400).json({ erro: "Não há clã nessa coordenada." });

  const custo = ESPIONAGEM.TIPOS[tipo].custo;
  if (c.ouro < custo.ouro || c.madeira < custo.madeira || c.alimento < custo.alimento)
    return res.status(400).json({ erro: "Recursos insuficientes para a missão." });

  const bonus = ESPIONAGEM.BONUS_RACA[c.raca] || 0;
  const chance = chanceEspionagem(enviar, bonus, alvoClan.contra_espioes || 0, alvoClan.espioes || 0);
  const forca = forcaEspionagem(enviar, bonus, alvoClan.contra_espioes || 0, alvoClan.espioes || 0);
  const sucesso = Math.random() * 100 < chance;

  let revelacao = null;
  db.transaction(() => {
    // custo da missão sempre cobrado
    db.prepare("UPDATE clans SET ouro=ouro-?, madeira=madeira-?, alimento=alimento-? WHERE id=?")
      .run(custo.ouro, custo.madeira, custo.alimento, c.id);

    if (sucesso) {
      if (tipo === "recursos") {
        revelacao = { tipo: "recursos", ouro: alvoClan.ouro, madeira: alvoClan.madeira, alimento: alvoClan.alimento };
      } else {
        // tropas: só o que está NA BASE (exercito). Tropa viajando em slots não conta.
        const naBase = db.prepare("SELECT unidade, qtd FROM exercito WHERE clan_id=? AND qtd>0").all(alvoClan.id);
        // agrega por CLASSE para o estilo "509 LdF, 100 MdG"
        const porClasse = {};
        for (const r of naBase) {
          const cls = classeDaUnidade(alvoClan.raca, r.unidade) || "?";
          porClasse[cls] = (porClasse[cls] || 0) + r.qtd;
        }
        revelacao = { tipo: "tropas", porClasse, detalhe: naBase };
      }
    } else {
      // falhou: perde 10% dos espiões enviados (mínimo 1 se enviou algo)
      const perda = Math.max(1, Math.floor(enviar * ESPIONAGEM.PERDA_FALHA));
      db.prepare("UPDATE clans SET espioes = MAX(0, espioes - ?) WHERE id=?").run(perda, c.id);
      revelacao = { perda };
    }
  })();

  res.json({ ok: true, sucesso, chance, forca, alvo, tipo, revelacao,
    alvoNome: alvoClan.nome });
});

// Prévia: estima força e chance contra um alvo SEM disparar (para a tela mostrar ao vivo).
// Não revela nada do alvo além da estimativa de defesa agregada.
app.post("/api/espionar-previa", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const { alvo, espioes } = req.body || {};
  const enviar = Math.max(1, parseInt(espioes) || 0);
  const [t, s] = String(alvo || "").split(".").map(Number);
  if (!t || !s) return res.status(400).json({ erro: "Coordenada inválida." });
  if (t === c.territorio && s === c.slot) return res.status(400).json({ erro: "Não dá para espionar a si mesmo." });
  const alvoClan = db.prepare("SELECT contra_espioes, espioes FROM clans WHERE territorio=? AND slot=?").get(t, s);
  if (!alvoClan) return res.status(400).json({ erro: "Não há clã nessa coordenada." });
  const bonus = ESPIONAGEM.BONUS_RACA[c.raca] || 0;
  const chance = chanceEspionagem(enviar, bonus, alvoClan.contra_espioes || 0, alvoClan.espioes || 0);
  const forca = forcaEspionagem(enviar, bonus, alvoClan.contra_espioes || 0, alvoClan.espioes || 0);
  res.json({ ok: true, chance, forca, bonus, enviar });
});

// ---------- REFORÇO: enviar tropas para defender um aliado do mesmo território ----------
app.post("/api/reforcar", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const { idx, alvo, tropas } = req.body || {};
  const slot = db.prepare("SELECT * FROM slots WHERE clan_id=? AND idx=?").get(c.id, idx);
  if (!slot) return res.status(400).json({ erro: "Slot inválido." });
  if (slot.fase !== "base") return res.status(400).json({ erro: "Slot em uso." });

  const [t, s] = String(alvo).split(".").map(Number);
  if (!t || !s || t < 1 || t > CONST.TERRITORIOS || s < 1 || s > CONST.SLOTS_POR_TERRITORIO)
    return res.status(400).json({ erro: "Coordenada inválida." });
  if (t === c.territorio && s === c.slot) return res.status(400).json({ erro: "Você não reforça a si mesmo." });
  if (t !== c.territorio) return res.status(400).json({ erro: "Só é possível reforçar aliados do seu próprio território." });
  const aliado = db.prepare("SELECT * FROM clans WHERE territorio=? AND slot=?").get(t, s);
  if (!aliado) return res.status(400).json({ erro: "Não há aliado nessa coordenada." });

  // valida tropas contra o exército real
  const env = {}; let total = 0;
  for (const [u, q] of Object.entries(tropas || {})) {
    const tem = db.prepare("SELECT qtd FROM exercito WHERE clan_id=? AND unidade=?").get(c.id, u);
    const lim = Math.min(parseInt(q) || 0, tem ? tem.qtd : 0);
    if (lim > 0) { env[u] = lim; total += lim; }
  }
  if (total === 0) return res.status(400).json({ erro: "Aloque pelo menos uma tropa." });

  db.transaction(() => {
    for (const [u, q] of Object.entries(env)) {
      db.prepare("UPDATE exercito SET qtd=qtd-? WHERE clan_id=? AND unidade=?").run(q, c.id, u);
    }
    // fase 'reforcando', TDV menor; guarda o destino em 'alvo'
    db.prepare("UPDATE slots SET fase='reforcando', alvo=?, tropas=?, restam=?, carga=0 WHERE clan_id=? AND idx=?")
      .run(alvo, JSON.stringify(env), CONST.VIAGEM_REFORCO, c.id, idx);
  })();
  res.json({ ok: true });
});

// ---------- MOVIMENTAÇÃO: tudo em trânsito (minhas saídas + ataques chegando) ----------
app.get("/api/movimentacao", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const minhaCoord = c.territorio + "." + c.slot;

  // Minhas expedições (slots indo/voltando)
  const meusSlots = db.prepare("SELECT idx, fase, alvo, tropas, restam, carga FROM slots WHERE clan_id=? AND fase!='base' ORDER BY idx").all(c.id);
  const saidas = meusSlots.map(s => {
    const tropas = s.tropas ? JSON.parse(s.tropas) : {};
    const total = Object.values(tropas).reduce((a, b) => a + b, 0);
    let alvoNome = null;
    if (s.alvo) {
      const [t, sl] = s.alvo.split(".").map(Number);
      const ac = db.prepare("SELECT nome FROM clans WHERE territorio=? AND slot=?").get(t, sl);
      alvoNome = ac ? ac.nome : null;
    }
    return { idx: s.idx, fase: s.fase, alvo: s.alvo, alvoNome, ticks: s.restam, totalTropas: total, carga: s.carga };
  });

  // Ataques inimigos vindo CONTRA mim: cada slot de cada clã é uma linha separada.
  // O defensor vê só NOME, TOTAL de tropas (somado, sem tipo) e TDV.
  // Bônus racial Norfss: o total chega como "INDISPONÍVEL" (defensor não sabe quantos vêm).
  const incomingRows = db.prepare(`
    SELECT s.idx, s.restam, s.tropas, cl.nome AS atacante, cl.raca
    FROM slots s JOIN clans cl ON cl.id = s.clan_id
    WHERE s.fase='indo' AND s.alvo=? AND s.clan_id<>?
    ORDER BY s.restam ASC, cl.nome ASC, s.idx ASC
  `).all(minhaCoord, c.id);
  const chegando = incomingRows.map(r => {
    const tropas = r.tropas ? JSON.parse(r.tropas) : {};
    const totalReal = Object.values(tropas).reduce((a, b) => a + b, 0);
    let mostrar;
    if (r.raca === "Norfss") {
      // Bônus Norfss: as unidades RACIAIS dele são invisíveis na movimentação.
      // Só contam as unidades que NÃO são da raça Norfss (ex: Mercenário comum) — a "isca".
      const racaisNorfss = RACAS["Norfss"] || {};
      let visiveis = 0;
      for (const [u, q] of Object.entries(tropas)) {
        if (!racaisNorfss[u]) visiveis += q;  // não é unidade racial Norfss => aparece
      }
      mostrar = visiveis; // pode ser 0 (nada visível) ou o nº de iscas (ex: 2)
    } else {
      mostrar = totalReal;
    }
    return { atacante: r.atacante, ticks: r.restam, totalTropas: mostrar };
  });

  res.json({ ok: true, minhaCoord, saidas, chegando, sobAtaque: chegando.length > 0 });
});

app.post("/api/recuar", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const { idx } = req.body || {};
  const slot = db.prepare("SELECT * FROM slots WHERE clan_id=? AND idx=?").get(c.id, idx);
  if (!slot || slot.fase !== "indo") return res.status(400).json({ erro: "Só é possível recuar durante a ida." });
  const percorrido = CONST.VIAGEM - slot.restam;
  if (percorrido <= 0) {
    const tropas = JSON.parse(slot.tropas || "{}");
    db.transaction(() => {
      for (const [u, q] of Object.entries(tropas)) if (q > 0)
        db.prepare(`INSERT INTO exercito (clan_id, unidade, qtd) VALUES (?,?,?)
          ON CONFLICT(clan_id, unidade) DO UPDATE SET qtd=qtd+excluded.qtd`).run(c.id, u, q);
      db.prepare("UPDATE slots SET fase='base', alvo=NULL, tropas=NULL, restam=0 WHERE clan_id=? AND idx=?").run(c.id, idx);
    })();
  } else {
    db.prepare("UPDATE slots SET fase='voltando', restam=? WHERE clan_id=? AND idx=?").run(percorrido, c.id, idx);
  }
  res.json({ ok: true });
});

// ---------- TERRITÓRIO / MUNDO ----------
app.get("/api/territorio/:t", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const t = parseInt(req.params.t);
  const ocupados = db.prepare("SELECT nome, lider, raca, territorio, slot, nivel, bandeira FROM clans WHERE territorio=?").all(t);
  const mapa = {};
  ocupados.forEach(o => mapa[o.slot] = o);
  const slots = [];
  for (let s = 1; s <= CONST.SLOTS_POR_TERRITORIO; s++) {
    const o = mapa[s];
    slots.push(o
      ? { coord: t + "." + s, nome: o.nome, lider: o.lider, nivel: o.nivel, bandeira: o.bandeira, meu: (o.territorio === c.territorio && o.slot === c.slot), raca: undefined }
      : { coord: t + "." + s, vazio: true });
  }
  res.json({ territorio: t, slots });
});

// ---------- RANKING ----------
app.get("/api/ranking", (req, res) => {
  const rk = db.prepare("SELECT nome, lider, territorio, slot, xp FROM clans ORDER BY xp DESC LIMIT 100").all();
  res.json(rk.map((r, i) => ({ pos: i + 1, cla: r.nome, lider: r.lider, coord: r.territorio + "." + r.slot, xp: r.xp })));
});

// ---------- FUNDO + GOVERNANÇA ----------
function liderDoTerritorio(t) {
  const clans = db.prepare("SELECT territorio, slot FROM clans WHERE territorio=?").all(t).map(c => c.territorio + "." + c.slot);
  const votos = {}; clans.forEach(c => votos[c] = 0);
  db.prepare("SELECT voto FROM clans WHERE territorio=? AND voto IS NOT NULL").all(t).forEach(r => {
    if (votos[r.voto] !== undefined) votos[r.voto]++;
  });
  let lider = null, max = -1;
  for (const [c, v] of Object.entries(votos)) if (v > max) { max = v; lider = c; }
  return { lider, votos };
}
app.get("/api/fundo", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  db.prepare("INSERT OR IGNORE INTO fundos (territorio) VALUES (?)").run(c.territorio);
  const f = db.prepare("SELECT * FROM fundos WHERE territorio=?").get(c.territorio);
  const { lider, votos } = liderDoTerritorio(c.territorio);
  const clans = db.prepare("SELECT nome, territorio, slot FROM clans WHERE territorio=?").all(c.territorio)
    .map(x => ({ coord: x.territorio + "." + x.slot, nome: x.nome, votos: votos[x.territorio + "." + x.slot] || 0 }));
  const minha = c.territorio + "." + c.slot;
  res.json({ fundo: f, lider, conselheiro: f.conselheiro, clans, souLider: lider === minha,
    podeRetirar: lider === minha || f.conselheiro === minha, minhaCoord: minha, meuVoto: c.voto });
});
app.post("/api/fundo/doar", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const { ouro = 0, madeira = 0, alimento = 0 } = req.body || {};
  const o = Math.max(0, parseInt(ouro) || 0), m = Math.max(0, parseInt(madeira) || 0), a = Math.max(0, parseInt(alimento) || 0);
  if (o + m + a === 0) return res.json({ ok: true });
  if (c.ouro < o || c.madeira < m || c.alimento < a) return res.status(400).json({ erro: "Recursos insuficientes." });
  db.transaction(() => {
    db.prepare("UPDATE clans SET ouro=ouro-?, madeira=madeira-?, alimento=alimento-? WHERE id=?").run(o, m, a, c.id);
    db.prepare("INSERT OR IGNORE INTO fundos (territorio) VALUES (?)").run(c.territorio);
    db.prepare("UPDATE fundos SET ouro=ouro+?, madeira=madeira+?, alimento=alimento+? WHERE territorio=?").run(o, m, a, c.territorio);
  })();
  res.json({ ok: true });
});
app.post("/api/fundo/retirar", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const f = db.prepare("SELECT * FROM fundos WHERE territorio=?").get(c.territorio);
  const { lider } = liderDoTerritorio(c.territorio);
  const minha = c.territorio + "." + c.slot;
  if (lider !== minha && f.conselheiro !== minha) return res.status(403).json({ erro: "Só líder ou conselheiro retiram." });
  const { ouro = 0, madeira = 0, alimento = 0 } = req.body || {};
  const o = Math.max(0, parseInt(ouro) || 0), m = Math.max(0, parseInt(madeira) || 0), a = Math.max(0, parseInt(alimento) || 0);
  if (f.ouro < o || f.madeira < m || f.alimento < a) return res.status(400).json({ erro: "Saldo insuficiente no fundo." });
  db.transaction(() => {
    db.prepare("UPDATE fundos SET ouro=ouro-?, madeira=madeira-?, alimento=alimento-? WHERE territorio=?").run(o, m, a, c.territorio);
    db.prepare("UPDATE clans SET ouro=ouro+?, madeira=madeira+?, alimento=alimento+? WHERE id=?").run(o, m, a, c.id);
  })();
  res.json({ ok: true });
});
app.post("/api/votar", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const { coord } = req.body || {};
  db.prepare("UPDATE clans SET voto=? WHERE id=?").run(coord, c.id);
  // se o líder mudou, derruba conselheiro nomeado pelo líder anterior
  const f = db.prepare("SELECT * FROM fundos WHERE territorio=?").get(c.territorio);
  const { lider } = liderDoTerritorio(c.territorio);
  if (f && f.conselheiro && f.nomeado_por && lider !== f.nomeado_por) {
    db.prepare("UPDATE fundos SET conselheiro=NULL, nomeado_por=NULL WHERE territorio=?").run(c.territorio);
  }
  res.json({ ok: true });
});
app.post("/api/nomear", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const minha = c.territorio + "." + c.slot;
  const { lider } = liderDoTerritorio(c.territorio);
  if (lider !== minha) return res.status(403).json({ erro: "Só o líder nomeia." });
  const { coord } = req.body || {};
  db.prepare("UPDATE fundos SET conselheiro=?, nomeado_por=? WHERE territorio=?").run(coord, minha, c.territorio);
  res.json({ ok: true });
});

// ---------- BANDEIRA / NOME DO TERRITÓRIO ----------
app.post("/api/territorio-editar", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const { terrNome, bandeira } = req.body || {};
  if (terrNome !== undefined) db.prepare("UPDATE clans SET terr_nome=? WHERE id=?").run(String(terrNome).slice(0, 28), c.id);
  if (bandeira !== undefined) db.prepare("UPDATE clans SET bandeira=? WHERE id=?").run(parseInt(bandeira) || 0, c.id);
  res.json({ ok: true });
});

// ---------- MUDAR DE COORDENADA (jogar perto de amigos) ----------
// 1ª mudança gratuita; 2ª em diante reservada para o Título (pago, futuro).
app.post("/api/mudar-coordenada", (req, res) => {
  const c = exigeClan(req, res); if (!c) return;
  const { destino } = req.body || {};

  if (c.fichas_mudanca <= 0)
    return res.status(400).json({ erro: "Você já usou sua mudança gratuita. Mudanças extras chegam com o Título." });

  // trava: não pode mudar com expedições em viagem (evita fuga de combate)
  const emViagem = db.prepare("SELECT COUNT(*) n FROM slots WHERE clan_id=? AND fase!='base'").get(c.id).n;
  if (emViagem > 0)
    return res.status(400).json({ erro: "Recolha suas expedições antes de mudar de território." });

  const [t, s] = String(destino).split(".").map(Number);
  if (!t || !s || t < 1 || t > CONST.TERRITORIOS || s < 1 || s > CONST.SLOTS_POR_TERRITORIO)
    return res.status(400).json({ erro: "Coordenada inválida (ex.: 7.3)." });
  if (t === c.territorio && s === c.slot)
    return res.status(400).json({ erro: "Você já está nessa coordenada." });

  const ocupado = db.prepare("SELECT id FROM clans WHERE territorio=? AND slot=?").get(t, s);
  if (ocupado) return res.status(400).json({ erro: "Essa coordenada já está ocupada. Escolha um slot vazio." });

  db.transaction(() => {
    db.prepare("UPDATE clans SET territorio=?, slot=?, fichas_mudanca=fichas_mudanca-1, voto=NULL WHERE id=?")
      .run(t, s, c.id);
    // garante que o fundo do território de destino exista
    db.prepare("INSERT OR IGNORE INTO fundos (territorio) VALUES (?)").run(t);
  })();

  res.json({ ok: true, territorio: t, slot: s });
});

// ============================================================
// ADMIN
// ============================================================
app.get("/api/admin/estado", (req, res) => {
  if (!exigeAdmin(req, res)) return;
  const round = getRound();
  const nClans = db.prepare("SELECT COUNT(*) n FROM clans").get().n;
  const convites = db.prepare("SELECT codigo, usado_por FROM convites ORDER BY criado_em").all();
  res.json({ round, nClans, convites });
});
app.post("/api/admin/convites", (req, res) => {
  if (!exigeAdmin(req, res)) return;
  const n = Math.min(100, Math.max(1, parseInt(req.body?.quantidade) || 10));
  const codigos = [];
  const ins = db.prepare("INSERT INTO convites (codigo, criado_em) VALUES (?,?)");
  db.transaction(() => {
    for (let i = 0; i < n; i++) { const cod = "PRIM-" + nanoid(6).toUpperCase(); ins.run(cod, agora()); codigos.push(cod); }
  })();
  res.json({ codigos });
});
app.post("/api/admin/round", (req, res) => {
  if (!exigeAdmin(req, res)) return;
  const { acao, duracao, tick_segundos } = req.body || {};
  const round = getRound();
  if (acao === "criar") {
    db.prepare("UPDATE round SET status='inscricoes', tick=0, duracao=?, tick_segundos=?, ultimo_tick_em=0 WHERE id=1")
      .run(parseInt(duracao) || 1440, parseInt(tick_segundos) || 120);
  } else if (acao === "iniciar") {
    if (round.status === "encerrado") return res.status(400).json({ erro: "Round encerrado — crie um novo." });
    db.prepare("UPDATE round SET status='ativo', ultimo_tick_em=? WHERE id=1").run(agora());
  } else if (acao === "pausar") {
    db.prepare("UPDATE round SET status=? WHERE id=1").run(round.status === "ativo" ? "pausado" : "ativo");
  } else if (acao === "encerrar") {
    db.prepare("UPDATE round SET status='encerrado' WHERE id=1").run();
  } else if (acao === "tick_manual") {
    const r = processarTick();
    return res.json({ ok: true, tick: r });
  } else if (acao === "ritmo") {
    db.prepare("UPDATE round SET tick_segundos=? WHERE id=1").run(parseInt(tick_segundos) || 120);
  } else if (acao === "resetar") {
    db.transaction(() => {
      for (const t of ["clans", "exercito", "fila_tropas", "pesquisas", "fila_pesquisas", "slots", "fundos", "relatorios"])
        db.prepare(`DELETE FROM ${t}`).run();
      db.prepare("UPDATE convites SET usado_por=NULL").run();
      db.prepare("UPDATE round SET status='inscricoes', tick=0, ultimo_tick_em=0 WHERE id=1").run();
    })();
  } else return res.status(400).json({ erro: "Ação desconhecida." });
  res.json({ ok: true, round: getRound() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Primórdio rodando na porta ${PORT}`));
