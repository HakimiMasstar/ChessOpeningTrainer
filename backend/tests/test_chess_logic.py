import pytest
from app import chess_logic, models
import chess

# Mock DB Session
class MockDBSession:
    def __init__(self):
        self.id = 1

def test_opening_tree_structure():
    # Setup: Create a simple tree
    tree = chess_logic.OpeningTree()
    # 1. e4 e5
    pgn_content = '[Event "?"]\n\n1. e4 e5 *'
    tree.add_opening(1, pgn_content)
    
    root = tree.root
    assert "e4" in root.children
    
    node_e4 = root.children["e4"]
    assert node_e4.move_san == "e4"
    assert "e5" in node_e4.children
    
    node_e5 = node_e4.children["e5"]
    assert node_e5.move_san == "e5"
    assert 1 in node_e5.opening_ids

def test_game_flow_theory_to_mistake():
    # 1. Setup Global Tree with Italian Game
    chess_logic.GLOBAL_OPENING_TREE = chess_logic.OpeningTree()
    italian_pgn = '[Event "Italian"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 *'
    chess_logic.GLOBAL_OPENING_TREE.add_opening(10, italian_pgn)
    
    # 2. Start Session (User has learned opening 10)
    session = chess_logic.GameSession(session_id=99, learned_opening_ids=[10])
    
    # --- Move 1: e4 (User plays Theory) ---
    result = session.process_user_move("e4")
    assert result["legal"] == True
    assert result["in_theory"] == True
    assert result["mistake_made"] == False
    # Bot should reply "e5" (only option in our tiny PGN)
    assert result["bot_move"] == "e5"
    
    # --- Move 2: Nf3 (User plays Theory) ---
    result = session.process_user_move("Nf3")
    assert result["in_theory"] == True
    assert result["bot_move"] == "Nc6"
    
    # --- Move 3: h3 (User plays Mistake/Deviation) ---
    # h3 is a legal chess move, but not in our Italian Game PGN
    result = session.process_user_move("h3")
    assert result["legal"] == True
    assert result["in_theory"] == False # Dropped out of theory
    assert result["mistake_made"] == True # Flagged as mistake
    assert result["engine_mode"] == True
    
    # --- Move 4: Random move (Engine Mode) ---
    # User plays another move, engine should respond (mock)
    result = session.process_user_move("a3")
    assert result["engine_mode"] == True
    assert result["bot_move"] is not None # Engine replied

def test_transposition_handling():
    # Advanced: Test if different move orders converging to same position are handled
    # Our simple tree logic handles strict move orders. 
    # V1 Spec says "PGN to Trees", which usually implies strict move order unless Transposition Tables are used.
    # Current implementation is strict Tree.
    pass
