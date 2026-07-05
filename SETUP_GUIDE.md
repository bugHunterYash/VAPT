# VMT Project Setup Guide

This guide covers everything you need to get the VMT (Vulnerability Management Tool) project fully up and running on your local machine using VS Code.

## Prerequisites

Before starting, ensure you have the following installed on your machine:
1. **[VS Code](https://code.visualstudio.com/)**: Your code editor.
2. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: Required to run the database (PostgreSQL with pgvector) and MinIO (object storage).
3. **[Node.js](https://nodejs.org/)**: Required to run the Next.js frontend (Version 18 or above recommended).
4. **[Python](https://www.python.org/downloads/)**: Required to run the FastAPI backend (Version 3.9+ recommended).
5. **[Ollama](https://ollama.com/)**: Required for the local AI generation features.

---

## 1. Start External Services (Docker)

The project uses Docker to manage the database and object storage.
1. Open **Docker Desktop** and make sure the Docker engine is running.
2. In VS Code, open a new terminal (`Terminal` -> `New Terminal`).
3. Ensure you are in the root directory of the project (`vmt`).
4. Run the following command to start PostgreSQL and MinIO in the background:
   ```bash
   docker-compose up -d
   ```

---

## 2. Setup Ollama (Local AI)

The backend relies on Ollama and specifically the `qwen2.5-coder` model for AI generation.
1. Make sure you have installed Ollama from [ollama.com](https://ollama.com/) and it is running in your system tray/background.
2. Open a terminal and pull the required model:
   ```bash
   ollama run qwen2.5-coder
   ```
   *(This will download the model. Once it drops you into a chat prompt, you can type `/bye` to exit. The model is now ready.)*

---

## 3. Setup and Run the Backend (Python/FastAPI)

1. Open a new terminal in VS Code.
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Create a Python virtual environment to keep dependencies isolated:
   ```bash
   python -m venv venv
   ```
4. Activate the virtual environment:
   - **Windows (Command Prompt / PowerShell)**:
     ```bash
     .\venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
5. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
6. Start the FastAPI backend server:
   ```bash
   fastapi dev app/main.py
   ```
   *(Or alternatively, `uvicorn app.main:app --reload` depending on how main.py is structured)*
   The backend should now be running on `http://localhost:8000`.

---

## 4. Setup and Run the Frontend (Node.js/Next.js)

1. Open a **new, separate terminal** in VS Code (so your backend keeps running).
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install the Node.js dependencies:
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend should now be accessible in your browser at `http://localhost:3000`.

---

## Summary of Running the App

Every time you want to work on this project, you will need to:
1. Ensure **Docker Desktop** and **Ollama** are running.
2. Run `docker-compose up -d` in the root folder (if containers are stopped).
3. Open a terminal, `cd backend`, activate the virtual environment (`.\venv\Scripts\activate`), and run `fastapi dev app/main.py`.
4. Open another terminal, `cd frontend`, and run `npm run dev`.
