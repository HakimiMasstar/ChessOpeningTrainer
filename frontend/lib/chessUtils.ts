import { Chess } from "chess.js";
import { Key } from "chessground/types";

export const toDests = (chess: Chess): Map<Key, Key[]> => {
  const dests = new Map();
  chess.moves({ verbose: true }).forEach((m) => {
    if (!dests.has(m.from)) dests.set(m.from, []);
    dests.get(m.from).push(m.to);
  });
  return dests;
};
