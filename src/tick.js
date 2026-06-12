// ============================================================
// tick.js — o relógio do mundo. Roda o fechamento de cada tick
// para todos os clãs de uma vez, dentro de uma transação.
// ============================================================
import { db } from "./db.js";
import { CONST, PESQ, nivelPorXP } from "./gamedata.js";
import { resolverBatalha } from "./combat.js";

function getRound() { return db.prepare("SELECT * FROM round WHERE id = 1").get(); }

// resolve qual clã ocupa uma coordenada "t.s"
function clanEmCoord(coord) {
  const [t, s] = String(coord).split(".").map(Number);
  if (!t || !s) return null;
  return db.prepare("SELECT * FROM clans WHERE territorio = ? AND slot = ?").get(t, s);
}

// processa UM tick para o mundo inteiro
export function processarTick() {
  const round = getRound();
  if (round.status !== "ativo") return { rodou: false, motivo: round.status };

  const novoTick = round.tick + 1;

  const tx = db.transaction(() => {
    const clans = db.prepare("SELECT * FROM clans").all();

    for (const c of clans) {
      // 1) produção
      const ouro = c.ouro + c.trab_ouro * CONST.TAXA_PRODUCAO;
      const madeira = c.madeira + c.trab_madeira * CONST.TAXA_PRODUCAO;
      const alimento = c.alimento + c.trab_alimento * CONST.TAXA_PRODUCAO;
      const protecao = Math.max(0, c.protecao - 1);
      db.prepare("UPDATE clans SET ouro=?, madeira=?, alimento=?, protecao=? WHERE id=?")
        .run(ouro, madeira, alimento, protecao, c.id);

      // 2) fila de tropas prontas neste tick
      const prontas = db.prepare("SELECT * FROM fila_tropas WHERE clan_id=? AND pronto_em<=?").all(c.id, novoTick);
      for (const f of prontas) {
        if (f.unidade === "Espião") {
          db.prepare("UPDATE clans SET espioes = espioes + ? WHERE id=?").run(f.qtd, c.id);
        } else if (f.unidade === "Contra-Espião") {
          db.prepare("UPDATE clans SET contra_espioes = contra_espioes + ? WHERE id=?").run(f.qtd, c.id);
        } else {
          db.prepare(`INSERT INTO exercito (clan_id, unidade, qtd) VALUES (?,?,?)
                      ON CONFLICT(clan_id, unidade) DO UPDATE SET qtd = qtd + excluded.qtd`)
            .run(c.id, f.unidade, f.qtd);
        }
        db.prepare("DELETE FROM fila_tropas WHERE id=?").run(f.id);
      }

      // 3) pesquisas concluídas
      const pesq = db.prepare("SELECT * FROM fila_pesquisas WHERE clan_id=? AND conclui_em<=?").all(c.id, novoTick);
      for (const p of pesq) {
        db.prepare("INSERT OR IGNORE INTO pesquisas (clan_id, pid) VALUES (?,?)").run(c.id, p.pid);
        db.prepare("DELETE FROM fila_pesquisas WHERE id=?").run(p.id);
      }
    }

    // 4) slots de ataque (separado, pois batalhas leem o estado dos defensores)
    const slots = db.prepare("SELECT * FROM slots WHERE fase != 'base'").all();
    for (const s of slots) {
      const restam = s.restam - 1;
      if (s.fase === "indo") {
        if (restam > 0) {
          db.prepare("UPDATE slots SET restam=? WHERE clan_id=? AND idx=?").run(restam, s.clan_id, s.idx);
        } else {
          resolverChegada(s, novoTick);
        }
      } else if (s.fase === "voltando") {
        if (restam > 0) {
          db.prepare("UPDATE slots SET restam=? WHERE clan_id=? AND idx=?").run(restam, s.clan_id, s.idx);
        } else {
          // tropas voltam ao exército; carga vira trabalhadores livres
          const tropas = JSON.parse(s.tropas || "{}");
          for (const [u, q] of Object.entries(tropas)) {
            if (q > 0) db.prepare(`INSERT INTO exercito (clan_id, unidade, qtd) VALUES (?,?,?)
              ON CONFLICT(clan_id, unidade) DO UPDATE SET qtd = qtd + excluded.qtd`).run(s.clan_id, u, q);
          }
          if (s.carga > 0) db.prepare("UPDATE clans SET trab_livres = trab_livres + ? WHERE id=?").run(s.carga, s.clan_id);
          db.prepare("UPDATE slots SET fase='base', alvo=NULL, tropas=NULL, restam=0, carga=0 WHERE clan_id=? AND idx=?")
            .run(s.clan_id, s.idx);
        }
      } else if (s.fase === "reforcando") {
        if (restam > 0) {
          db.prepare("UPDATE slots SET restam=? WHERE clan_id=? AND idx=?").run(restam, s.clan_id, s.idx);
        } else {
          // chegou no aliado: as tropas entram na DEFESA dele (exército do aliado)
          const aliado = clanEmCoord(s.alvo);
          const tropas = JSON.parse(s.tropas || "{}");
          const atacante = db.prepare("SELECT nome, territorio FROM clans WHERE id=?").get(s.clan_id);
          if (aliado && aliado.territorio === atacante.territorio) {
            for (const [u, q] of Object.entries(tropas)) {
              if (q > 0) db.prepare(`INSERT INTO exercito (clan_id, unidade, qtd) VALUES (?,?,?)
                ON CONFLICT(clan_id, unidade) DO UPDATE SET qtd = qtd + excluded.qtd`).run(aliado.id, u, q);
            }
            const totalR = Object.values(tropas).reduce((a,b)=>a+b,0);
            db.prepare("INSERT INTO relatorios (clan_id, tick, texto, criado_em) VALUES (?,?,?,?)")
              .run(aliado.id, novoTick, `Reforço de ${atacante.nome} chegou: +${totalR} tropa(s) na sua defesa.`, Date.now());
            db.prepare("INSERT INTO relatorios (clan_id, tick, texto, criado_em) VALUES (?,?,?,?)")
              .run(s.clan_id, novoTick, `Seu reforço chegou em ${s.alvo} e reforçou a defesa do aliado.`, Date.now());
          } else {
            // aliado sumiu/mudou: tropas voltam para quem enviou
            for (const [u, q] of Object.entries(tropas)) {
              if (q > 0) db.prepare(`INSERT INTO exercito (clan_id, unidade, qtd) VALUES (?,?,?)
                ON CONFLICT(clan_id, unidade) DO UPDATE SET qtd = qtd + excluded.qtd`).run(s.clan_id, u, q);
            }
          }
          db.prepare("UPDATE slots SET fase='base', alvo=NULL, tropas=NULL, restam=0, carga=0 WHERE clan_id=? AND idx=?")
            .run(s.clan_id, s.idx);
        }
      }
    }
    for (const c of db.prepare("SELECT id, xp FROM clans").all()) {
      db.prepare("UPDATE clans SET nivel=? WHERE id=?").run(nivelPorXP(c.xp), c.id);
    }

    // 6) avança o relógio; encerra se chegou ao fim
    const status = novoTick >= round.duracao ? "encerrado" : "ativo";
    db.prepare("UPDATE round SET tick=?, status=?, ultimo_tick_em=? WHERE id=1")
      .run(novoTick, status, Date.now());
  });

  tx();
  return { rodou: true, tick: novoTick };
}

