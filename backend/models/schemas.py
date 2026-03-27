from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class QuestionChip(BaseModel):
    """A quick-pick answer option for a question"""
    text: str


class Question(BaseModel):
    """A single clarifying question with answer options"""
    id: str
    text: str
    help_text: str
    chips: List[str] = Field(min_length=3, max_length=4)
    allow_free_text: bool = True


class QuestionsRequest(BaseModel):
    """Request to generate clarifying questions"""
    idea: str = Field(min_length=10, max_length=3000)


class QuestionsResponse(BaseModel):
    """Response containing generated questions"""
    questions: List[Question]


class Answer(BaseModel):
    """User's answer to a question"""
    question: str
    answer: str


class GenerateRequest(BaseModel):
    """Request to generate architecture spec"""
    idea: str
    answers: List[Answer]


class RefineRequest(BaseModel):
    """Request to refine existing spec"""
    session_id: str
    current_spec: str
    history: List[dict]
    message: str


class RefineResponse(BaseModel):
    """Response with refined spec"""
    spec: str
    session_id: str


class ChatRequest(BaseModel):
    """Request to ask a question about the spec"""
    session_id: str
    current_spec: str
    message: str


class ChatResponse(BaseModel):
    """Response with answer to question"""
    answer: str
    session_id: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Health status")
    model_configured: bool = Field(..., description="Whether model is configured")
    inference_authenticated: bool = Field(..., description="Whether inference API auth is successful")
    inference_provider: Optional[str] = Field(None, description="Active inference provider (remote or ollama)")
