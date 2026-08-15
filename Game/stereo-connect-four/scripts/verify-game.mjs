/**
 * 晶格指揮中心：驗證單檔遊戲使用的 4×4×4 勝利線演算法；僅使用 Node.js 標準功能，沒有額外相依。
 */
const SIZE = 4;
const keyOf = (x, y, z) => `${x},${y},${z}`;
const inBounds = (x, y, z) => x >= 0 && x < SIZE && y >= 0 && y < SIZE && z >= 0 && z < SIZE;
const directions = [];

for (let dx = -1; dx <= 1; dx++) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dy && !dz) continue;
      if ((dx || dy || dz) > 0) directions.push([dx, dy, dz]);
    }
  }
}

const lines = [];
for (let x = 0; x < SIZE; x++) {
  for (let y = 0; y < SIZE; y++) {
    for (let z = 0; z < SIZE; z++) {
      for (const [dx, dy, dz] of directions) {
        const end = [x + dx * (SIZE - 1), y + dy * (SIZE - 1), z + dz * (SIZE - 1)];
        if (inBounds(...end)) lines.push(Array.from({ length: SIZE }, (_, n) => keyOf(x + dx * n, y + dy * n, z + dz * n)));
      }
    }
  }
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const uniqueLines = new Set(lines.map(line => line.join('|')));
assert(lines.length === 76, `預期 76 條勝利線，實際得到 ${lines.length} 條。`);
assert(uniqueLines.size === 76, `勝利線不應重複，實際唯一值為 ${uniqueLines.size} 條。`);
assert(lines.every(line => line.length === 4 && line.every(key => inBounds(...key.split(',').map(Number)))), '每條勝利線均應為盤內四格。');

function checkWin(board, key, player) {
  return lines.find(line => line.includes(key) && line.every(cell => board.get(cell) === player)) || null;
}

for (const line of lines) {
  const board = new Map(line.map(key => [key, 1]));
  assert(checkWin(board, line[3], 1), `無法辨識勝利線：${line.join(' → ')}`);
}

const nearMiss = new Map([['0,0,0', 1], ['1,1,1', 1], ['2,2,2', 1], ['3,3,3', 2]]);
assert(checkWin(nearMiss, '2,2,2', 1) === null, '不同玩家的棋子不能形成勝利線。');
console.log(`規則驗證通過：${lines.length} 條不重複勝利線，所有軸向、平面對角線與體對角線均可判定。`);
