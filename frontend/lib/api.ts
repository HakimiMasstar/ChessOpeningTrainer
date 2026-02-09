import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Default FastAPI port

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface GameStartResponse {
  session_id: number;
  initial_fen: string;
  message: string;
}

export interface MoveResponse {
  legal: boolean;
  in_theory: boolean;
  engine_mode: boolean;
  bot_move: string | null;
  remaining_openings_count: number;
  candidate_opening_ids: number[];
  message: string | null;
  fen: string;
  mistake_made: boolean;
}

export interface Opening {
  id: number;
  name: string;
  is_learned: boolean;
  color: "white" | "black";
}

export const getOpenings = async (): Promise<Opening[]> => {
  const response = await api.get<Opening[]>('/openings');
  return response.data;
};

export const toggleLearning = async (openingId: number): Promise<void> => {
  await api.post(`/openings/${openingId}/toggle_learn`);
};

export interface OpeningDetail extends Opening {
  pgn: string;
}

export const getOpeningDetail = async (openingId: number): Promise<OpeningDetail> => {
  const response = await api.get<OpeningDetail>(`/openings/${openingId}`);
  return response.data;
};

export const uploadPgn = async (file: File): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<{ message: string }>('/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const startGame = async (userId: number, color: "white" | "black" = "white"): Promise<GameStartResponse> => {
  const response = await api.post<GameStartResponse>('/game/start', { user_id: userId, color });
  return response.data;
};

export const playMove = async (sessionId: number, moveSan: string): Promise<MoveResponse> => {
  const response = await api.post<MoveResponse>('/game/move', { session_id: sessionId, move_san: moveSan });
  return response.data;
};

export default api;
