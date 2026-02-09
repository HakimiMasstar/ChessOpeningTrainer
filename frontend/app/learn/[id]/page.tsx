"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getOpeningDetail, toggleLearning } from "../../../lib/api";
import Board from "../../../components/Board";
import { Chess } from "chess.js";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, Circle } from "lucide-react";

export default function LessonPage() {
  const params = useParams();
  const id = Number(params?.id);
  
  const [name, setName] = useState<string>("");
  const [pgn, setPgn] = useState<string>("");
  const [isLearned, setIsLearned] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  
  const [moves, setMoves] = useState<string[]>([]);
  const [currentFen, setCurrentFen] = useState<string>("start");
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
        fetchDetail();
    }
  }, [id]);

  const fetchDetail = () => {
    getOpeningDetail(id)
        .then(data => {
            setName(data.name);
            setPgn(data.pgn);
            setIsLearned(data.is_learned);
            setOrientation(data.color);
            
            const tempGame = new Chess();
            try {
                tempGame.loadPgn(data.pgn);
                const history = tempGame.history();
                setMoves(history);
            } catch (e) {
                console.error("PGN Parse Error:", e);
            }
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
  };

  const handleToggleLearn = async () => {
      setIsLearned(!isLearned);
      await toggleLearning(id);
      fetchDetail(); 
  };

  const goToMove = (index: number) => {
    const tempGame = new Chess();
    for (let i = 0; i <= index; i++) {
        tempGame.move(moves[i]);
    }
    setCurrentFen(tempGame.fen());
    setCurrentMoveIndex(index);
  };

  const nextMove = () => {
    if (currentMoveIndex < moves.length - 1) {
        goToMove(currentMoveIndex + 1);
    }
  };

  const prevMove = () => {
    if (currentMoveIndex > -1) {
        goToMove(currentMoveIndex - 1);
    } else {
        setCurrentFen("start");
        setCurrentMoveIndex(-1);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading lesson...</div>;
  if (!pgn) return <div className="p-8">Opening not found.</div>;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <Link href="/" className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-lg font-bold text-slate-900 leading-none">{name}</h1>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Theory Lesson</span>
                </div>
            </div>
            <button 
                onClick={handleToggleLearn}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                    isLearned 
                    ? "bg-green-100 text-green-700 ring-1 ring-green-200" 
                    : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow active:scale-95"
                }`}
            >
                {isLearned ? <><CheckCircle size={14}/> Learned</> : <><Circle size={14}/> Mark as Learned</>}
            </button>
        </div>

        <div className="flex-1 max-w-5xl mx-auto w-full p-4 flex flex-col lg:flex-row gap-6 items-start justify-center">
            
            {/* Board */}
            <div className="w-full lg:w-auto flex-1 max-w-[600px] mx-auto lg:mx-0">
                <div className="aspect-square bg-white rounded-xl shadow-lg overflow-hidden ring-1 ring-slate-200">
                    <Board fen={currentFen} viewOnly={true} orientation={orientation} />
                </div>
                
                {/* Controls */}
                <div className="mt-4 flex justify-center gap-3">
                    <button 
                        onClick={prevMove} 
                        disabled={currentMoveIndex < 0} 
                        className="p-3 bg-white rounded-full shadow hover:shadow-md disabled:opacity-50 disabled:shadow-none text-slate-700 transition-all active:scale-95"
                    >
                        <ChevronLeft size={20}/>
                    </button>
                    <button 
                        onClick={nextMove} 
                        disabled={currentMoveIndex >= moves.length - 1} 
                        className="p-3 bg-slate-900 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-slate-800 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                    >
                        <ChevronRight size={20}/>
                    </button>
                </div>
            </div>
            
            {/* Sidebar */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[500px]">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Move List</h2>
                    </div>
                    
                    <div className="p-3 overflow-y-auto flex-1">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                            {moves.map((move, i) => {
                                const isWhite = i % 2 === 0;
                                const moveNum = Math.floor(i/2) + 1;
                                const isActive = i === currentMoveIndex;
                                
                                return (
                                    <button 
                                        key={i} 
                                        onClick={() => goToMove(i)}
                                        className={`px-2 py-1.5 rounded text-left flex items-center gap-2 transition-colors ${
                                            isActive 
                                            ? "bg-slate-900 text-white font-bold shadow-sm" 
                                            : "hover:bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        {isWhite && <span className={`w-4 text-right opacity-50 ${isActive ? "text-slate-400" : "text-slate-400"}`}>{moveNum}.</span>}
                                        {!isWhite && <span className="w-4"></span>}
                                        {move}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
  );
}
