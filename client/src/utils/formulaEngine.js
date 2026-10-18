import { Parser as FormulaParser } from "hot-formula-parser";

const keyFor = (row, column) => `${row}-${column}`;

const cellValue = (value) => {
  if (value == null || value === "") return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
};

export const createEvaluator = (cells) => {
  const evaluateCell = (key, visiting = new Set()) => {
    const raw = cells[key] ?? "";
    if (typeof raw !== "string" || !raw.startsWith("=")) return cellValue(raw);
    if (visiting.has(key)) return "#CYCLE!";

    const nextVisiting = new Set(visiting);
    nextVisiting.add(key);

    const parser = new FormulaParser();
    parser.on("callCellValue", (coord, done) => {
      done(evaluateCell(keyFor(coord.row.index, coord.column.index), nextVisiting));
    });
    parser.on("callRangeValue", (start, end, done) => {
      const values = [];
      for (let row = start.row.index; row <= end.row.index; row += 1) {
        const rowValues = [];
        for (let column = start.column.index; column <= end.column.index; column += 1) {
          rowValues.push(evaluateCell(keyFor(row, column), nextVisiting));
        }
        values.push(rowValues);
      }
      done(values);
    });

    const { error, result } = parser.parse(raw.slice(1));
    return error || (result == null ? "" : String(result));
  };

  return {
    display: (key) => {
      const result = evaluateCell(key);
      return result == null ? "" : String(result);
    },
  };
};
