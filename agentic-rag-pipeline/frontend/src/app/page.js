"use client";

import { useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      // Direct Axios call to our FastAPI microservice
      const response = await axios.post("http://127.0.0.1:8000/api/v1/ask", {
        question: query,
      });

      if (response.data.status === "success") {
        setResult(response.data.data);
      } else {
        setError(response.data.feedback);
      }
    } catch (err) {
      setError("Failed to connect to the AI microservice. Ensure the FastAPI server is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
		<div className="min-h-screen p-8 md:p-16 font-sans">
			<div className="max-w-4xl mx-auto space-y-8">
				{/* Header Section */}
				<header className="border-b border-slate-700 pb-6">
					<h1 className="text-3xl font-bold tracking-tight text-white">
						Enterprise Contextual Retrieval
					</h1>
					<p className="text-slate-400 mt-2">
						Multi-Agent RAG Pipeline • Active Document:{" "}
						<span className="text-blue-400 font-mono">
							sample_document.pdf
						</span>
					</p>
				</header>

				{/* Search Form */}
				<form onSubmit={handleSearch} className="relative">
					<div className="flex gap-4">
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Query the document (e.g., What is the primary function of the Transformer?)"
							className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
							disabled={loading}
						/>
						<button
							type="submit"
							disabled={loading}
							className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex-shrink-0">
							{loading ? "Processing..." : "Run Query"}
						</button>
					</div>
				</form>

				{/* Status Indicators (The "Thinking" phase) */}
				{loading && (
					<div className="bg-slate-800 border border-blue-500/30 rounded-lg p-6 animate-pulse">
						<div className="flex items-center gap-4 text-blue-400 font-mono text-sm">
							<svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
									fill="none"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							<span>
								Orchestrating Agents: Retrieving Context -&gt; Drafting
								-&gt; Fact-Checking...
							</span>
						</div>
					</div>
				)}

				{/* Error Display */}
				{error && (
					<div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
						<h3 className="text-red-400 font-semibold mb-2">
							Query Rejected
						</h3>
						<p className="text-slate-300">{error}</p>
					</div>
				)}

				{/* Results Display */}
				{result && (
					<div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
						<div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
							<h2 className="text-green-400 font-semibold flex items-center gap-2">
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M5 13l4 4L19 7"></path>
								</svg>
								Verified Answer
							</h2>
							<span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full">
								Critic Revisions: {result.revisions_required}
							</span>
						</div>
						<div className="p-6">
							<p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
								{result.answer}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}