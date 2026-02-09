import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, Target, Trophy } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 pt-20 pb-32">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Version 1.0 Now Available
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
            Master Your Openings <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              One Move at a Time
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop memorizing lines blindly. Practice your repertoire against an engine that knows <strong>your</strong> theory and challenges you when you deviate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-lg shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Start Training <ArrowRight size={20} />
            </Link>
            <a 
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all text-lg"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why ChessOpeningTrainer?</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              We combine spaced repetition concepts with engine analysis to ensure you never forget a line again.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen size={32} className="text-blue-600" />,
                title: "Build Your Plan",
                desc: "Upload PGNs or choose from our library of 50+ common variations. Organize your study sessions by color."
              },
              {
                icon: <BrainCircuit size={32} className="text-purple-600" />,
                title: "Theory Detection",
                desc: "Play any move. The system automatically detects if you are following your learned theory and tracks your progress."
              },
              {
                icon: <Target size={32} className="text-green-600" />,
                title: "Stockfish Partner",
                desc: "When theory ends, the world's strongest engine takes over seamlessly so you can play out the rest of the game."
              }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Docs Section */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Trophy size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Ready to Improve?</h2>
          <p className="text-lg text-slate-500 mb-10">
            Streamline your opening study. It's free, open-source, and runs locally on your machine.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
             <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2">How it Works</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Mark openings as "Learned" to add to practice</li>
                    <li>• Bot follows your theory as long as you do</li>
                    <li>• Stockfish activates when theory lines end</li>
                </ul>
             </div>
             <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-2">Pro Tips</h4>
                <ul className="space-y-2 text-sm text-indigo-700">
                    <li>• Upload custom PGNs for specific lines</li>
                    <li>• Practice "Play as Black" to test defenses</li>
                    <li>• Focus on mastering 3-5 core openings</li>
                </ul>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <span className="text-xl">♔</span>
                <span className="font-bold text-white">ChessOpeningTrainer</span>
            </div>
            <p className="text-sm">© 2026 Open Source Project</p>
        </div>
      </footer>
    </main>
  );
}