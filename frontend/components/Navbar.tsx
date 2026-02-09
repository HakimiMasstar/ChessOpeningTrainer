"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Gamepad2, GraduationCap } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navs = [
    { name: "Learning", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Practice", href: "/play", icon: <Gamepad2 size={18} /> },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center rounded-lg font-bold text-xl group-hover:bg-slate-700 transition-colors">
                ♔
            </div>
            <span className="font-bold text-slate-800 text-lg tracking-tight">ChessOpeningTrainer</span>
        </Link>
        
        <div className="flex gap-1 bg-slate-100/50 p-1 rounded-xl">
          {navs.map((nav) => {
            const isActive = pathname === nav.href;
            return (
                <Link
                key={nav.name}
                href={nav.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
                >
                {nav.icon}
                {nav.name}
                </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
