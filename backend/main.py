from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import os
import glob
import shutil

from app import models, schemas, database, chess_logic
from app.routers import debug

# --- App Initialization ---

app = FastAPI(title="Chess Opening Trainer API")

app.include_router(debug.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create Tables
models.Base.metadata.create_all(bind=database.engine)

# Load Openings on Startup
def load_openings_to_memory(db: Session):
    print("Loading openings...")
    openings = db.query(models.Opening).all()
    count = 0
    for op in openings:
        if os.path.exists(op.pgn_path):
            with open(op.pgn_path, "r") as f:
                content = f.read()
                chess_logic.GLOBAL_OPENING_TREE.add_opening(op.id, content)
                count += 1
    print(f"Loaded {count} openings into memory.")

@app.on_event("startup")
def startup_event():
    # For V1, we can trigger a load. 
    # In a real app, we might do this more carefully.
    db = database.SessionLocal()
    
    # SEED DATA (If empty) - For Prototype Convenience
    if db.query(models.User).count() == 0:
        print("Seeding default user...")
        default_user = models.User(name="Player 1", email="player@example.com")
        db.add(default_user)
        db.commit()
        db.refresh(default_user)
        
        # Check for our sample PGN
        pgn_files = glob.glob("openings/*.pgn")
        for pgn_path in pgn_files:
            name = os.path.basename(pgn_path).replace(".pgn", "").replace("_", " ").title()
            
            # Check if exists
            if db.query(models.Opening).filter(models.Opening.name == name).first():
                continue

            print(f"Seeding opening: {name}")
            
            # Detect Color
            color = "white"
            try:
                with open(pgn_path, "r") as f:
                    content = f.read()
                    if '[Color "Black"]' in content or '[Color "black"]' in content:
                        color = "black"
            except:
                pass

            op = models.Opening(name=name, pgn_path=pgn_path, color=color)
            db.add(op)
            db.commit()
            db.refresh(op)
            
            # Learn it (optional, maybe just add to DB and let user learn)
            # learned = models.LearnedOpening(user_id=default_user.id, opening_id=op.id)
            # db.add(learned)
            # db.commit()
            
    load_openings_to_memory(db)
    db.close()

class OpeningResponse(BaseModel):
    id: int
    name: str
    color: str
    is_learned: bool

    class Config:
        from_attributes = True

@app.get("/openings", response_model=List[OpeningResponse])
def get_openings(user_id: int = 1, db: Session = Depends(database.get_db)):
    # Get all openings
    openings = db.query(models.Opening).all()
    # Get learned IDs for this user
    learned = db.query(models.LearnedOpening).filter(models.LearnedOpening.user_id == user_id).all()
    learned_ids = {l.opening_id for l in learned}
    
    result = []
    for op in openings:
        result.append(OpeningResponse(id=op.id, name=op.name, color=op.color, is_learned=(op.id in learned_ids)))
    return result

@app.post("/openings/{opening_id}/toggle_learn")
def toggle_learning(opening_id: int, user_id: int = 1, db: Session = Depends(database.get_db)):
    existing = db.query(models.LearnedOpening).filter(
        models.LearnedOpening.user_id == user_id,
        models.LearnedOpening.opening_id == opening_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "unlearned"}
    else:
        new_entry = models.LearnedOpening(user_id=user_id, opening_id=opening_id)
        db.add(new_entry)
        db.commit()
        return {"status": "learned"}

class OpeningDetailResponse(OpeningResponse):
    pgn: str

@app.get("/openings/{opening_id}", response_model=OpeningDetailResponse)
def get_opening_detail(opening_id: int, user_id: int = 1, db: Session = Depends(database.get_db)):
    op = db.query(models.Opening).filter(models.Opening.id == opening_id).first()
    if not op:
        raise HTTPException(status_code=404, detail="Opening not found")
    
    # Check if learned
    learned = db.query(models.LearnedOpening).filter(
        models.LearnedOpening.user_id == user_id, 
        models.LearnedOpening.opening_id == opening_id
    ).first()
    
    pgn_content = ""
    if os.path.exists(op.pgn_path):
        with open(op.pgn_path, "r") as f:
            pgn_content = f.read()

    return OpeningDetailResponse(
        id=op.id, 
        name=op.name, 
        color=op.color,
        is_learned=bool(learned), 
        pgn=pgn_content
    )

@app.post("/admin/upload")
def upload_pgn(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    if not file.filename.endswith(".pgn"):
        raise HTTPException(status_code=400, detail="Only .pgn files allowed")
    
    file_location = f"openings/{file.filename}"
    
    # Save file
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    # Read content for tree
    with open(file_location, "r") as f:
        content = f.read()

    # Create DB Record
    name = file.filename.replace(".pgn", "").replace("_", " ").title()
    # Check duplicate
    existing = db.query(models.Opening).filter(models.Opening.name == name).first()
    if existing:
         return {"message": f"Opening '{name}' updated (file overwritten)."}
    
    new_op = models.Opening(name=name, pgn_path=file_location)
    db.add(new_op)
    db.commit()
    db.refresh(new_op)
    
    # Update Memory Tree
    chess_logic.GLOBAL_OPENING_TREE.add_opening(new_op.id, content)
    
    return {"message": f"Successfully uploaded '{name}'."}

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Chess Opening Trainer API is running."}

@app.post("/game/start", response_model=schemas.GameStartResponse)
def start_game(request: schemas.GameStartRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get learned opening IDs
    learned_ids = [lo.opening_id for lo in user.learned_openings]
    
    # Get colors for all openings
    all_openings = db.query(models.Opening).all()
    opening_colors = {op.id: op.color for op in all_openings}

    # Create Session Record
    db_session = models.Session(user_id=user.id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    # Initialize Game Logic
    game_session = chess_logic.GameSession(db_session.id, learned_ids, request.color, opening_colors)
    chess_logic.ACTIVE_SESSIONS[db_session.id] = game_session
    
    return schemas.GameStartResponse(
        session_id=db_session.id,
        initial_fen=game_session.board.fen(),
        message=f"Game started as {request.color.title()}.",
        color=request.color
    )

@app.post("/game/move", response_model=schemas.MoveResponse)
def play_move(request: schemas.MoveRequest, db: Session = Depends(database.get_db)):
    session_id = request.session_id
    
    if session_id not in chess_logic.ACTIVE_SESSIONS:
        # Try to reload from DB? Not implemented for V1 state persistence yet.
        raise HTTPException(status_code=404, detail="Active game session not found (restart required).")
    
    game = chess_logic.ACTIVE_SESSIONS[session_id]
    
    result = game.process_user_move(request.move_san)
    
    if not result["legal"]:
        # Don't update DB or state if illegal
        return schemas.MoveResponse(
            legal=False, in_theory=game.in_theory, engine_mode=game.engine_mode, 
            remaining_openings_count=len(game.current_candidates),
            message=result["message"], fen=game.board.fen()
        )
    
    return schemas.MoveResponse(**result)

@app.get("/users", response_model=List[str])
def list_users(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    return [f"{u.id}: {u.name}" for u in users]
