from pydantic import BaseModel, EmailStr, Field


class ChatRequest(BaseModel):
    question: str = Field(
        min_length=1,
        max_length=4000,
        description="Question to ask the AI assistant",
    )


class ChatResponse(BaseModel):
    answer: str
    model: str


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr


class AuthResponse(BaseModel):
    message: str
    user: UserResponse


class CreateConversationRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)


class SendMessageRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)


class DashboardStatsResponse(BaseModel):
    documents_count: int
    questions_count: int
    last_activity_at: str | None = None
