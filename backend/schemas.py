# schemas.py
from typing import Literal
from pydantic import BaseModel

ContributionType = Literal["percent", "dollar"]

class ContributionSettings(BaseModel):
    contributionType: ContributionType
    contributionValue: float  # percent or dollars based on contributionType


class YtdSummary(BaseModel):
    salaryAnnual: float
    paychecksPerYear: int
    ytdContributions: float
    currentAge: int
    retirementAge: int