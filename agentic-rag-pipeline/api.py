from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from orchestrator import app as ai_pipeline

# Initialize API
app = FastAPI(
    title="Enterprise Multi-Agent RAG API",
    description="Microservice handling document retrieval and agentic fact-checking.",
    version="1.0.0",
)


# expected format of the incoming request
class QueryRequest(BaseModel):
    question: str


# endpoint
@app.post("/api/v1/ask")
async def ask_document(req: QueryRequest):
    print(f"\n[API] Received question: {req.question}")

    try:
        # Trigger the LangGraph multi-agent workflow
        result = ai_pipeline.invoke({"question": req.question, "revision_count": 0})

        # Check if the Critic approved the final answer
        if "final_answer" in result:
            return {
                "status": "success",
                "data": {
                    "answer": result["final_answer"],
                    "revisions_required": result.get("revision_count", 0),
                },
            }
        else:
            # If the Analyst failed 3 times, return an error
            return {
                "status": "failed",
                "feedback": result.get("feedback", "Critic rejected all attempts."),
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
