from pydantic import BaseModel


class MemberData(BaseModel):
    memberId: str = ""
    firstName: str = ""
    lastName: str = ""
    email: str = ""
    phone: str = ""
    status: str = ""
    notes: str = ""
