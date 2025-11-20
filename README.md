# Running the webpage

## Frontend (Node.js, React)
1. Install dependencies
```bash
npm install
```
2. Run dev server
```bash
npm run dev
```
Shortcut: press o + enter to open in browser

## Backend (Python, FastAPI)
1. Download **uv package manager**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```
2. Navigate to **backend** folder and install dependencies
```bash
cd backend
uv sync
```
3. Run the API server
```bash
uv run uvicorn main:app --reload --port 8000
```
