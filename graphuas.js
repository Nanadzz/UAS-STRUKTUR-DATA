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

  // Bandingkan kecepatan BFS vs DFS (rata-rata dari beberapa kali run)
  comparePerformance(start, runs = 1000) {
    let bfsTime = 0, dfsTime = 0;

    for (let i = 0; i < runs; i++) {
      let t = Date.now();
      this.bfs(start);
      bfsTime += Date.now() - t;

      t = Date.now();
      this.dfs(start);
      dfsTime += Date.now() - t;
    }

    console.log('── Perbandingan Kinerja BFS vs DFS ──');
    console.log(`  Rata-rata waktu BFS : ${(bfsTime / runs).toFixed(4)} ms`);
    console.log(`  Rata-rata waktu DFS : ${(dfsTime / runs).toFixed(4)} ms`);
    console.log(`  Kompleksitas        : O(V+E) untuk keduanya`);
    console.log(`  Jaminan tercepat    : BFS (Ya)  |  DFS (Tidak)\n`);
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
