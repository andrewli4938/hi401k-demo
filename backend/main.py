from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from repository import init_db, get_settings, save_settings
from schemas import ContributionSettings, YtdSummary

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    init_db()
    print("Database initialized.")
    yield
    # shutdown
    print("Shutting down.")

app = FastAPI(title="401k Contribution API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # allow ANY origin (including all localhost ports)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Backend is working!"}

@app.get("/api/contribution", response_model=ContributionSettings)
def load_settings():
    return get_settings()

@app.put("/api/contribution", response_model=ContributionSettings)
def update_settings(settings: ContributionSettings):
    save_settings(settings)
    return settings

@app.get("/api/ytd_summary", response_model=YtdSummary)
def get_ytd_summary():
    summary = YtdSummary(
        salaryAnnual=80000,
        paychecksPerYear=24,
        ytdContributions=3000,
        currentAge=30,
        retirementAge=65
    )
    return summary

def main():
    print("Hello from backend!")


if __name__ == "__main__":
    main()
