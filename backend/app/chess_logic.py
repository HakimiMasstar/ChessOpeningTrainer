import chess
import chess.pgn
import chess.engine
import io
import random
import os
from typing import List, Dict, Optional, Set

# --- Stockfish Integration ---

STOCKFISH_PATH = os.environ.get("STOCKFISH_PATH", "stockfish.exe") # Default to same dir or PATH

def get_engine_move(fen: str) -> Optional[str]:
    """Starts Stockfish, gets one best move, and closes it."""
    # Note: For production, you might want to keep the engine process alive
    # but for V1, starting/stopping is simpler and prevents ghost processes.
    try:
        # Check if file exists
        search_paths = [STOCKFISH_PATH, "backend/stockfish.exe", "stockfish"]
        engine_path = None
        for p in search_paths:
            if os.path.exists(p) or (os.name != 'nt' and os.access(p, os.X_OK)):
                engine_path = p
                break
        
        if not engine_path:
            print(f"Stockfish binary NOT found. Searched: {search_paths}. Please place stockfish.exe in backend/ folder.")
            return None

        with chess.engine.SimpleEngine.popen_uci(engine_path) as engine:
            board = chess.Board(fen)
            result = engine.play(board, chess.engine.Limit(time=0.5)) # 500ms think time
            return board.san(result.move) if result.move else None
    except Exception as e:
        print(f"Engine Error: {e}")
        return None

# --- In-Memory Opening Tree Structure ---

class OpeningNode:
    def __init__(self, fen: str, move_san: Optional[str] = None, parent: Optional['OpeningNode'] = None):
        self.fen = fen
        self.move_san = move_san
        self.parent = parent
        self.children: Dict[str, 'OpeningNode'] = {} # map move_san -> Node
        self.opening_ids: Set[int] = set()

    def add_child(self, move_san: str, fen: str) -> 'OpeningNode':
        if move_san not in self.children:
            self.children[move_san] = OpeningNode(fen, move_san, self)
        return self.children[move_san]

class OpeningTree:
    def __init__(self):
        self.root = OpeningNode(chess.STARTING_FEN)
        self.nodes_by_fen: Dict[str, List[OpeningNode]] = {} # For potential transposition handling, though strictly tree-based for now

    def add_opening(self, opening_id: int, pgn_content: str):
        pgn = io.StringIO(pgn_content)
        game = chess.pgn.read_game(pgn)
        
        if not game:
            return

        board = game.board()
        current_node = self.root
        current_node.opening_ids.add(opening_id)

        for move in game.mainline_moves():
            move_san = board.san(move)
            board.push(move)
            fen = board.fen()
            
            current_node = current_node.add_child(move_san, fen)
            current_node.opening_ids.add(opening_id)
    
    def get_candidate_nodes(self, opening_ids: List[int]) -> List[OpeningNode]:
        """
        Returns the root nodes (which are just the global root for now)
        filtered by the user's learned openings.
        Actually, it should returns the root, but we need to track which *specific* 
        opening IDs are valid for a user.
        """
        # For V1, we assume all openings start from the standard start position.
        # We just verify that the root has the opening_ids.
        # In a more complex scenario, we might have different starting positions.
        return [self.root]

# --- Global State (Simple In-Memory Cache) ---
# In a real app, this would be populated from the DB on startup.
GLOBAL_OPENING_TREE = OpeningTree()


# --- Game Session Logic ---

