const COLUMNS = "abcdefghi".split("");
const ROW_TOP = 9;
const ROW_LOW = 0;
const ROW_LENGTH = ROW_TOP - ROW_LOW + 1;

export function fenToPieceCode(piece: string): string {
  if (piece.toLowerCase() === piece) return "b" + piece.toUpperCase();
  return "r" + piece.toUpperCase();
}

export function pieceCodeToFen(piece: string): string {
  const letters = piece.split("");
  if (letters[0] === "b") return letters[1].toLowerCase();
  return letters[1].toUpperCase();
}

export function fenToObj(fen: string): Record<string, string> {
  let cleanFen = fen.replace(/ .+$/, "");

  // Expand empty squares (e.g., '9' -> '111111111')
  cleanFen = cleanFen
    .replace(/9/g, "111111111")
    .replace(/8/g, "11111111")
    .replace(/7/g, "1111111")
    .replace(/6/g, "111111")
    .replace(/5/g, "11111")
    .replace(/4/g, "1111")
    .replace(/3/g, "111")
    .replace(/2/g, "11");

  const rows = cleanFen.split("/");
  const position: Record<string, string> = {};

  let currentRow = ROW_TOP;
  for (let i = 0; i < ROW_LENGTH; i++) {
    const row = rows[i].split("");
    let colIdx = 0;
    for (let j = 0; j < row.length; j++) {
      if (row[j].search(/[1-9]/) !== -1) {
        colIdx += parseInt(row[j], 10);
      } else {
        const square = COLUMNS[colIdx] + currentRow;
        position[square] = fenToPieceCode(row[j]);
        colIdx += 1;
      }
    }
    currentRow -= 1;
  }
  return position;
}

export function objToFen(obj: Record<string, string>): string {
  let fen = "";
  let currentRow = ROW_TOP;

  for (let i = 0; i < ROW_LENGTH; i++) {
    for (let j = 0; j < COLUMNS.length; j++) {
      const square = COLUMNS[j] + currentRow;
      if (obj.hasOwnProperty(square)) {
        fen += pieceCodeToFen(obj[square]);
      } else {
        fen += "1";
      }
    }
    if (i !== ROW_TOP) fen += "/";
    currentRow -= 1;
  }

  // Squeeze empty squares back into numbers
  return fen
    .replace(/111111111/g, "9")
    .replace(/11111111/g, "8")
    .replace(/1111111/g, "7")
    .replace(/111111/g, "6")
    .replace(/11111/g, "5")
    .replace(/1111/g, "4")
    .replace(/111/g, "3")
    .replace(/11/g, "2");
}
