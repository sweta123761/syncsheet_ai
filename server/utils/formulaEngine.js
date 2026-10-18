import { Parser } from "hot-formula-parser";

const isFormula = (raw) => typeof raw === "string" && raw.startsWith("=");

// Result ko screen pe dikhane layak banao
const format = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "#NUM!";
    return String(parseFloat(value.toPrecision(12)));
  }
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
};

// cells = { "0-0": "10", "1-0": "=A1*2" }  ->  { display(key) }
export const createEvaluator = (cells) => {
  const cache = new Map();
  const visiting = new Set();

  // cell ki asli value: number ho to number, text ho to text, khaali ho to null
  const getValue = (row, col) => {
    const key = `${row}-${col}`;
    const raw = cells[key];
    if (raw === undefined || raw === "") return null;
    if (isFormula(raw)) return evaluate(key, raw);
    const trimmed = raw.trim();
    const num = Number(trimmed);
    return trimmed !== "" && !Number.isNaN(num) ? num : raw;
  };

  const evaluate = (key, raw) => {
    if (cache.has(key)) return cache.get(key);
    if (visiting.has(key)) return "#CIRC!"; // A1 -> B1 -> A1 loop

    visiting.add(key);

    const parser = new Parser();

    // formula mein A1 jaisa single cell aaye
    parser.on("callCellValue", (coord, done) => {
      const value = getValue(coord.row.index, coord.column.index);
      done(value === null ? 0 : value); // khaali cell = 0 (Excel jaisa)
    });

    // formula mein A1:A4 jaisa range aaye
    parser.on("callRangeValue", (start, end, done) => {
      const rows = [];
      for (let r = start.row.index; r <= end.row.index; r++) {
        const rowValues = [];
        for (let c = start.column.index; c <= end.column.index; c++) {
          rowValues.push(getValue(r, c));
        }
        rows.push(rowValues);
      }
      done(rows);
    });

    let value;
    try {
      const { error, result } = parser.parse(raw.slice(1)); // "=" hatao
      value = error ? error : result;
    } catch {
      value = "#ERROR!";
    }

    visiting.delete(key);
    cache.set(key, value);
    return value;
  };

  return {
    display: (key) => {
      const raw = cells[key];
      if (!isFormula(raw)) return raw || "";
      return format(evaluate(key, raw));
    },
  };
};