class GameSession:
    def __init__(self, session_id: int, learned_opening_ids: List[int], user_color: str, opening_colors: Dict[int, str]):
        self.session_id = session_id
        self.board = chess.Board()
        self.user_color = user_color # 'white' or 'black'
        
        # Filter learned IDs by color
        self.learned_opening_ids = {
            oid for oid in learned_opening_ids 
            if opening_colors.get(oid) == user_color
        }
        
        # The set of current nodes in the tree that match the game state
        self.current_candidates: List[OpeningNode] = []
        
        # Initialize candidates at root
        root = GLOBAL_OPENING_TREE.root
        common_ids = root.opening_ids.intersection(self.learned_opening_ids)
        if common_ids:
            self.current_candidates = [root]
        
        self.in_theory = True
        self.engine_mode = False
        
        # If User is Black, Bot (White) must move first
        if self.user_color == "black":
            self.make_bot_move()

    def make_bot_move(self) -> Optional[str]:
        """Calculates and plays the bot move (Theory or Engine). Returns SAN."""
        print(f"make_bot_move called. Color: {self.user_color}. Candidates: {len(self.current_candidates)}")
        bot_move = None
        
        if self.in_theory:
            # Pick a reply from the remaining candidates
            possible_replies = [] 
            
            for node in self.current_candidates:
                for move_san_key, child_node in node.children.items():
                    if child_node.opening_ids.intersection(self.learned_opening_ids):
                        possible_replies.append((move_san_key, child_node))
            
            print(f"Theory replies: {len(possible_replies)}")
            
            if possible_replies:
                reply_san, reply_node = random.choice(possible_replies)
                bot_move = reply_san
                self.board.push_san(reply_san)
                print(f"Bot played theory: {bot_move}")
                
                # Update candidates
                new_candidates = []
                for node in self.current_candidates:
                    if reply_san in node.children:
                        child = node.children[reply_san]
                        if child.opening_ids.intersection(self.learned_opening_ids):
                            new_candidates.append(child)
                self.current_candidates = new_candidates
                
                # Check continuation
                has_continuations = False
                for node in self.current_candidates:
                    for child in node.children.values():
                        if child.opening_ids.intersection(self.learned_opening_ids):
                            has_continuations = True
                            break
                    if has_continuations: break
                
                if not has_continuations:
                    self.in_theory = False
                    self.engine_mode = True

            else:
                print("No theory moves found.")
                self.in_theory = False
                self.engine_mode = True
        
        if self.engine_mode and not bot_move:
             print("Entering Engine Mode logic.")
             if not self.board.is_game_over():
                 best_move_san = get_engine_move(self.board.fen())
                 if best_move_san:
                     bot_move = best_move_san
                     self.board.push_san(bot_move)
                     print(f"Bot played Engine: {bot_move}")
                 else:
                     # Fallback
                     print("Engine failed, trying random.")
                     legal_moves = list(self.board.legal_moves)
                     if legal_moves:
                         random_move = random.choice(legal_moves)
                         bot_move = self.board.san(random_move)
                         self.board.push(random_move)
                         print(f"Bot played Random: {bot_move}")
        
        return bot_move

    def process_user_move(self, move_san: str) -> Dict:
        # 1. Validate Legality
        try:
            move = self.board.parse_san(move_san)
        except ValueError:
             return {"legal": False, "message": "Illegal move format."}
        
        if move not in self.board.legal_moves:
             return {"legal": False, "message": "Illegal move."}

        # Apply move to board
        self.board.push(move)
        
        mistake_made = False

        # 2. Update Candidates (Theory Check)
        if self.in_theory:
            next_candidates = []
            for node in self.current_candidates:
                if move_san in node.children:
                    child = node.children[move_san]
                    if child.opening_ids.intersection(self.learned_opening_ids):
                        next_candidates.append(child)
            
            self.current_candidates = next_candidates

            if not self.current_candidates:
                self.in_theory = False
                self.engine_mode = True
                mistake_made = True
            else:
                mistake_made = False

        # 3. Bot Reply
        bot_move = self.make_bot_move()
        
        message = "Your turn."
        if mistake_made: message = "Mistake! Engine taking over."
        if self.engine_mode and not mistake_made: message = "Engine mode."
        if self.board.is_game_over(): message = "Game Over."

        # Calculate remaining candidate IDs
        current_opening_ids = set()
        for node in self.current_candidates:
            current_opening_ids.update(node.opening_ids)
        # Filter by what the user actually learned/is playing color-wise
        final_ids = list(current_opening_ids.intersection(self.learned_opening_ids))

        return {
            "legal": True,
            "in_theory": self.in_theory,
            "engine_mode": self.engine_mode,
            "bot_move": bot_move,
            "remaining_openings_count": len(self.current_candidates), # Node count (legacy)
            "candidate_opening_ids": final_ids, # Actual Opening IDs
            "message": message,
            "fen": self.board.fen(),
            "mistake_made": mistake_made
        }

# Global Session Store (In-Memory for V1)
ACTIVE_SESSIONS: Dict[int, GameSession] = {}
