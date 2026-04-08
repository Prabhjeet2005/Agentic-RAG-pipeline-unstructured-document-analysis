"use client";

import { useState } from "react";
import axios from "axios";

export default function Dashboard() {
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState("");
	const [activeFile, setActiveFile] = useState("sample_document.pdf");
	const [uploadStatus, setUploadStatus] = useState("");

	const handleFileUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			setUploadStatus("Uploading & Vectorizing Document...");
			// Simulate the API upload delay for the UI
			setTimeout(() => {
				setActiveFile(file.name);
				setUploadStatus("Document Ingested Successfully.");
				setTimeout(() => setUploadStatus(""), 3000);
			}, 2000);
		}
	};

	const handleSearch = async (e) => {
		e.preventDefault();
		if (!query.trim()) return;

		setLoading(true);
		setResult(null);
		setError("");

		try {
			const response = await axios.post(
				"http://127.0.0.1:8000/api/v1/ask",
				{
					question: query,
				},
			);

			if (response.data.status === "success") {
				setResult(response.data.data);
			} else {
				setError(response.data.feedback);
			}
		} catch (err) {
			setError("Failed to connect to the AI microservice.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#0B1120] text-slate-300 p-6 md:p-10 font-sans">
			<header className="mb-10 border-b border-slate-800 pb-6 flex justify-between items-end">
				<div>
					<h1 className="text-3xl font-bold text-white tracking-tight">
						Agentic RAG Auditor
					</h1>
					<p className="text-slate-500 mt-1 text-sm font-mono">
						Distributed Multi-Agent Architecture v1.0
					</p>
				</div>
				<div className="text-right">
					<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-mono border border-green-500/20">
						<span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
						Microservice Online
					</span>
				</div>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* LEFT COLUMN: KNOWLEDGE BASE */}
				<div className="col-span-1 space-y-6">
					<div className="bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-2xl">
						<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
							<svg
								className="w-5 h-5 text-blue-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
							</svg>
							Knowledge Base
						</h2>

						{/* Drag and Drop Zone */}
						<div className="border-2 border-dashed border-slate-700 hover:border-blue-500 transition-colors rounded-lg p-8 text-center bg-slate-800/50 relative group">
							<input
								type="file"
								onChange={handleFileUpload}
								className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
								accept=".pdf"
							/>
							<svg
								className="mx-auto h-10 w-10 text-slate-500 group-hover:text-blue-400 transition-colors mb-3"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								/>
							</svg>
							<p className="text-sm text-slate-400">
								Drag & drop a PDF, or click to browse
							</p>
						</div>

						{uploadStatus && (
							<p className="text-sm text-blue-400 mt-3 font-mono animate-pulse">
								{uploadStatus}
							</p>
						)}

						<div className="mt-6 pt-6 border-t border-slate-800">
							<p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
								Active Document
							</p>
							<div className="flex items-center gap-3 bg-slate-800 px-4 py-3 rounded-lg border border-slate-700">
								<svg
									className="w-6 h-6 text-red-400"
									fill="currentColor"
									viewBox="0 0 20 20">
									<path
										fillRule="evenodd"
										d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
										clipRule="evenodd"
									/>
								</svg>
								<span className="text-sm font-medium text-slate-200 truncate">
									{activeFile}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* RIGHT COLUMN: AGENTIC AUDITOR */}
				<div className="col-span-1 lg:col-span-2 space-y-6">
					<form
						onSubmit={handleSearch}
						className="bg-[#111827] border border-slate-800 rounded-xl p-2 shadow-2xl flex relative">
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Ask the Agentic Network..."
							className="w-full bg-transparent text-white px-4 py-3 focus:outline-none placeholder-slate-600"
							disabled={loading}
						/>
						<button
							type="submit"
							disabled={loading}
							className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
							Execute
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
							</svg>
						</button>
					</form>

					{/* THE PIPELINE VISUALIZER (Only shows when loading) */}
					{loading && (
						<div className="bg-[#111827] border border-blue-900/50 rounded-xl p-8 shadow-2xl relative overflow-hidden">
							<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse"></div>
							<h3 className="text-sm font-mono text-blue-400 mb-6 uppercase tracking-widest text-center">
								Orchestrating AI Agents
							</h3>

							<div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
								{/* Agent 1 */}
								<div className="flex flex-col items-center bg-slate-800/80 p-4 rounded-xl border border-blue-500/30 w-32 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
									<div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mb-2 animate-bounce">
										1
									</div>
									<span className="text-xs font-bold text-white">
										Retriever
									</span>
									<span className="text-[10px] text-slate-400 mt-1 text-center">
										Vector DB Search
									</span>
								</div>

								<svg
									className="w-6 h-6 text-slate-600 hidden md:block"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
								</svg>

								{/* Agent 2 */}
								<div className="flex flex-col items-center bg-slate-800/80 p-4 rounded-xl border border-purple-500/30 w-32 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
									<div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mb-2 animate-pulse">
										2
									</div>
									<span className="text-xs font-bold text-white">
										Analyst
									</span>
									<span className="text-[10px] text-slate-400 mt-1 text-center">
										Drafting Response
									</span>
								</div>

								<svg
									className="w-6 h-6 text-slate-600 hidden md:block"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
								</svg>

								{/* Agent 3 */}
								<div className="flex flex-col items-center bg-slate-800/80 p-4 rounded-xl border border-emerald-500/30 w-32 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
									<div
										className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center mb-2 animate-pulse"
										style={{ animationDelay: "0.5s" }}>
										3
									</div>
									<span className="text-xs font-bold text-white">
										Critic
									</span>
									<span className="text-[10px] text-slate-400 mt-1 text-center">
										Fact-Checking
									</span>
								</div>
							</div>
						</div>
					)}

					{/* ERRORS */}
					{error && (
						<div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6 shadow-2xl">
							<h3 className="text-red-400 font-semibold mb-1 flex items-center gap-2">
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
								</svg>
								Audit Failed
							</h3>
							<p className="text-slate-400 text-sm">{error}</p>
						</div>
					)}

					{/* SUCCESS RESULT */}
					{result && (
						<div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
							<div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
								<h2 className="text-emerald-400 font-medium text-sm tracking-widest uppercase flex items-center gap-2">
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
									</svg>
									Verified Output
								</h2>
								<div className="flex gap-2">
									<span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded">
										Fact-Checked
									</span>
									<span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">
										Revisions: {result.revisions_required}
									</span>
								</div>
							</div>
							<div className="p-8">
								<p className="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">
									{result.answer}
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
