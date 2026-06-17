import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

// Kho luu tru JSON ben vung, thuan JS, khong can server CSDL.
// Moi collection = mot file .json. Doc vao RAM luc khoi dong, ghi lai khi thay doi.
// Tang sau: thay file db/store.js bang ban PostgreSQL (xem README) — API giu nguyen.

export class Collection {
  constructor(name, dir) {
    this.name = name;
    this.file = path.join(dir, `${name}.json`);
    this.items = [];
    if (fs.existsSync(this.file)) {
      try {
        this.items = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      } catch {
        this.items = [];
      }
    }
  }

  _persist() {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.items, null, 2));
    fs.renameSync(tmp, this.file); // ghi gan nhu nguyen tu
  }

  all() {
    return this.items.slice();
  }

  find(pred) {
    return this.items.filter(pred);
  }

  findOne(pred) {
    return this.items.find(pred) || null;
  }

  getById(id) {
    return this.items.find((x) => x.id === id) || null;
  }

  insert(obj) {
    const row = { id: obj.id || nanoid(12), createdAt: Date.now(), ...obj };
    this.items.push(row);
    this._persist();
    return row;
  }

  update(id, patch) {
    const idx = this.items.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    this.items[idx] = { ...this.items[idx], ...patch, updatedAt: Date.now() };
    this._persist();
    return this.items[idx];
  }

  remove(id) {
    const before = this.items.length;
    this.items = this.items.filter((x) => x.id !== id);
    if (this.items.length !== before) this._persist();
    return before !== this.items.length;
  }

  count(pred) {
    return pred ? this.items.filter(pred).length : this.items.length;
  }
}

export function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
