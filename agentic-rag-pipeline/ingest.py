from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import os

# 1. Define Paths
DATA_DIR = "./data"
DB_DIR = "./db"
FILE_NAME = "sample_document.pdf"  # PDF in the data folder
FILE_PATH = os.path.join(DATA_DIR, FILE_NAME)


def build_vector_database():
    print(f"Loading document: {FILE_PATH}...")

    # 2. Load the PDF
    loader = PyPDFLoader(FILE_PATH)
    documents = loader.load()

    # 3. Split the text into manageable chunks
    # 1000 characters per chunk, with a 200-character overlap avoid cut sentences in half
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)
    print(f"Split document into {len(chunks)} chunks.")

    # 4. Initialize the open-source embedding model
    print(
        "Downloading/Loading Embedding Model (This may take a moment the first time)..."
    )
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    # 5. Create and save the Vector Database locally
    print("Generating vectors and saving to ChromaDB...")
    vector_db = Chroma.from_documents(
        documents=chunks, embedding=embeddings, persist_directory=DB_DIR
    )

    print("Vector Database successfully built and saved to ./db!")


if __name__ == "__main__":
    build_vector_database()
