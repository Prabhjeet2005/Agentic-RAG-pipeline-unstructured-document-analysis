import os
from dotenv import load_dotenv
from typing import TypedDict  # For JSON
from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langgraph.checkpoint.memory import MemorySaver

# .env file
load_dotenv()


# "State" (The shared whiteboard for our agents)
class AgentState(TypedDict):
    question: str
    context: str
    draft_answer: str
    feedback: str
    revision_count: int
    final_answer: str


# Initialize AI Brains (LLM) and Database
# LLaMA-3 via Groq for ultra-fast, low-latency reasoning. Temperature=0 ensures strictly factual responses.
llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# --- THE AGENTS (NODES) --


def retriever_agent(state: AgentState):
    print("-> Agent 1 (Retriever): Searching the vector database...")
    vector_db = Chroma(persist_directory="./db", embedding_function=embeddings)
    # Fetch the 3 most relevant chunks of text from our PDF
    docs = vector_db.similarity_search(state["question"], k=3)
    context = "\n\n".join([doc.page_content for doc in docs])
    return {"context": context, "revision_count": state.get("revision_count", 0)}


def analyst_agent(state: AgentState):
    print(
        f"-> Agent 2 (Analyst): Drafting answer (Attempt {state['revision_count'] + 1})..."
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an expert technical analyst. Answer the user's question using ONLY the provided context. Do not invent information. If you received feedback from the critic, adjust your answer accordingly.\n\nContext:\n{context}\n\nCritic Feedback:\n{feedback}",
            ),
            ("user", "{question}"),
        ]
    )

    chain = prompt | llm
    # If there is no feedback yet, we pass "None"
    feedback = state.get("feedback", "None")
    response = chain.invoke(
        {
            "question": state["question"],
            "context": state["context"],
            "feedback": feedback,
        }
    )

    return {"draft_answer": response.content}


def critic_agent(state: AgentState):
    print("-> Agent 3 (Critic): Fact-checking the draft against the source context...")

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a senior auditor verifying an AI's draft answer. 
        Check if the draft answer is fully supported by the Context. 
        
        CRITICAL RULES:
        1. The draft MAY make reasonable logical deductions (e.g., identifying a document as a 'resume' if it contains 'Experience' and 'Education' sections).
        2. The draft MUST NOT invent numbers, names, or facts not present in the context.
        
        If the draft is logically sound and factually grounded, output exactly the word: APPROVED. 
        If it hallucinates outside facts, output a short sentence explaining what it hallucinated.
        
        Context:\n{context}\n\nQuestion:\n{question}\n\nDraft Answer:\n{draft_answer}""",
            )
        ]
    )
    chain = prompt | llm
    response = chain.invoke(
        {
            "question": state["question"],
            "context": state["context"],
            "draft_answer": state["draft_answer"],
        }
    ).content

    if "APPROVED" in response:
        print("-> Agent 3 (Critic): Draft APPROVED!")
        return {"final_answer": state["draft_answer"]}
    else:
        print(f"-> Agent 3 (Critic): Draft REJECTED. Reason: {response}")
        return {"feedback": response, "revision_count": state["revision_count"] + 1}


# -- ROUTING LOGIC ---


def route_to_revision(state: AgentState):
    # If the critic gave a final answer, we are done
    if "final_answer" in state:
        return "END"
    # If the analyst failed 3 times, we stop to prevent infinite loops
    elif state["revision_count"] >= 3:
        return "MAX_RETRIES"
    # Otherwise, send it back to the Analyst to try again
    else:
        return "REVISE"


# --- PIPELINE

workflow = StateGraph(AgentState)

# Add the agents to the graph
workflow.add_node("Retriever", retriever_agent)
workflow.add_node("Analyst", analyst_agent)
workflow.add_node("Critic", critic_agent)

# Connect the agents
workflow.add_edge(START, "Retriever")
workflow.add_edge("Retriever", "Analyst")
workflow.add_edge("Analyst", "Critic")

# Add the conditional logic for the loop
workflow.add_conditional_edges(
    "Critic", route_to_revision, {"END": END, "MAX_RETRIES": END, "REVISE": "Analyst"}
)

# --- NEW: Memory Checkpointer ---
memory = MemorySaver()

# Compile the engine into an executable application
app = workflow.compile()

# -- EXECUTE ---
if __name__ == "__main__":
    # test it with a specific question about  PDF 
    test_question = "What is the primary function of the Transformer architecture described in the paper?"
    print(f"\nUser Question: '{test_question}'\n")
    print("Executing Multi-Agent Workflow...\n")

    # Run the engine
    result = app.invoke({"question": test_question, "revision_count": 0})

    print("\n================ FINAL VERIFIED OUTPUT ================\n")
    if "final_answer" in result:
        print(result["final_answer"])
    else:
        print(
            "SYSTEM FAILED: The Analyst could not satisfy the Critic after 3 attempts."
        )
        print(f"Final Critic Feedback: {result.get('feedback')}")
    print("\n=======================================================\n")
