// "0-0" -> "A1", "2-1" -> "B3"
export const toA1 = (key) => {
  const [r, c] = key.split("-").map(Number);
  return `${String.fromCharCode(65 + c)}${r + 1}`;
};

// "B3" -> "2-1" (galat format ho to null)
export const fromA1 = (cell) => {
  const match = /^([A-Z])(\d+)$/.exec(cell);
  if (!match) return null;
  const col = match[1].charCodeAt(0) - 65;
  const row = Number(match[2]) - 1;
  if (row < 0) return null;
  return `${row}-${col}`;
};

// cells object -> AI ko dene layak text, row-wise sorted
export const cellsToText = (cells, limit = 400) => {
  const entries = Object.entries(cells)
    .filter(([, v]) => v !== "")
    .map(([key, value]) => {
      const [r, c] = key.split("-").map(Number);
      return { r, c, value };
    })
    .sort((a, b) => a.r - b.r || a.c - b.c)
    .slice(0, limit);

  return entries
    .map(({ r, c, value }) => `${String.fromCharCode(65 + c)}${r + 1}: ${value}`)
    .join("\n");
};