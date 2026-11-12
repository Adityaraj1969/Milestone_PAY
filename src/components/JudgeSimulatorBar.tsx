import React, { useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  GitPullRequest,
  RotateCcw,
  ShieldAlert,
  Clock,
  Wallet,
  Radio,
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

export const JudgeSimulatorBar: React.FC = () => {
  const {
    isDepositLate,
    isSimulating,
    activeScenario,
    isLivePayPalApi,
    apiModeLabel,
    simulateLateClientDeposit,
    simulateClientPayPalPayment,
    runLiveGitHubPrAudit,
    simulateVulnerablePrAudit,
    resetSandboxDemo,
    fetchApiHealthStatus,
    getLedgerSummary,
  } = useProjectStore();

  useEffect(() => {
    fetchApiHealthStatus();
  }, [fetchApiHealthStatus]);

  const summary = getLedgerSummary();

  return (
    <section
      aria-label="Judge Sandbox Simulator Toolbar"
      className="bg-slate-900/95 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4"
    >
      {/* Left: 4 One-Click Judge Scenario Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400 mr-1 whitespace-nowrap shrink-0">
          Judge Simulator:
        </span>

        {/* Button 1: Simulate Late Client Deposit */}
        <button
          type="button"
          disabled={isSimulating}
          onClick={() => simulateLateClientDeposit()}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
            isDepositLate
              ? 'bg-red-950/80 border-red-500/60 text-red-200'
              : 'bg-slate-800/90 hover:bg-red-950/60 border-slate-700 hover:border-red-500/50 text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>1. Simulate Late Client Deposit</span>
        </button>

        {/* Button 2: Simulate Client PayPal Payment */}
        <button
          type="button"
          disabled={isSimulating}
          onClick={() => simulateClientPayPalPayment()}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
            activeScenario === 'CLIENT_PAYMENT' && !isDepositLate
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
              : 'bg-slate-800/90 hover:bg-emerald-950/60 border-slate-700 hover:border-emerald-500/50 text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>2. Simulate Client PayPal Payment ($1,500)</span>
        </button>

        {/* Button 3: Run Live GitHub PR Audit (Happy Path: Score 96/100 -> Payout) */}
        <button
          type="button"
          disabled={isSimulating}
          onClick={() =>
            runLiveGitHubPrAudit(
              'TASK-2',
              'https://github.com/Adityaraj1969/MilestonePay/pull/1',
              false
            )
          }
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
        >
          <GitPullRequest className="w-3.5 h-3.5 shrink-0" />
          <span>3. Run Live GitHub PR Audit ($400)</span>
        </button>

        {/* Button 4: Simulate Vulnerable PR (Score 62/100 — Payout Blocked by Guardrail) */}
        <button
          type="button"
          disabled={isSimulating}
          onClick={() => simulateVulnerablePrAudit('TASK-3')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
            activeScenario === 'PR_REJECTED'
              ? 'bg-red-950/90 border-red-500/70 text-red-200'
              : 'bg-slate-800/90 hover:bg-red-950/60 border-slate-700 hover:border-red-500/50 text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>4. Simulate Vulnerable PR (Score 62/100 — Payout Blocked)</span>
        </button>

        {/* Reset Sandbox State */}
        <button
          type="button"
          disabled={isSimulating}
          onClick={() => resetSandboxDemo()}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Reset Sandbox Demo to Initial State"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Reset</span>
        </button>
      </div>

      {/* Right: Real-time Escrow Telemetry & Transparent API Mode Indicator */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <Radio
            className={`w-3.5 h-3.5 shrink-0 ${
              isLivePayPalApi || apiModeLabel === 'LIVE PAYPAL SANDBOX'
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          />
          <span
            className={`font-semibold ${
              isLivePayPalApi || apiModeLabel === 'LIVE PAYPAL SANDBOX'
                ? 'text-emerald-400'
                : 'text-amber-300'
            }`}
          >
            [MODE: {isLivePayPalApi || apiModeLabel === 'LIVE PAYPAL SANDBOX' ? 'LIVE PAYPAL SANDBOX' : 'SIMULATED FALLBACK'}]
          </span>
        </div>

        <span className="text-slate-700" aria-hidden="true">
          |
        </span>

        <div className="flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400">Escrow:</span>
          <span
            className={`font-mono font-semibold tabular-nums ${
              summary.remainingEscrowBalance > 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            ${summary.remainingEscrowBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          <span className="text-slate-400">Disbursed:</span>
          <span className="font-mono font-semibold tabular-nums text-blue-400">
            ${summary.disbursedPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span
            className={`font-mono font-semibold tabular-nums ${
              summary.scheduleDelayDays > 0 ? 'text-red-400' : 'text-slate-200'
            }`}
          >
            {summary.projectedDeliveryDate}
            {summary.scheduleDelayDays > 0 ? ` (+${summary.scheduleDelayDays}d Late)` : ' (On-Time)'}
          </span>
        </div>
      </div>
    </section>
  );
};
