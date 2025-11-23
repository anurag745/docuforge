from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: Optional[datetime]

    class Config:
        orm_mode = True


class TokenResponse(BaseModel):
    token: str
    user: UserOut


class ProjectCreate(BaseModel):
    title: str
    docType: str
    topic: Optional[str] = None
    scaffold: Optional[str] = None


class SectionCreate(BaseModel):
    title: str
    content: Optional[str] = None


class SectionSaveRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class SectionOut(BaseModel):
    id: int
    project_id: int
    title: str
    content: Optional[str]
    draft: bool
    order_index: int

    class Config:
        orm_mode = True


class ProjectOut(BaseModel):
    id: int
    owner_id: int
    title: str
    docType: str
    topic: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    sections: List[SectionOut] = []

    class Config:
        orm_mode = True


class GenerateRequest(BaseModel):
    sectionId: Optional[int] = None
    slideIndex: Optional[int] = None
    template: Optional[str] = None


class GenerateResponse(BaseModel):
    text: str
    generationId: str
    meta: Optional[dict] = None


class RefineRequest(BaseModel):
    sectionId: int
    prompt: str


class FeedbackRequest(BaseModel):
    sectionId: int
    like: bool


class CommentRequest(BaseModel):
    sectionId: int
    comment: str


class ExportRequest(BaseModel):
    format: str
    sections: Optional[List[int]] = None
    includeComments: Optional[bool] = False
    # Optional client-side sections payload: list of objects with id, title, content
    # If provided, the export endpoint will use these instead of loading sections from the DB.
    clientSections: Optional[List[dict]] = None


class OutlineRequest(BaseModel):
    topic: str
    template: Optional[str] = None


class OutlineSuggestRequest(BaseModel):
    topic: str
    docType: str
    template: Optional[str] = None


# Template model for PPTX generation and selection
class TemplateModel(BaseModel):
    name: str
    description: Optional[str]
    accentColor: Optional[str]
    bgColor: Optional[str] = None
    bgType: Optional[str] = "solid"
    bgGradient: Optional[dict] = None
    profilePhotoPlaceholder: Optional[bool] = False
    fontTitle: Optional[str] = None
    fontBody: Optional[str] = None
    titleFontSize: Optional[int] = None
    subtitleFontSize: Optional[int] = None
    headingFontSize: Optional[int] = None
    bodyFontSize: Optional[int] = None
    layoutHints: Optional[dict] = None


from typing import Literal


class SlideModel(BaseModel):
    type: Literal["title","summary","experience","skills","projects","education","contact"]
    title: Optional[str] = None
    subtitle: Optional[str] = None
    bullets: Optional[List[str]] = None
    notes: Optional[str] = None
    images: Optional[List[str]] = None
    items: Optional[List[dict]] = None


class DeckModel(BaseModel):
    title: str
    author: Optional[str] = None
    template: TemplateModel
    slides: List[SlideModel]