// resolve a chegada de um slot ao alvo
function resolverChegada(s, tick) {
  const atacante = db.prepare("SELECT * FROM clans WHERE id=?").get(s.clan_id);
  const alvo = clanEmCoord(s.alvo);
  const tropasAtk = JSON.parse(s.tropas || "{}");

  const registrar = (txt) => db.prepare("INSERT INTO relatorios (clan_id, tick, texto, criado_em) VALUES (?,?,?,?)")
    .run(s.clan_id, tick, txt, Date.now());

  // alvo inexistente, vazio ou aliado (mesmo território) → retorno imediato
  if (!alvo || alvo.territorio === atacante.territorio) {
    registrar(`Chegou em ${s.alvo} e não encontrou alvo inimigo válido — retorno imediato.`);
    db.prepare("UPDATE slots SET fase='voltando', restam=? WHERE clan_id=? AND idx=?").run(CONST.VIAGEM, s.clan_id, s.idx);
    return;
  }

  // defensor protegido → não pode ser atacado
  if (alvo.protecao > 0) {
    registrar(`Alvo ${s.alvo} está sob proteção de iniciante — ataque cancelado, retorno imediato.`);
    db.prepare("UPDATE slots SET fase='voltando', restam=? WHERE clan_id=? AND idx=?").run(CONST.VIAGEM, s.clan_id, s.idx);
    return;
  }

  // monta exércitos
  const atkStacks = Object.entries(tropasAtk).filter(([, q]) => q > 0)
    .map(([u, q]) => ({ nome: u, count: q, raca: atacante.raca }));
  const defEx = db.prepare("SELECT unidade, qtd FROM exercito WHERE clan_id=? AND qtd>0").all(alvo.id);
  const defStacks = defEx.map(r => ({ nome: r.unidade, count: r.qtd, raca: alvo.raca }));
  const trabDef = alvo.trab_ouro + alvo.trab_madeira + alvo.trab_alimento;

  const r = resolverBatalha(atkStacks, defStacks, {
    trabalhadores: trabDef, piso: CONST.PISO_TRAB_PROTEGIDO,
    teto: CONST.TETO_ROUBO_TICK, taxaRoubo: CONST.TAXA_ROUBO_MERC
  });

  // XP com penalidade por nível (3+ abaixo)
  const dif = atacante.nivel - alvo.nivel;
  const fator = dif >= 3 ? 0.05 : 1;
  const ganhoAtk = Math.round(r.xpAtk * fator);
  const ganhoDef = r.xpDef; // defensor sempre ganha cheio

  db.prepare("UPDATE clans SET xp = xp + ? WHERE id=?").run(ganhoAtk, atacante.id);
  db.prepare("UPDATE clans SET xp = xp + ? WHERE id=?").run(ganhoDef, alvo.id);

  // defensor perde tropas mortas
  for (const r2 of defEx) {
    const sobra = r.sobreviventesDef[r2.unidade] ?? 0;
    if (sobra <= 0) db.prepare("DELETE FROM exercito WHERE clan_id=? AND unidade=?").run(alvo.id, r2.unidade);
    else db.prepare("UPDATE exercito SET qtd=? WHERE clan_id=? AND unidade=?").run(sobra, alvo.id, r2.unidade);
  }

  // defensor perde os trabalhadores roubados (saem dos alocados, proporcionalmente)
  if (r.roubados > 0) {
    let restante = r.roubados;
    for (const campo of ["trab_ouro", "trab_madeira", "trab_alimento"]) {
      if (restante <= 0) break;
      const atual = alvo[campo];
      const tira = Math.min(atual, restante);
      if (tira > 0) {
        db.prepare(`UPDATE clans SET ${campo} = ${campo} - ? WHERE id=?`).run(tira, alvo.id);
        restante -= tira;
      }
    }
  }

  // slot inicia retorno com sobreviventes + carga roubada
  db.prepare("UPDATE slots SET fase='voltando', tropas=?, carga=?, restam=? WHERE clan_id=? AND idx=?")
    .run(JSON.stringify(r.sobreviventesAtk), r.roubados, CONST.VIAGEM, s.clan_id, s.idx);

  const relAtk = `⚔ Ataque a ${s.alvo} (${alvo.nome}, nível ${alvo.nivel}): você abateu ${r.mortosDef}, perdeu ${r.mortosAtk}. XP +${ganhoAtk}${fator < 1 ? " (alvo 3+ níveis abaixo)" : ""}${r.roubados > 0 ? ` · roubou ${r.roubados} trabalhador(es)` : ""}. Sobreviventes em retorno.`;
  const relDef = `🛡 Você foi atacado por ${atacante.nome} (${atacante.territorio}.${atacante.slot}): perdeu ${r.mortosDef} tropa(s)${r.roubados > 0 ? ` e ${r.roubados} trabalhador(es)` : ""}, abateu ${r.mortosAtk} do inimigo. XP +${ganhoDef}.`;
  registrar(relAtk);
  db.prepare("INSERT INTO relatorios (clan_id, tick, texto, criado_em) VALUES (?,?,?,?)").run(alvo.id, tick, relDef, Date.now());
}

// ============================================================
// Agendador: verifica a cada 5s se já passou o intervalo do tick.
// Assim o ritmo (tick_segundos) é configurável pelo admin em runtime,
// e o servidor recupera ticks perdidos se ficar fora do ar.
// ============================================================
export function iniciarAgendador() {
  setInterval(() => {
    const round = getRound();
    if (round.status !== "ativo") return;
    const agora = Date.now();
    const intervalo = round.tick_segundos * 1000;
    if (agora - round.ultimo_tick_em >= intervalo) {
      const res = processarTick();
      if (res.rodou) console.log(`[tick] mundo avançou para o tick ${res.tick}`);
    }
  }, 5000);
}
