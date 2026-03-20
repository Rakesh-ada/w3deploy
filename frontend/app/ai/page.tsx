"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/navbar";
import {
  agentDeployStream,
  AgentAnalysis,
  AgentDeployPayload,
  getToken,
} from "@/lib/api";

type RunState = "idle" | "running" | "done" | "error";

export default function AIDeployPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("Deploy this project");
  const [projectPath, setProjectPath] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [domain, setDomain] = useState("");
  const [env, setEnv] = useState<"production" | "preview">("production");
  const [analyzeOnly, setAnalyzeOnly] = useState(false);

  const [status, setStatus] = useState<RunState>("idle");
  const [analysis, setAnalysis] = useState<AgentAnalysis | null>(null);
  const [payload, setPayload] = useState<AgentDeployPayload | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    return () => {
      abortRef.current?.();
    };
  }, []);

  const canSubmit = useMemo(() => {
    return status !== "running" && (!!prompt.trim() || !!projectPath.trim() || !!repoUrl.trim());
  }, [prompt, projectPath, repoUrl, status]);

  function resetAll() {
    abortRef.current?.();
    setStatus("idle");
    setAnalysis(null);
    setPayload(null);
    setLogs([]);
    setError(null);
  }

  function handleRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus("running");
    setAnalysis(null);
    setPayload(null);
    setLogs([]);
    setError(null);

    abortRef.current = agentDeployStream(
      {
        prompt: prompt.trim() || "Deploy this project",
        projectPath: projectPath.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
        domain: domain.trim() || undefined,
        env,
        analyzeOnly,
      },
      (nextAnalysis) => setAnalysis(nextAnalysis),
      (line) => setLogs((prev) => [...prev, line]),
      (donePayload) => {
        setPayload(donePayload);
        setStatus("done");
      },
      (message) => {
        setError(message);
        setStatus("error");
      }
    );
  }

  return (
    <div className="min-h-screen bg-tg-black text-white font-sans antialiased p-6 md:p-12">
      <main className="max-w-7xl mx-auto space-y-6">
        <Navbar />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-12 flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl font-extrabold">W3Deploy AI Agent</h1>
              <p className="text-tg-muted mt-1 text-sm">Zero-interface deploy flow on top of your existing web3deploy engine.</p>
            </div>
            <Link href="/dashboard" className="text-tg-muted text-sm hover:text-white transition-colors font-medium">
              ← Dashboard
            </Link>
          </div>

          <section className="md:col-span-5 rounded-card bg-tg-gray border border-white/5 p-8">
            <h2 className="font-display text-xl font-bold mb-6">IDE Prompt</h2>

            <form onSubmit={handleRun} className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-tg-black px-4 py-3">
                <label className="text-[11px] tracking-widest text-tg-muted uppercase font-bold">Command</label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-tg-lime font-mono">{">"}</span>
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={status === "running"}
                    className="w-full bg-transparent outline-none text-white placeholder:text-tg-muted"
                    placeholder="Deploy this project"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-tg-muted">Local Project Path (optional)</label>
                <input
                  type="text"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  disabled={status === "running"}
                  placeholder="D:\\projects\\myapp"
                  className="w-full bg-tg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-tg-muted focus:outline-none focus:border-tg-lavender transition-colors disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-tg-muted">Repo URL (optional)</label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  disabled={status === "running"}
                  placeholder="https://github.com/owner/repo"
                  className="w-full bg-tg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-tg-muted focus:outline-none focus:border-tg-lavender transition-colors disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-tg-muted">ENS Domain (optional)</label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    disabled={status === "running"}
                    placeholder="myapp.eth"
                    className="w-full bg-tg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-tg-muted focus:outline-none focus:border-tg-lavender transition-colors disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-tg-muted">Environment</label>
                  <select
                    value={env}
                    onChange={(e) => setEnv(e.target.value === "preview" ? "preview" : "production")}
                    disabled={status === "running"}
                    className="w-full bg-tg-black border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-tg-lavender transition-colors disabled:opacity-50"
                  >
                    <option value="production">production</option>
                    <option value="preview">preview</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 text-xs text-tg-muted rounded-2xl border border-white/10 bg-tg-black px-4 py-3">
                <input
                  type="checkbox"
                  checked={analyzeOnly}
                  onChange={(e) => setAnalyzeOnly(e.target.checked)}
                  disabled={status === "running"}
                  className="accent-tg-lime"
                />
                Analyze only (skip deploy)
              </label>

              <div className="flex gap-3 pt-2">
                {status === "running" ? (
                  <button
                    type="button"
                    onClick={resetAll}
                    className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-3 rounded-full font-bold text-sm tracking-wide hover:bg-red-500/20 transition-all"
                  >
                    CANCEL
                  </button>
                ) : (
                  <>
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="flex-1 bg-tg-lime text-tg-black px-6 py-3 rounded-full font-bold text-sm tracking-wide hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      RUN AI DEPLOY
                    </button>
                    {(status === "done" || status === "error") && (
                      <button
                        type="button"
                        onClick={resetAll}
                        className="px-6 py-3 rounded-full font-bold text-sm tracking-wide border border-white/10 text-tg-muted hover:text-white hover:border-white/30 transition-all"
                      >
                        RESET
                      </button>
                    )}
                  </>
                )}
              </div>
            </form>
          </section>

          <section className="md:col-span-7 space-y-4">
            <div className="rounded-card bg-tg-gray border border-white/5 p-6">
              <h2 className="font-display text-xl font-bold mb-4">AI Analysis</h2>

              {!analysis ? (
                <p className="text-sm text-tg-muted">Run a prompt to get framework compatibility analysis.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <p>
                    Framework: <span className="text-tg-lime font-medium">{analysis.framework}</span>
                  </p>
                  <p>
                    Compatibility: <span className="text-tg-lavender font-medium">{analysis.compatibility}</span>
                  </p>
                  <p>
                    Confidence: <span className="font-medium">{analysis.confidence}</span>
                  </p>

                  <div>
                    <p className="uppercase tracking-widest text-xs text-tg-muted mb-2">Issues</p>
                    {analysis.issues.length ? (
                      <ul className="space-y-2">
                        {analysis.issues.map((issue, index) => (
                          <li key={`${issue.text}-${index}`} className="rounded-xl border border-red-300/20 bg-red-300/10 px-3 py-2">
                            <span className="text-red-300 text-xs uppercase tracking-widest mr-2">{issue.severity}</span>
                            {issue.text}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-tg-muted">No blocking issues found.</p>
                    )}
                  </div>

                  <div>
                    <p className="uppercase tracking-widest text-xs text-tg-muted mb-2">Suggested Fixes</p>
                    <ul className="space-y-2">
                      {analysis.fixes.map((fix, index) => (
                        <li key={`${fix}-${index}`} className="rounded-xl border border-tg-lime/30 bg-tg-lime/10 px-3 py-2">
                          {fix}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-card bg-tg-gray border border-white/5 p-6">
              <h2 className="font-display text-xl font-bold mb-4">Agent Log</h2>
              <div
                ref={logRef}
                className="bg-tg-black rounded-2xl border border-white/5 p-4 h-72 overflow-y-auto font-mono text-xs leading-relaxed"
              >
                {!logs.length && status === "idle" && <span className="text-tg-muted">Awaiting command…</span>}
                {logs.map((line, i) => (
                  <div key={`${line}-${i}`} className={line.startsWith("ERROR") ? "text-red-400" : "text-green-400"}>
                    <span className="text-tg-muted select-none mr-2">{String(i + 1).padStart(3, "0")}</span>
                    {line}
                  </div>
                ))}
                {status === "running" && <div className="text-tg-lavender animate-pulse">▌</div>}
                {error && <div className="text-red-400 mt-2 border-t border-red-500/20 pt-2">✕ {error}</div>}
              </div>
            </div>

            {payload?.deploy && (
              <div className="rounded-card bg-tg-lime p-6 text-tg-black">
                <h3 className="font-display text-lg font-bold mb-3">Deployment Result</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="font-bold opacity-60 uppercase text-xs tracking-widest">Domain</span>
                    <span className="font-mono">{payload.deploy.domain}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="font-bold opacity-60 uppercase text-xs tracking-widest">Command</span>
                    <span className="font-mono text-xs text-right">{payload.deploy.command}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="font-bold opacity-60 uppercase text-xs tracking-widest">CWD</span>
                    <span className="font-mono text-xs text-right">{payload.deploy.cwd}</span>
                  </div>
                  {payload.deploy.receipt?.cid && (
                    <div className="flex justify-between gap-4">
                      <span className="font-bold opacity-60 uppercase text-xs tracking-widest">CID</span>
                      <span className="font-mono text-xs text-right">{String(payload.deploy.receipt.cid)}</span>
                    </div>
                  )}
                  {payload.deploy.receipt?.txHash && (
                    <div className="flex justify-between gap-4">
                      <span className="font-bold opacity-60 uppercase text-xs tracking-widest">TX</span>
                      <span className="font-mono text-xs text-right">{String(payload.deploy.receipt.txHash)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

