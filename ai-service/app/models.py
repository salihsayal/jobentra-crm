from pydantic import BaseModel, Field


class MemberData(BaseModel):
    memberId: str = ""
    firstName: str = ""
    lastName: str = ""
    email: str = ""
    phone: str = ""
    status: str = ""
    notes: str = ""


class WorkExperienceItem(BaseModel):
    jobTitle: str = ""
    company: str = ""
    startDate: str = ""
    endDate: str = ""
    description: str = ""


class ExtractionResult(BaseModel):
    skills: list[str] = Field(default_factory=list)
    workExperience: list[WorkExperienceItem] = Field(default_factory=list)
