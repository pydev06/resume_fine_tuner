from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import resume, interview, interview_analytics, payment

app = FastAPI(title="AI Resume Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/api", tags=["resume"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(interview_analytics.router, prefix="/api", tags=["interview_analytics"])
app.include_router(payment.router, prefix="/api/payment", tags=["payment"])


@app.get("/")
def read_root():
    return {"message": "AI Resume Analyzer API", "status": "running"}
