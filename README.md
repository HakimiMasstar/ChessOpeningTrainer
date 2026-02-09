# ChessOpeningTrainer

**Master your chess repertoire through active recall and engine practice.**

ChessOpeningTrainer is a locally-hosted web application designed to help chess players internalize their opening repertoire. Instead of passively watching videos, you practice your lines on a board. The system automatically detects which opening you are playing and replies with your learned theory. If you deviate or run out of theory, **Stockfish** takes over seamlessly, allowing you to play out the resulting middlegame.

![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🚀 Key Features

*   **Repertoire Management:** Upload your own PGN files or choose from the built-in library of 50+ common variations.
*   **Color-Specific Training:** Organize your "White" and "Black" repertoires separately.
*   **Active Recall System:**
    *   **Theory Mode:** The bot plays moves from your learned PGNs.
    *   **Auto-Detection:** Play any move you want; the system filters your repertoire in real-time to find matching lines.
    *   **Visual Tracker:** See exactly which opening variations remain possible as the game progresses.
*   **Engine Integration:** Includes **Stockfish 16+** integration. When your theory ends (or you make a new move), the engine replies instantly, ensuring you get a realistic practice game every time.
*   **Lesson Mode:** Study PGNs move-by-move before testing yourself.

---

## 🛠️ Technology Stack

*   **Frontend:** Next.js 14 (React), Tailwind CSS, Lucide Icons, Chessground (Board).
*   **Backend:** Python 3.10+, FastAPI, SQLAlchemy, Python-Chess.
*   **Engine:** Stockfish (UCI Protocol).
*   **Database:** SQLite (Zero-config).

---

## 📥 Installation

### Prerequisites
*   **Node.js** (v18+)
*   **Python** (v3.10+)
*   **Stockfish Executable** (Required for Engine Mode)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/chess-opening-trainer.git
cd chess-opening-trainer
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

**⚠️ Important: Stockfish Setup**
1.  Download Stockfish from [stockfishchess.org](https://stockfishchess.org/download/).
2.  Extract the zip file.
3.  Rename the executable to `stockfish.exe` (Windows) or `stockfish` (Linux/Mac).
4.  Place it directly inside the `backend/` folder.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

---

## ▶️ Running the Application

You need two terminal windows.

**Terminal 1 (Backend)**
```bash
cd backend
uvicorn main:app --reload
```
*The server will start on http://localhost:8000. On first run, it will seed the database with 50 common openings.*

**Terminal 2 (Frontend)**
```bash
cd frontend
npm run dev
```
*The app will start on http://localhost:3000.*

---

## 📖 User Guide

### 1. Building Your Plan
1.  Navigate to **My Learning Plan** (Dashboard).
2.  You will see two columns: **White Repertoire** and **Black Repertoire**.
3.  Browse the list of available openings (seeded from common theory) or click **Import PGN** to upload your own files.
4.  Click **"Start Learning"** on any opening you want to practice. These are now "Active".

### 2. Study Mode (Lesson)
1.  Click the **Book Icon** on any opening card.
2.  Review the moves on the board.
3.  Click **"Mark as Learned"** to confirm you know this line.

### 3. Practice Mode (The Core Feature)
1.  Go to the **Practice** tab.
2.  Choose **Play as White** or **Play as Black**.
3.  **If White:** Make your first move (e.g., `e4`).
    *   The sidebar will show "Possible Openings" (e.g., Ruy Lopez, Italian).
    *   The bot will reply using moves from those openings.
4.  **If Black:** The bot (White) will move first based on your White repertoire knowledge (or standard theory).
5.  **Stockfish Takeover:**
    *   If you play a move that is valid chess but NOT in your PGN, the system switches to **Engine Mode**.
    *   The sidebar will notify you that theory has ended.
    *   Stockfish will now play against you for the rest of the game.

---

## 📂 Project Structure

```
chess-opening-trainer/
├── backend/
│   ├── app/
│   │   ├── chess_logic.py    # Core PGN parsing & Game Tree
│   │   ├── models.py         # Database Schema
│   │   └── ...
│   ├── openings/             # PGN Storage
│   ├── main.py               # FastAPI Entrypoint
│   └── stockfish.exe         # Engine Binary
├── frontend/
│   ├── app/                  # Next.js Pages (Dashboard, Play, Learn)
│   ├── components/           # UI Components (Board, Navbar)
│   └── lib/                  # API Client
└── README.md
```

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)