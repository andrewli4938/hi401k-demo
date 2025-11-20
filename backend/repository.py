from db import get_db
from schemas import ContributionSettings

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS contribution_settings (
            id INTEGER PRIMARY KEY,
            contribution_type TEXT NOT NULL,
            contribution_value REAL NOT NULL
        )
    """)
    conn.commit()

def get_settings() -> ContributionSettings:
    conn = get_db()
    row = conn.execute("SELECT contribution_type, contribution_value FROM contribution_settings WHERE id = 1").fetchone()

    if not row:
        # return default if nothing exists
        return ContributionSettings(contributionType="percent", contributionValue=6)

    return ContributionSettings(
        contributionType=row["contribution_type"],
        contributionValue=row["contribution_value"]
    )

def save_settings(settings: ContributionSettings):
    conn = get_db()
    conn.execute("""
        INSERT INTO contribution_settings (id, contribution_type, contribution_value)
        VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            contribution_type = excluded.contribution_type,
            contribution_value = excluded.contribution_value;
    """, (settings.contributionType, settings.contributionValue))
    conn.commit()