const fs = require('fs');

class Graph {
  constructor() {
    this.adjList = new Map();               // simpul → daftar tetangga
  }

  addVertex(v) {
    if (!this.adjList.has(v)) this.adjList.set(v, []);
  }

  addEdge(u, v) {
    this.addVertex(u);
    this.addVertex(v);
    this.adjList.get(u).push(v);
    this.adjList.get(v).push(u);             // undirected
  }

  // Muat graf dari dataset_uas.csv
  // Format: id;id_Origin;...;Id_Destination;...;Range  (delimiter ";")
  // Berhenti otomatis saat baris kosong / tabel kedua dimulai
  loadFromCSV(filePath) {
    const lines  = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
    const header = lines[0].split(';').map(c => c.trim());
    const oCol   = header.indexOf('id_Origin');
    const dCol   = header.indexOf('Id_Destination');

    let edgeCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';').map(c => c.trim());
      if (!cols[oCol] || !cols[dCol]) break;   // baris kosong = akhir tabel edge
      this.addEdge(cols[oCol], cols[dCol]);
      edgeCount++;
    }

    console.log(`✔ Dataset "${filePath}" dimuat: ${this.adjList.size} simpul, ${edgeCount} sisi\n`);
  }

  printGraph() {
    console.log('── Adjacency List ──');
    for (const [v, neighbors] of this.adjList) {
      console.log(`  ${v} → [ ${neighbors.join(', ')} ]`);
    }
    console.log();
  }

  // BFS — kunjungi level per level pakai Queue
  bfs(start) {
    const visited = new Set([start]);
    const queue   = [start];
    const result  = [];

    while (queue.length > 0) {
      const v = queue.shift();
      result.push(v);
      for (const nb of this.adjList.get(v)) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }
    return result;
  }

  // DFS Rekursif — telusuri sedalam mungkin sebelum backtrack
  dfs(start, visited = new Set(), result = []) {
    visited.add(start);
    result.push(start);
    for (const nb of this.adjList.get(start)) {
      if (!visited.has(nb)) this.dfs(nb, visited, result);
    }
    return result;
  }

  // DFS Iteratif — versi tanpa rekursi, pakai Stack eksplisit
  dfsIterative(start) {
    const visited = new Set();
    const stack   = [start];
    const result  = [];

    while (stack.length > 0) {
      const v = stack.pop();
      if (visited.has(v)) continue;
      visited.add(v);
      result.push(v);
      for (const nb of [...this.adjList.get(v)].reverse()) {
        if (!visited.has(nb)) stack.push(nb);
      }
    }
    return result;
  }

  // Jalur terpendek (jumlah hop) pakai BFS
  shortestPath(start, end) {
    const visited = new Set([start]);
    const queue   = [[start]];

    while (queue.length > 0) {
      const path = queue.shift();
      const v    = path[path.length - 1];
      if (v === end) return path;
      for (const nb of this.adjList.get(v)) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push([...path, nb]);
        }
      }
    }
    return null;
  }

  // Deteksi siklus pakai DFS (cari back-edge)
  hasCycle() {
    const visited = new Set();
    const check = (v, parent) => {
      visited.add(v);
      for (const nb of this.adjList.get(v)) {
        if (!visited.has(nb)) {
          if (check(nb, v)) return true;
        } else if (nb !== parent) {
          return true;
        }
      }
      return false;
    };
    for (const v of this.adjList.keys()) {
      if (!visited.has(v) && check(v, null)) return true;
    }
    return false;
  }

  // Bandingkan kecepatan BFS vs DFS
  // - Waktu eksekusi tunggal : 1x run, diukur pakai process.hrtime.bigint() (presisi nanodetik)
  // - Rata-rata              : dari beberapa kali run (default 1000x)
  comparePerformance(start, runs = 1000) {
    // ── Waktu eksekusi tunggal (1x run, presisi tinggi) ──
    let t0 = process.hrtime.bigint();
    this.bfs(start);
    let t1 = process.hrtime.bigint();
    const bfsSingleMs = Number(t1 - t0) / 1e6;

    t0 = process.hrtime.bigint();
    this.dfs(start);
    t1 = process.hrtime.bigint();
    const dfsSingleMs = Number(t1 - t0) / 1e6;

    // ── Rata-rata waktu (runs kali, presisi tinggi) ──
    let bfsTotalNs = 0n, dfsTotalNs = 0n;

    for (let i = 0; i < runs; i++) {
      t0 = process.hrtime.bigint();
      this.bfs(start);
      t1 = process.hrtime.bigint();
      bfsTotalNs += (t1 - t0);

      t0 = process.hrtime.bigint();
      this.dfs(start);
      t1 = process.hrtime.bigint();
      dfsTotalNs += (t1 - t0);
    }

    const bfsAvgMs = Number(bfsTotalNs) / 1e6 / runs;
    const dfsAvgMs = Number(dfsTotalNs) / 1e6 / runs;

    console.log('── Perbandingan Kinerja BFS vs DFS ──');
    console.log(`  Waktu eksekusi tunggal BFS : ${bfsSingleMs.toFixed(4)} ms`);
    console.log(`  Waktu eksekusi tunggal DFS : ${dfsSingleMs.toFixed(4)} ms`);
    console.log(`  Rata-rata waktu BFS (${runs}x): ${bfsAvgMs.toFixed(4)} ms`);
    console.log(`  Rata-rata waktu DFS (${runs}x): ${dfsAvgMs.toFixed(4)} ms`);
    console.log(`  Simpul dikunjungi         : ${this.adjList.size}`);
    console.log(`  Kompleksitas              : O(V+E) untuk keduanya`);
    console.log(`  Jaminan jalur tercepat    : BFS (Ya)  |  DFS (Tidak)\n`);
  }
}

// ── MAIN ─────────────────────────────────────
(function main() {
  console.log('=== Graph Traversal — BFS & DFS ===\n');

  const g = new Graph();
  g.loadFromCSV('dataset_uas.csv');
  g.printGraph();

  const nodes = [...g.adjList.keys()];
  const start = nodes[0];
  const end   = nodes[nodes.length - 1];

  console.log('BFS           :', g.bfs(start).join(' → '));
  console.log('DFS Rekursif  :', g.dfs(start).join(' → '));
  console.log('DFS Iteratif  :', g.dfsIterative(start).join(' → '));

  const path = g.shortestPath(start, end);
  console.log('Jalur terpendek:', path ? path.join(' → ') : 'tidak ditemukan');
  console.log('Mengandung siklus:', g.hasCycle() ? 'Ya' : 'Tidak', '\n');

  g.comparePerformance(start);
})();
