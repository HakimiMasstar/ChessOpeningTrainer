"use client";

// Need to update Opening interface in api.ts first, but JS allows it. 
// Ideally I update api.ts first.
// Let's assume api.ts update happens in next step or I just use 'any'.
// Actually, I should update api.ts interface first for TS safety.
import { useEffect, useState, useRef } from "react";
import { getOpenings, toggleLearning, uploadPgn, Opening } from "../../lib/api";
import Link from "next/link";
import { Upload, CheckCircle, Circle, BookOpen, Trash2, Plus } from "lucide-react";

export default function Dashboard() {
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"white" | "black">("white");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchOpenings();
  }, []);

  const fetchOpenings = async () => {
    try {
      const data = await getOpenings();
      setOpenings(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          try {
              await uploadPgn(file);
              fetchOpenings();
          } catch (err) {
              alert("Upload failed");
          }
      }
  };

  const handleToggle = async (id: number) => {
    setOpenings(prev => prev.map(op => 
        op.id === id ? { ...op, is_learned: !op.is_learned } : op
    ));
    await toggleLearning(id);
    fetchOpenings(); 
  };
  
  const filteredOpenings = openings.filter(op => (op as any).color === activeTab);
  const learnedCount = openings.filter(op => op.is_learned).length;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Learning Plan</h1>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><BookOpen size={14}/> {openings.length} Total</span>
                        <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle size={14}/> {learnedCount} Learned</span>
                    </div>
                </div>
                <div>
                    <input 
                        type="file" 
                        accept=".pgn" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-all text-sm shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Upload size={16} />
                        Import PGN
                    </button>
                </div>
            </div>
          </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex justify-center mb-8">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                {(["white", "black"] as const).map((color) => (
                    <button
                        key={color}
                        onClick={() => setActiveTab(color)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                            activeTab === color 
                            ? "bg-slate-100 text-slate-900 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <span className={`w-2.5 h-2.5 rounded-full border ${color === "white" ? "bg-white border-slate-300" : "bg-slate-900 border-slate-900"}`}></span>
                        Play as {color.charAt(0).toUpperCase() + color.slice(1)}
                    </button>
                ))}
            </div>
        </div>

        {/* Grid */}
        {loading ? (
            <div className="text-center py-20 text-slate-400 animate-pulse text-sm">Loading plans...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOpenings.map(op => (
                    <div 
                        key={op.id} 
                        className={`group relative bg-white rounded-xl p-4 border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                            op.is_learned ? "border-green-200 ring-1 ring-green-100" : "border-slate-200"
                        }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                op.is_learned ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                            }`}>
                                {op.is_learned ? <CheckCircle size={16} /> : <Circle size={16} />}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link 
                                    href={`/learn/${op.id}`}
                                    className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg"
                                    title="Study"
                                >
                                    <BookOpen size={16} />
                                </Link>
                            </div>
                        </div>
                        
                        <h3 className="font-bold text-slate-800 text-base mb-0.5 line-clamp-1">{op.name}</h3>
                        <p className="text-slate-400 text-xs mb-4">{op.is_learned ? "Learned" : "Not started"}</p>
                        
                        <button 
                            onClick={() => handleToggle(op.id)}
                            className={`w-full py-2 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                                op.is_learned 
                                ? "bg-red-50 text-red-600 hover:bg-red-100" 
                                : "bg-slate-900 text-white hover:bg-slate-800"
                            }`}
                        >
                            {op.is_learned ? <><Trash2 size={14}/> Remove</> : <><Plus size={14}/> Mark as Learned</>}
                        </button>
                    </div>
                ))}
                
                {/* Empty State */}
                {filteredOpenings.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <BookOpen size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">No openings found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
                            Upload a PGN file to start building your {activeTab} learning plan.
                        </p>
                    </div>
                )}
            </div>
        )}
      </div>
    </main>
  );
}
