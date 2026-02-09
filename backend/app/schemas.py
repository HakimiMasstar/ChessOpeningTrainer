from pydantic import BaseModel
from typing import Optional, List

class GameStartRequest(BaseModel):
    user_id: int
    color: str = "white" # 'white' or 'black'

class GameStartResponse(BaseModel):
    session_id: int
    initial_fen: str
    message: str
    color: str # confirm the color to frontend

class MoveRequest(BaseModel):
    session_id: int
    move_san: str  # Standard Algebraic Notation (e.g., "e4", "Nf3")

class MoveResponse(BaseModel):
    legal: bool
    in_theory: bool
    engine_mode: bool
    bot_move: Optional[str] = None
    remaining_openings_count: int
    candidate_opening_ids: List[int] = []
    message: Optional[str] = None
    fen: str # Current board state FEN

class OpeningCreate(BaseModel):
    name: str
    pgn_content: str

class UserCreate(BaseModel):
    name: str
    email: str
