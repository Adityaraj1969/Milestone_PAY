import React from 'react';
import { JudgeSimulatorBar } from '../components/JudgeSimulatorBar';
import { BryntumGanttPanel } from '../components/BryntumGanttPanel';
import { AgGridLedgerPanel } from '../components/AgGridLedgerPanel';
import { AgentAuditDrawer } from '../components/AgentAuditDrawer';
import { PayPalLiveReceiptModal } from '../components/PayPalLiveReceiptModal';
import { useProjectStore } from '../store/useProjectStore';

export default function MilestonePayDashboardPage() {
  const { runLiveGitHubPrAudit, isSimulating } = useProjectStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          MilestonePay
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a
            href="#gantt-section"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Critical Path
          </a>
          <a
            href="#ledger-section"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Escrow Ledger
          </a>
          <a
            href="#agent-drawer"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            AI Auditor
          </a>
          <a
            href="https://developer.paypal.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            PayPal Sandbox
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={isSimulating}
            onClick={() => runLiveGitHubPrAudit('TASK-2')}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Audit Sample PR #1
          </button>
        </div>
      </header>

      {/* Zone 1: Top Judge Sandbox Simulator Bar */}
      <JudgeSimulatorBar />

      {/* Main Split-Screen Command Center Workspace */}
      <main className="flex-1 px-6 py-5 max-w-[1600px] w-full mx-auto grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Center Left/Upper & Lower Zones (8 columns on xl): Bryntum Gantt + AG Grid Escrow Ledger */}
        <div className="xl:col-span-8 flex flex-col gap-5 min-w-0">
          {/* Zone 2: Upper Center — Bryntum Gantt Timeline */}
          <BryntumGanttPanel />

          {/* Zone 3: Lower Center — AG Grid Financial & Escrow Ledger */}
          <AgGridLedgerPanel />
        </div>

        {/* Zone 4: Right Zone (4 columns on xl) — Live AI Agent & Audit Drawer */}
        <div className="xl:col-span-4 w-full">
          <AgentAuditDrawer />
        </div>
      </main>

      {/* In-App Verified PayPal API Live Lookup Modal */}
      <PayPalLiveReceiptModal />

      {/* Quiet Editorial Footer */}
      <footer className="px-6 py-4 border-t border-slate-900 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4 max-w-[1600px] w-full mx-auto">
        <div>
          MilestonePay — Autonomous Escrow &amp; Payment-Aware Scheduling Command Center · MIT Licensed
        </div>
        <div className="flex items-center gap-3">
          <span>@paypal/agent-toolkit</span>
          <span aria-hidden="true">·</span>
          <span>APIMatic Context Verified</span>
          <span aria-hidden="true">·</span>
          <span>Bryntum Gantt &amp; AG Grid Enterprise</span>
        </div>
      </footer>
    </div>
  );
}
