import React, { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Copy,
  Check,
  GitPullRequest,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Loader2,
  Send,
  Receipt,
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

export const AgentAuditDrawer: React.FC = () => {
  const {
    tasks,
    selectedTaskId,
    reasoningSteps,
    latestPayoutReceipt,
    latestBlockedAudit,
    isSimulating,
    isLivePayPalApi,
    apiModeLabel,
    agentToolkitTools,
    runLiveGitHubPrAudit,
    openLiveReceiptModal,
    updateTaskPrUrl,
  } = useProjectStore();

  const [copiedBatchId, setCopiedBatchId] = useState(false);

  const selectedTask =
    tasks.find((t) => t.id === selectedTaskId && !t.isClientDepositPhase && t.id !== 'TASK-1') ||
    tasks.find((t) => t.id === 'TASK-2') ||
    tasks[1];

  const handleCopyBatchId = (batchId: string) => {
    navigator.clipboard?.writeText(batchId);
    setCopiedBatchId(true);
    setTimeout(() => setCopiedBatchId(false), 1800);
  };

  return (
    <aside
      id="agent-drawer"
      aria-label="Live AI Agent and PayPal Audit Drawer"
      className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden"
    >
      {/* Drawer Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400 shrink-0" />
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
            Live AI Agent &amp; Audit Drawer
          </h2>
        </div>
        <span
          className={`font-mono text-[10px] font-semibold ${
            isLivePayPalApi || apiModeLabel === 'LIVE PAYPAL SANDBOX'
              ? 'text-emerald-400'
              : 'text-amber-300'
          }`}
        >
          [MODE: {isLivePayPalApi || apiModeLabel === 'LIVE PAYPAL SANDBOX' ? 'LIVE PAYPAL SANDBOX' : 'SIMULATED FALLBACK'}]
        </span>
      </div>

      {/* Custom GitHub PR URL Submission Form for Selected Milestone */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-300">
            Selected: <span className="font-mono text-blue-400">{selectedTask.id}</span>
          </span>
          <span className="font-mono text-slate-400 tabular-nums">
            Bounty: ${selectedTask.bountyAmount}
          </span>
        </div>

        <label
          htmlFor="github-pr-url-input"
          className="block text-[11px] text-slate-400"
        >
          GitHub Pull Request URL to Audit:
        </label>
        <div className="flex items-center gap-2">
          <input
            id="github-pr-url-input"
            type="url"
            value={selectedTask.githubPrUrl}
            onChange={(e) => updateTaskPrUrl(selectedTask.id, e.target.value)}
            placeholder="https://github.com/owner/repo/pull/1"
            className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            disabled={isSimulating}
            onClick={() => runLiveGitHubPrAudit(selectedTask.id, selectedTask.githubPrUrl)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isSimulating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Audit PR</span>
          </button>
        </div>

        <div className="text-[10px] font-mono text-slate-400 truncate">
          @paypal/agent-toolkit: {agentToolkitTools.slice(0, 4).join(', ')}
        </div>
      </div>

      {/* Top Status Banner: Either Crimson Guardrail Blocked Card (when most recent action blocked) OR Green Payout Disbursed Card */}
      {latestBlockedAudit ? (
        <div className="p-4 border-b border-red-900/60 bg-red-950/30 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Financial Escrow Guardrail: PAYOUT BLOCKED — Escrow Protected</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-200 space-y-1 font-mono bg-slate-950/90 p-2.5 rounded-lg border border-red-800/50">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">target_task:</span>
              <span className="text-red-300 font-semibold">{latestBlockedAudit.taskId} ({latestBlockedAudit.taskName.slice(0, 24)}...)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">bounty_protected:</span>
              <span className="text-slate-100 font-bold tabular-nums">
                ${latestBlockedAudit.bountyProtected.toFixed(2)} USD (Held in Escrow)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">gemini_score:</span>
              <span className="text-red-400 font-semibold tabular-nums">
                {latestBlockedAudit.auditScore}/100 (REJECTED &lt; {latestBlockedAudit.requiredScore})
              </span>
            </div>
          </div>

          {latestPayoutReceipt && (
            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-red-900/40">
              <span className="font-mono truncate">
                Earlier Settled: {latestPayoutReceipt.taskId} (${latestPayoutReceipt.amount})
              </span>
              <button
                type="button"
                onClick={() => openLiveReceiptModal(latestPayoutReceipt.payoutBatchId)}
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline font-mono shrink-0 cursor-pointer"
              >
                <Receipt className="w-3 h-3" />
                <span>Batch {latestPayoutReceipt.payoutBatchId}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        latestPayoutReceipt && (
          <div className="p-4 border-b border-slate-800 bg-slate-950/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>PayPal Sandbox Payout Disbursed</span>
              </span>
              <span className="font-mono text-xs font-bold text-slate-100 tabular-nums">
                ${latestPayoutReceipt.amount} {latestPayoutReceipt.currency}
              </span>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">payout_batch_id:</span>
                <button
                  type="button"
                  onClick={() => handleCopyBatchId(latestPayoutReceipt.payoutBatchId)}
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 cursor-pointer"
                  title="Copy PayPal Payout Batch ID"
                >
                  <span>{latestPayoutReceipt.payoutBatchId}</span>
                  {copiedBatchId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">receiver:</span>
                <span className="text-slate-200 truncate max-w-[180px]">
                  {latestPayoutReceipt.receiverEmail}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">gemini_score:</span>
                <span className="text-emerald-400 font-semibold">
                  {latestPayoutReceipt.auditScore}/100 (PASSED)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-slate-400 font-mono text-[10px]">
                {latestPayoutReceipt.mode}
              </span>
              <button
                type="button"
                onClick={() => openLiveReceiptModal(latestPayoutReceipt.payoutBatchId)}
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline font-medium cursor-pointer"
              >
                <Receipt className="w-3 h-3" />
                <span>Verify via PayPal API Modal</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* Streaming Agent Reasoning Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[580px]">
        <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
          <span>Step-by-Step Autonomous Trace</span>
          <span className="font-mono text-[11px] tabular-nums">
            {reasoningSteps.length} events
          </span>
        </div>

        <div className="space-y-3">
          {reasoningSteps.map((step) => {
            const isError = step.status === 'error';
            const isRunning = step.status === 'running';

            return (
              <div
                key={step.id}
                className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    {isRunning ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                    ) : isError ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className={isError ? 'text-red-300' : 'text-slate-100'}>
                      {step.title}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 tabular-nums shrink-0">
                    {step.timestamp}
                  </span>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {step.detail}
                </p>

                {step.codeSnippet && (
                  <pre className="mt-2 p-2.5 rounded bg-slate-900 border border-slate-800/90 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-36">
                    {step.codeSnippet}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <GitPullRequest className="w-3.5 h-3.5 text-slate-500" />
          <span>GitHub REST API v3 Diff</span>
        </span>
        <span>@paypal/agent-toolkit</span>
      </div>
    </aside>
  );
};
