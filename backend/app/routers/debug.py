from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import database, models, chess_logic

router = APIRouter()

@router.get("/debug/play_black")
def debug_play_black(db: Session = Depends(database.get_db)):
    # Mock user with ID 1
    user = db.query(models.User).first()
    learned_ids = [lo.opening_id for lo in user.learned_openings]
    all_openings = db.query(models.Opening).all()
    opening_colors = {op.id: op.color for op in all_openings}
    
    logs = []
    logs.append(f"User: {user.name}")
    logs.append(f"Learned IDs: {learned_ids}")
    
    # Create Session
    session = chess_logic.GameSession(999, learned_ids, "black", opening_colors)
    
    logs.append(f"Session Color: {session.user_color}")
    logs.append(f"Filtered Learned IDs: {session.learned_opening_ids}")
    logs.append(f"Initial Candidates: {len(session.current_candidates)}")
    logs.append(f"In Theory: {session.in_theory}")
    logs.append(f"Engine Mode: {session.engine_mode}")
    logs.append(f"Board FEN: {session.board.fen()}")
    
    return logs
