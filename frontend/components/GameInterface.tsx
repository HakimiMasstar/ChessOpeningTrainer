import React, { useState, useEffect, useMemo } from "react";
import Board from "./Board";
import { Chess } from "chess.js";
import { startGame, playMove, getOpenings, Opening } from "../lib/api";
import { toDests } from "../lib/chessUtils";

const GameInterface: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("Welcome. Press Start to begin.");
  const [isEngineMode, setIsEngineMode] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  
  console.log(`Render: playerColor=${playerColor}, gameStarted=${gameStarted}`);

  // Opening Tracking
  const [allOpenings, setAllOpenings] = useState<Opening[]>([]);
  const [activeOpeningIds, setActiveOpeningIds] = useState<number[]>([]);

  // Derived state
  const fen = game.fen();
  const turn = game.turn() === "w" ? "white" : "black";
  const isCheck = game.inCheck();
  // Chessground expects [from, to] strings for last move highlight
  const lastMoveHistory = game.history({ verbose: true });
  const lastMoveObj = lastMoveHistory.length > 0 ? lastMoveHistory[lastMoveHistory.length - 1] : null;
  const lastMove = lastMoveObj ? [lastMoveObj.from, lastMoveObj.to] : undefined;

  // Filter openings for display
  // We only show openings matching the player's color that are 'learned'
  const relevantOpenings = useMemo(() => {
      return allOpenings.filter(op => (op as any).color === playerColor && op.is_learned);
  }, [allOpenings, playerColor]);

  const dests = useMemo(() => {
      if (gameOver) return new Map();
      // Only allow moves if it's player's turn
      if (turn !== playerColor) return new Map();
      
      const d = toDests(game);
      console.log(`State update. Turn: ${turn}. Valid moves count: ${d.size}`);
      return d;
  }, [game, turn, gameOver, playerColor]);

  // Check Game Status
  useEffect(() => {
      if (!gameStarted) return;
      
      if (game.isCheckmate()) {
          setGameOver(true);
          setStatus(`Checkmate! ${turn === "white" ? "Black" : "White"} wins.`);
      } else if (game.isStalemate()) {
          setGameOver(true);
          setStatus("Stalemate! Game drawn.");
      } else if (game.isThreefoldRepetition()) {
          setGameOver(true);
          setStatus("Draw by repetition.");
      } else if (game.isInsufficientMaterial()) {
          setGameOver(true);
          setStatus("Draw by insufficient material.");
      } else if (game.isDraw()) {
          setGameOver(true);
          setStatus("Game drawn.");
      }
  }, [game, gameStarted, turn]);
  
  // Fetch openings on mount
  useEffect(() => {
      getOpenings().then(data => {
          console.log("Fetched Openings:", data);
          setAllOpenings(data);
      }).catch(console.error);
  }, []);

  const handleStart = async (color: "white" | "black") => {
    console.log(`handleStart called with: ${color}`);
    setStatus(`Starting game as ${color}...`);
    setPlayerColor(color); // Set it immediately
    try {
        const data = await startGame(1, color);
        console.log("Start Game Response:", data);
        setSessionId(data.session_id);
        
        const newGame = new Chess(data.initial_fen);
        setGame(newGame);
        setHistory(newGame.history()); // If black, history might have 1 move
        setGameStarted(true);
        setGameOver(false);
        setStatus(data.message);
        setIsEngineMode(false);
        
        // Reset active IDs to all relevant learned openings for this color
        const relevantIds = allOpenings
            .filter(op => (op as any).color === color && op.is_learned)
            .map(op => op.id);
        setActiveOpeningIds(relevantIds);
        
    } catch (e) {
        console.error(e);
        setStatus("Error: Could not connect to backend.");
    }
  };

  const handleResign = () => {
      if (gameOver) return;
      setGameOver(true);
      setStatus(`You resigned. ${playerColor === "white" ? "Black" : "White"} wins.`);
  };

  const onUserMove = async (orig: string, dest: string) => {
    if (!sessionId || gameOver) return;
    if (game.turn() !== (playerColor === "white" ? "w" : "b")) return;

    // 1. Validate & Apply locally
    const tempGame = new Chess(game.fen());
    try {
        const move = tempGame.move({ from: orig, to: dest, promotion: "q" });
        if (!move) return; 
        
        setGame(tempGame); 
        setHistory(h => [...h, move.san]);
        
        // 2. Send to backend
        setStatus("Thinking...");
        const response = await playMove(sessionId, move.san);
        
        setIsEngineMode(response.engine_mode);
        if (response.candidate_opening_ids) {
            setActiveOpeningIds(response.candidate_opening_ids);
        }
        
        // Update status text if game isn't over yet locally
        if (!tempGame.isGameOver()) {
            setStatus(response.message || (response.mistake_made ? "Mistake!" : "Your turn"));
        }

        // 3. Handle Bot Reply
        if (response.bot_move) {
            setGame(g => {
                const g2 = new Chess(g.fen());
                g2.move(response.bot_move!);
                return g2; 
            });
            setHistory(h => [...h, response.bot_move!]);
        }

    } catch (e) {
        console.error("Move failed", e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col items-center gap-6">
        
        {/* Header / Controls */}
        {!gameStarted && (
            <div className="text-center p-6 sm:p-8 bg-white border rounded shadow-lg w-full max-w-md">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Chess Opening Trainer</h2>
                <div className="flex flex-col xs:flex-row gap-4 justify-center">
                    <button 
                        onClick={() => handleStart("white")}
                        className="flex-1 px-4 py-3 bg-slate-100 text-slate-800 border font-bold rounded hover:bg-white hover:shadow-md transition flex flex-col items-center"
                    >
                        <span className="text-2xl">♔</span>
                        <span className="text-sm sm:text-base">Play as White</span>
                    </button>
                    <button 
                        onClick={() => handleStart("black")}
                        className="flex-1 px-4 py-3 bg-slate-800 text-white font-bold rounded hover:bg-slate-900 hover:shadow-md transition flex flex-col items-center"
                    >
                        <span className="text-2xl">♚</span>
                        <span className="text-sm sm:text-base">Play as Black</span>
                    </button>
                </div>
            </div>
        )}

        {/* Game Area */}
        {gameStarted && (
            <div className="flex flex-col lg:flex-row gap-6 w-full justify-center items-start">
                {/* Left: Opening Tracker - Hidden or bottom on mobile? Let's keep it but maybe make it smaller */}
                <div className="w-full lg:w-56 flex flex-col gap-2 order-3 lg:order-1">
                    <h3 className="font-bold text-slate-700 border-b pb-2 text-xs uppercase tracking-wide">Learning Tracker</h3>
                    <div className="bg-white border rounded-xl h-[200px] lg:h-[550px] overflow-y-auto p-2 space-y-1 shadow-sm">
                        {relevantOpenings.map(op => {
                            const isActive = activeOpeningIds.includes(op.id);
                            
                            return (
                                <div 
                                    key={op.id} 
                                    className={`text-xs p-2 rounded transition-colors ${
                                        isActive 
                                        ? "bg-green-50 text-green-800 font-semibold border border-green-200" 
                                        : "text-gray-400"
                                    }`}
                                >
                                    {op.name}
                                </div>
                            );
                        })}
                        {relevantOpenings.length === 0 && <p className="text-gray-400 text-xs italic p-2">No learning plans for this color.</p>}
                    </div>
                </div>

                {/* Board */}
                <div className="w-full lg:w-auto flex-1 max-w-[550px] order-1 lg:order-2">
                    <div className="w-full aspect-square bg-slate-300 rounded-xl shadow-lg overflow-hidden relative">
                        <Board 
                            key={playerColor}
                            fen={fen} 
                            turnColor={turn}
                            orientation={playerColor}
                        check={isCheck}
                        lastMove={lastMove}
                        onMove={onUserMove}
                        movable={{
                            color: gameOver ? undefined : playerColor,
                            dests: dests
                        }}
                    />
                    
                    {/* Game Over Overlay */}
                    {gameOver && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none z-[100]">
                            <div className="bg-white p-6 rounded-xl shadow-2xl text-center pointer-events-auto transform scale-100 max-w-xs mx-4">
                                <h3 className="text-xl font-bold text-slate-800 mb-1">Game Over</h3>
                                <p className="text-sm text-slate-500 mb-6">{status}</p>
                                <div className="flex flex-col xs:flex-row gap-3 justify-center">
                                    <button 
                                        onClick={() => handleStart("white")}
                                        className="px-4 py-2 bg-slate-100 text-slate-800 font-bold text-sm rounded-lg hover:bg-slate-200"
                                    >
                                        Again (White)
                                    </button>
                                    <button 
                                        onClick={() => handleStart("black")}
                                        className="px-4 py-2 bg-slate-800 text-white font-bold text-sm rounded-lg hover:bg-slate-900"
                                    >
                                        Again (Black)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-full lg:w-72 flex flex-col gap-4 order-2 lg:order-3">
                    <div className={`p-4 rounded-xl border shadow-sm ${isEngineMode ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-bold text-sm uppercase tracking-wide">{isEngineMode ? "Engine Mode" : "Theory Mode"}</h3>
                            {isCheck && !gameOver && <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded uppercase">Check</span>}
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed font-medium">{status}</p>
                    </div>

                    <div className="bg-white border rounded-xl shadow-sm p-3 h-[250px] lg:h-[400px] overflow-auto flex flex-col">
                        <h4 className="font-bold border-b pb-2 mb-2 text-xs text-slate-500 uppercase tracking-wide">Move History</h4>
                        <div className="grid grid-cols-2 gap-y-0.5 text-xs flex-1 content-start">
                            {history.map((move, i) => (
                                <div key={i} className={`px-2 py-1 ${i % 2 === 0 ? 'text-right text-slate-500 bg-slate-50' : 'font-bold text-slate-800'}`}>
                                    {i % 2 === 0 ? `${Math.floor(i/2) + 1}.` : ''} {move}
                                </div>
                            ))}
                        </div>
                        
                        {!gameOver && (
                            <div className="mt-3 pt-3 border-t flex gap-2">
                                <button 
                                    onClick={handleResign}
                                    className="flex-1 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-semibold rounded-lg transition-colors text-xs"
                                >
                                    🏳️ Resign
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default GameInterface;
