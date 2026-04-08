from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

# Import LangChain tools for dynamic ingestion
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

from orchestrator import app as ai_pipeline

# Initialize API
app = FastAPI(
    title="Enterprise Multi-Agent RAG API",
    description="Microservice handling dynamic document ingestion and agentic fact-checking.",
    version="1.0.0",
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the data directory exists
os.makedirs("./data", exist_ok=True)


class QueryRequest(BaseModel):
    question: str


# --- ENDPOINT 1: DYNAMIC INGESTION ---
@app.post("/api/v1/ingest")
async def ingest_document(file: UploadFile = File(...)):
    print(f"\n[API] Received file for ingestion: {file.filename}")
    try:
        # --- Delete OLD DATABASE ---
        # AI only remembers the "Active Document"
        if os.path.exists("./db"):
            shutil.rmtree("./db")
            print("[API] Purged previous Knowledge Base.")

        # 1. Save the uploaded file temporarily
        file_location = f"./data/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)

        # 2. Process with LangChain dynamically
        loader = PyPDFLoader(file_location)
        documents = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200
        )
        chunks = text_splitter.split_documents(documents)

        # 3. Build a fresh ChromaDB
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        Chroma.from_documents(
            documents=chunks, embedding=embeddings, persist_directory="./db"
        )

        print(f"[API] Successfully vectorized and stored {file.filename}")
        return {
            "status": "success",
            "message": "Document vectorized and added to Knowledge Base.",
        }

    except Exception as e:
        print(f"[API] Ingestion Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# --- ENDPOINT 2: AGENTIC QUERY ---
@app.post("/api/v1/ask")
async def ask_document(req: QueryRequest):
    print(f"\n[API] Received question: {req.question}")
    try:
        # Trigger the LangGraph multi-agent workflow
        result = ai_pipeline.invoke({"question": req.question, "revision_count": 0})

        if "final_answer" in result:
            return {
                "status": "success",
                "data": {
                    "answer": result["final_answer"],
                    "revisions_required": result.get("revision_count", 0),
                },
            }
        else:
            return {
                "status": "failed",
                "feedback": result.get("feedback", "Critic rejected all attempts."),
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
