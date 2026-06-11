// ============================================================
// db.js — banco SQLite (uma única fonte de verdade do mundo)
// ============================================================
import Database from "./sqlite-adapter.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, "..", "db", "primordio.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

export function initSchema() {
  db.exec(`
    -- Estado global do round (sempre id=1)
    CREATE TABLE IF NOT EXISTS round (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      status TEXT NOT NULL DEFAULT 'inscricoes',   -- inscricoes | ativo | pausado | encerrado
      tick INTEGER NOT NULL DEFAULT 0,
      duracao INTEGER NOT NULL DEFAULT 1440,
      tick_segundos INTEGER NOT NULL DEFAULT 120,  -- ritmo do beta (2 min)
      ultimo_tick_em INTEGER NOT NULL DEFAULT 0    -- epoch ms do último tick processado
    );

    -- Códigos de convite
    CREATE TABLE IF NOT EXISTS convites (
      codigo TEXT PRIMARY KEY,
      usado_por INTEGER,                            -- clan.id que resgatou
      criado_em INTEGER NOT NULL
    );

    -- Clãs (um por jogador)
    CREATE TABLE IF NOT EXISTS clans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,                   -- sessão simples do beta
      nome TEXT NOT NULL,
      lider TEXT NOT NULL,
      raca TEXT NOT NULL,
      territorio INTEGER NOT NULL,
      slot INTEGER NOT NULL,
      terr_nome TEXT DEFAULT 'Território sem nome',
      bandeira INTEGER DEFAULT 0,
      xp INTEGER NOT NULL DEFAULT 0,
      nivel INTEGER NOT NULL DEFAULT 1,
      ouro INTEGER NOT NULL DEFAULT 0,
      madeira INTEGER NOT NULL DEFAULT 0,
      alimento INTEGER NOT NULL DEFAULT 0,
      trab_ouro INTEGER NOT NULL DEFAULT 0,
      trab_madeira INTEGER NOT NULL DEFAULT 0,
      trab_alimento INTEGER NOT NULL DEFAULT 0,
      trab_livres INTEGER NOT NULL DEFAULT 6,
      protecao INTEGER NOT NULL DEFAULT 96,
      voto TEXT,                                    -- coordenada votada para líder
      criado_em INTEGER NOT NULL,
      UNIQUE (territorio, slot)
    );

    -- Exército pronto na base: uma linha por (clan, unidade)
    CREATE TABLE IF NOT EXISTS exercito (
      clan_id INTEGER NOT NULL,
      unidade TEXT NOT NULL,
      qtd INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (clan_id, unidade)
    );

    -- Fila de recrutamento
    CREATE TABLE IF NOT EXISTS fila_tropas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clan_id INTEGER NOT NULL,
      unidade TEXT NOT NULL,
      qtd INTEGER NOT NULL,
      pronto_em INTEGER NOT NULL                    -- tick em que fica pronta
    );

    -- Pesquisas concluídas
    CREATE TABLE IF NOT EXISTS pesquisas (
      clan_id INTEGER NOT NULL,
      pid TEXT NOT NULL,
      PRIMARY KEY (clan_id, pid)
    );

    -- Pesquisas em andamento (uma por cadeia)
    CREATE TABLE IF NOT EXISTS fila_pesquisas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clan_id INTEGER NOT NULL,
      pid TEXT NOT NULL,
      conclui_em INTEGER NOT NULL
    );

    -- Slots de ataque (4 por clã)
    CREATE TABLE IF NOT EXISTS slots (
      clan_id INTEGER NOT NULL,
      idx INTEGER NOT NULL,                         -- 0..3
      fase TEXT NOT NULL DEFAULT 'base',            -- base | indo | voltando
      alvo TEXT,                                    -- coordenada
      tropas TEXT,                                  -- JSON { unidade: qtd }
      restam INTEGER NOT NULL DEFAULT 0,
      carga INTEGER NOT NULL DEFAULT 0,             -- trabalhadores roubados
      PRIMARY KEY (clan_id, idx)
    );

    -- Fundo do território (um por território)
    CREATE TABLE IF NOT EXISTS fundos (
      territorio INTEGER PRIMARY KEY,
      ouro INTEGER NOT NULL DEFAULT 0,
      madeira INTEGER NOT NULL DEFAULT 0,
      alimento INTEGER NOT NULL DEFAULT 0,
      conselheiro TEXT,                             -- coordenada do conselheiro
      nomeado_por TEXT                              -- coordenada do líder que nomeou
    );

    -- Relatórios de batalha (histórico recente)
    CREATE TABLE IF NOT EXISTS relatorios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clan_id INTEGER NOT NULL,
      tick INTEGER NOT NULL,
      texto TEXT NOT NULL,
      criado_em INTEGER NOT NULL
    );
  `);

  // garante a linha única do round
  const r = db.prepare("SELECT id FROM round WHERE id = 1").get();
  if (!r) {
    db.prepare("INSERT INTO round (id, status, tick, duracao, tick_segundos, ultimo_tick_em) VALUES (1,'inscricoes',0,1440,120,0)").run();
  }
}
