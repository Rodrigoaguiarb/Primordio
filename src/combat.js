// ============================================================
// combat.js — resolvedor de batalha (Modelo 2, pilha com transbordo)
// Portado do protótipo já validado pelo Rodrigo.
// ============================================================
import { statsUnidade } from "./gamedata.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// atkStacks/defStacks: [{ nome, count, raca }]
// cfg: { trabalhadores, piso, teto, taxaRoubo }
// Retorna: { sobreviventesAtk, sobreviventesDef, xpAtk, xpDef, roubados, mortosAtk, mortosDef, log }
export function resolverBatalha(atkStacks, defStacks, cfg) {
  const mk = (s, side) => ({
    nome: s.nome, count: s.count, u: statsUnidade(s.raca, s.nome),
    side, pool: 0, mortos: 0
  });
  const stacks = [...atkStacks.map(s => mk(s, "ATK")), ...defStacks.map(s => mk(s, "DEF"))];
  let trab = cfg.trabalhadores ?? 0, roubados = 0;
  const xp = { ATK: 0, DEF: 0 };
  const log = [];

  for (let turno = 1; turno <= 3; turno++) {
    const fila = stacks
      .filter(s => s.count > 0)
      .sort((a, b) => a.u.ini - b.u.ini ||
        (a.side === b.side ? a.nome.localeCompare(b.nome) : (a.side === "DEF" ? -1 : 1)));

    for (const ator of fila) {
      if (ator.count <= 0) continue; // morreu para Ini mais baixa

      // Mercenário: rouba trabalhadores
      if (ator.u.a1 === "Trab") {
        if (ator.side !== "ATK") continue;
        const disp = Math.max(0, trab - (cfg.piso ?? 0));
        const margem = Math.max(0, (cfg.teto ?? 0) - roubados);
        const lev = Math.min(Math.round(ator.count * (cfg.taxaRoubo ?? 0.2)), disp, margem);
        if (lev > 0) { trab -= lev; roubados += lev; }
        continue;
      }

      const inimigos = stacks.filter(s => s.side !== ator.side && s.count > 0);
      let alvos = null;
      for (const c of [ator.u.a1, ator.u.a2, ator.u.a3]) {
        if (!c) break;
        const t = inimigos.filter(s => s.u.classe === c);
        if (t.length) { alvos = t; break; }
      }
      if (!alvos) continue; // espectador

      const total = ator.count * ator.u.qatq;
      if (total <= 0) continue;
      const base = Math.floor(total / alvos.length);
      const resto = total % alvos.length;

      alvos.forEach((alvo, idx) => {
        const atq = base + (idx < resto ? 1 : 0);
        if (atq <= 0) return;
        const mult = clamp(1 + 0.05 * (ator.u.atq - alvo.u.def), 0.3, 3.0);
        alvo.pool += atq * ator.u.dano * mult;
        const m = Math.min(Math.floor(alvo.pool / alvo.u.vida), alvo.count);
        if (m > 0) {
          alvo.pool -= m * alvo.u.vida;
          alvo.count -= m;
          alvo.mortos += m;
          xp[ator.side] += m * alvo.u.xp;
        }
      });
    }

    if (!stacks.some(s => s.side === "ATK" && s.count > 0 && s.u.qatq > 0) ||
        !stacks.some(s => s.side === "DEF" && s.count > 0)) break;
  }

  const colher = side => {
    const r = {};
    stacks.filter(s => s.side === side && s.count > 0).forEach(s => { r[s.nome] = s.count; });
    return r;
  };
  const somaMortos = side => stacks.filter(s => s.side === side).reduce((a, s) => a + s.mortos, 0);

  return {
    sobreviventesAtk: colher("ATK"),
    sobreviventesDef: colher("DEF"),
    xpAtk: xp.ATK, xpDef: xp.DEF,
    roubados,
    mortosAtk: somaMortos("ATK"),
    mortosDef: somaMortos("DEF")
  };
}
