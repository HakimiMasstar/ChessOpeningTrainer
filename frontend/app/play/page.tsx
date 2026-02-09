"use client";

import GameInterface from "../../components/GameInterface";
import Link from "next/link";

export default function PlayPage() {
  return (
    <main className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Practice Mode</h1>
                <p className="text-slate-600">Play against your learned opening repertoire.</p>
            </div>
            {/* <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">My Learning Plan &rarr;</Link> */}
        </header>
        
        <GameInterface />
      </div>
    </main>
  );
}
