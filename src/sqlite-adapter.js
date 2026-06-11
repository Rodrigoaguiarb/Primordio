// ============================================================
// sqlite-adapter.js — deixa o node:sqlite nativo (sem compilação)
// se comportar como better-sqlite3 nas chamadas que usamos.
// Permite rodar em qualquer host Node 22+ sem node-gyp.
// ============================================================
import { DatabaseSync } from "node:sqlite";

export default class Database {
  constructor(path) {
    this.db = new DatabaseSync(path);
  }
  pragma(str) {
    // aceita "journal_mode = WAL" etc.
    this.db.exec(`PRAGMA ${str};`);
  }
  exec(sql) { this.db.exec(sql); }
  prepare(sql) {
    const stmt = this.db.prepare(sql);
    return {
      get: (...args) => stmt.get(...args),
      all: (...args) => stmt.all(...args),
      run: (...args) => {
        const r = stmt.run(...args);
        return { lastInsertRowid: r.lastInsertRowid, changes: r.changes };
      }
    };
  }
  transaction(fn) {
    // emula better-sqlite3: retorna função que roda fn() dentro de BEGIN/COMMIT
    return (...args) => {
      this.db.exec("BEGIN");
      try { const out = fn(...args); this.db.exec("COMMIT"); return out; }
      catch (e) { this.db.exec("ROLLBACK"); throw e; }
    };
  }
}
