# Deployment Guide: Chess Opening Trainer

This guide explains how to deploy the Chess Opening Trainer with a **Next.js Frontend on Vercel** and a **FastAPI Backend on a Linux VPS**.

---

## 0. Repository Structure
This project uses a single Git repository (monorepo) for both frontend and backend. You **do not** need to separate them.

- **Frontend:** Deployed to Vercel. You will point Vercel to the `frontend` sub-directory.
- **Backend:** Deployed to your VPS. You will clone the whole repo but only run the code inside the `backend` sub-directory.

---

## 1. Backend Deployment (Linux VPS)

### Prerequisites
- A Linux VPS (Ubuntu/Debian recommended)
- Python 3.10+ installed
- `git` installed

### Step-by-Step Setup

1. **Install Stockfish & System Dependencies**
   ```bash
   sudo apt update
   sudo apt install -y stockfish python3-pip python3-venv
   ```

2. **Clone and Prepare Backend**
   ```bash
   # On your VPS
   git clone <your-repo-url>
   cd chess/backend
   ```

3. **Setup Virtual Environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install gunicorn uvicorn
   ```

4. **Environment Variables**
   Set the path to the Linux Stockfish binary:
   ```bash
   export STOCKFISH_PATH=/usr/games/stockfish
   ```

5. **Run with Gunicorn**
   For production, we use Gunicorn with Uvicorn workers for high performance and stability:
   ```bash
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```
   *Note: `-w 4` creates 4 worker processes. Adjust based on your VPS CPU cores.*

6. **Firewall**
   Ensure port 8000 is open:
   ```bash
   sudo ufw allow 8000
   ```

---

## 2. Frontend Deployment (Vercel)

### Step-by-Step Setup

1. **Push to GitHub**
   Ensure your code is pushed to a GitHub repository.

2. **Import to Vercel**
   - Log in to [Vercel](https://vercel.com).
   - Click **"Add New"** > **"Project"**.
   - Import your repository.

3. **Configure Project**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Environment Variables:**
     - Add a new variable:
       - **Key:** `NEXT_PUBLIC_API_URL`
       - **Value:** `http://<YOUR_VPS_IP>:8000`

4. **Deploy**
   Click **Deploy**. Vercel will build your site and provide a production URL.

---

## 3. Production Considerations

### Backend Persistence
By default, the SQLite database and uploaded PGNs stay in the `backend/` folder. Ensure the user running Gunicorn has write permissions to that directory.

### HTTPS (Recommended)
Vercel provides HTTPS automatically. For the backend, it is recommended to use **Nginx** as a reverse proxy on your VPS with **Let's Encrypt** for SSL. 
If the Frontend is `https` and the Backend is `http`, some browsers may block the requests ("Mixed Content"). To fix this:
1. Point a subdomain (e.g., `api.yourdomain.com`) to your VPS IP.
2. Setup Nginx to proxy `api.yourdomain.com` to `localhost:8000`.
3. Use `https://api.yourdomain.com` as your `NEXT_PUBLIC_API_URL`.

### Process Management
Use `pm2` or a `systemd` service to keep the Gunicorn process running in the background after you close your terminal.

**Example systemd service (`/etc/systemd/system/chess-backend.service`):**
```ini
[Unit]
Description=Gunicorn instance to serve Chess Backend
After=network.target

[Service]
User=your-user
Group=www-data
WorkingDirectory=/home/your-user/chess/backend
Environment="PATH=/home/your-user/chess/backend/venv/bin"
Environment="STOCKFISH_PATH=/usr/games/stockfish"
ExecStart=/home/your-user/chess/backend/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

[Install]
WantedBy=multi-user.target
```
