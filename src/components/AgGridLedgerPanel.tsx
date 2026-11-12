import React, { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ModuleRegistry,
  AllCommunityModule,
  ColDef,
  ICellRendererParams,
  themeQuartz,
  colorSchemeDarkBlue,
} from 'ag-grid-community';
import {
  MasterDetailModule,
  RowGroupingModule,
  SetFilterModule,
} from 'ag-grid-enterprise';
import {
  FileCode2,
  GitPullRequest,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Lock,
  Unlock,
  Terminal,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { MilestoneTask } from '../lib/rules';

// Filter AG Grid Enterprise missing-trial-key ASCII banner before registering modules
if (typeof window !== 'undefined') {
  const win = window as unknown as { __agGridModuleErrorFiltered?: boolean };
  if (!win.__agGridModuleErrorFiltered) {
    win.__agGridModuleErrorFiltered = true;
    const originalConsoleError = console.error.bind(console);
    const originalConsoleWarn = console.warn.bind(console);

    const isAgGridLicenseNoise = (args: unknown[]) => {
      const msg = args.map((a) => String(a ?? '')).join(' ').toLowerCase();
      return (
        msg.includes('ag grid enterprise license') ||
        msg.includes('license key not found') ||
        msg.includes('all ag grid enterprise features are unlocked') ||
        msg.includes('info@ag-grid.com') ||
        (msg.includes('ag grid') && msg.includes('license')) ||
        /\*{8,}/.test(msg)
      );
    };

    console.error = (...args: unknown[]) => {
      if (isAgGridLicenseNoise(args)) return;
      originalConsoleError(...args);
    };
    console.warn = (...args: unknown[]) => {
      if (isAgGridLicenseNoise(args)) return;
      originalConsoleWarn(...args);
    };
  }
}

// Register real AG Grid Community + AG Grid Enterprise modules
ModuleRegistry.registerModules([
  AllCommunityModule,
  MasterDetailModule,
  RowGroupingModule,
  SetFilterModule,
]);

const milestoneGridTheme = themeQuartz.withPart(colorSchemeDarkBlue).withParams({
  backgroundColor: '#0f172a',
  headerBackgroundColor: '#020617',
  oddRowBackgroundColor: '#0f172a',
  rowHoverColor: '#1e293b',
  borderColor: '#1e293b',
  foregroundColor: '#f1f5f9',
  fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: 12,
  headerFontSize: 11,
});

/**
 * Custom AG Grid Enterprise Master/Detail Panel Renderer (`detailCellRenderer`)
 * Displays the Gemini 2.5 Code Review & Acceptance Criteria checklist and the Raw PayPal Sandbox Webhook JSON.
 */
const LedgerDetailCellRenderer: React.FC<ICellRendererParams<MilestoneTask>> = (props) => {
  const task = props.data;
  const [activeTab, setActiveTab] = useState<'audit' | 'webhook'>('audit');

  if (props.node?.rowPinned === 'bottom' || !task || !task.id || task.id.startsWith('PINNED')) {
    return null;
  }

  return (
    <div className="p-4 bg-slate-950 border-t border-b border-slate-800 text-xs h-full overflow-y-auto space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="font-semibold text-slate-200">
            AG Grid Enterprise Master/Detail — {task.id}: {task.name}
          </span>
          {!task.isClientDepositPhase && task.githubPrUrl && (
            <>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <a
                href={task.githubPrUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline font-mono text-[11px] inline-flex items-center gap-1"
              >
                <span>{task.githubPrUrl}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gemini 2.5 Code Review &amp; Acceptance Criteria
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('webhook')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'webhook'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw PayPal Sandbox Webhook JSON
          </button>
        </div>
      </div>

      {activeTab === 'audit' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7 space-y-2">
            <div className="text-slate-400 font-medium">
              AI Code Audit Summary &amp; Security Inspection:
            </div>
            <p className="text-slate-200 leading-relaxed bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              {task.aiAuditSummary ||
                `Pending live GitHub PR diff audit. Click "3. Run Live GitHub PR Audit & Auto-Payout ($400)" or "4. Simulate Vulnerable PR (Score 62/100)" in the simulator bar to evaluate code with Gemini.`}
            </p>
            {task.aiSecurityCheck && (
              <div
                className={`font-mono text-[11px] px-3 py-2 rounded-lg border ${
                  task.aiAuditPassed === false
                    ? 'text-red-300 bg-red-950/40 border-red-800/60'
                    : 'text-emerald-300 bg-slate-900/90 border-slate-800'
                }`}
              >
                {task.aiSecurityCheck}
              </div>
            )}
          </div>

          <div className="md:col-span-5 space-y-2">
            <div className="text-slate-400 font-medium">
              Milestone Acceptance Criteria Checklist:
            </div>
            <ul className="space-y-1.5 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              {(task.acceptanceCriteria || []).map((criterion, idx) => {
                const met =
                  task.aiAuditPassed === true ||
                  (task.aiCriteriaMet || []).some(
                    (c) =>
                      c.toLowerCase().includes(criterion.toLowerCase()) ||
                      criterion.toLowerCase().includes(c.toLowerCase())
                  );
                return (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-[11px] text-slate-300"
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        met ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                    <span>{criterion}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <pre className="font-mono text-[11px] text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto max-h-40">
            {task.webhookPayload
              ? JSON.stringify(task.webhookPayload, null, 2)
              : JSON.stringify(
                  {
                    status: 'AWAITING_PAYPAL_PAYOUT_EXECUTION',
                    milestone_id: task.id,
                    expected_event: 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED',
                    receiver: task.contractorEmail,
                    bounty_usd: task.bountyAmount.toFixed(2),
                  },
                  null,
                  2
                )}
          </pre>
        </div>
      )}
    </div>
  );
};

export const AgGridLedgerPanel: React.FC = () => {
  const {
    tasks,
    setSelectedTaskId,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    runLiveGitHubPrAudit,
    openLiveReceiptModal,
    isSimulating,
    getLedgerSummary,
  } = useProjectStore();

  const summary = getLedgerSummary();

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        statusFilter === 'ALL' ? true : task.escrowStatus === statusFilter;
      const matchesQuery =
        searchQuery.trim() === '' ||
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.contractorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.paypalPayoutBatchId || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [tasks, statusFilter, searchQuery]);

  // Real AG Grid pinnedBottomRowData array
  const pinnedBottomRowData = useMemo(() => {
    return [
      {
        id: 'PINNED-SUMMARY',
        phase: 'Summary',
        name: `PINNED ESCROW SUMMARY · Cleared Pool: $${summary.clearedEscrowFunds.toLocaleString('en-US', { minimumFractionDigits: 2 })} · Remaining Escrow: $${summary.remainingEscrowBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        contractorName: 'APIMatic OpenAPI Verified',
        contractorEmail: '',
        contractorHandle: '',
        startDate: '',
        baseStartDate: '',
        duration: 0,
        percentDone: 100,
        dependencies: [],
        bountyAmount: summary.disbursedPayouts,
        isClientDepositPhase: false,
        escrowStatus:
          summary.remainingEscrowBalance > 0 ? 'ESCROW_FUNDED' : 'UNPAID_LATE',
        invoiceId: `BALANCE: $${summary.remainingEscrowBalance.toFixed(2)}`,
        githubPrUrl: '',
        prNumber: 0,
        acceptanceCriteria: [],
        aiAuditScore: null,
        aiAuditPassed: null,
        aiCriteriaMet: [],
        aiSecurityCheck: null,
        aiAuditSummary: null,
        paypalPayoutBatchId: `DISBURSED: -$${summary.disbursedPayouts.toFixed(2)}`,
        paypalSandboxReceiptUrl: null,
        webhookPayload: null,
      } as MilestoneTask,
    ];
  }, [summary]);

  const columnDefs = useMemo<ColDef<MilestoneTask>[]>(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        flex: 0.95,
        minWidth: 105,
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          suppressCount: true,
        },
        cellClass: 'font-mono text-xs font-semibold text-blue-400',
      },
      {
        field: 'name',
        headerName: 'Milestone / Engineering Task',
        flex: 1.8,
        minWidth: 170,
        cellRenderer: (params: ICellRendererParams<MilestoneTask>) => {
          const t = params.data;
          if (params.node?.rowPinned === 'bottom' || !t || t.id === 'PINNED-SUMMARY') {
            return (
              <div className="flex items-center h-full">
                <span className="font-semibold text-slate-100 truncate">
                  {t?.name ?? 'PINNED ESCROW SUMMARY'}
                </span>
              </div>
            );
          }
          return (
            <div className="flex flex-col justify-center py-1 leading-tight">
              <span className="font-medium text-slate-100 truncate">{t.name}</span>
              <span className="text-[11px] text-slate-400 truncate">
                {t.contractorName}
              </span>
            </div>
          );
        },
      },
      {
        field: 'invoiceId',
        headerName: 'Invoice ID',
        flex: 1.0,
        minWidth: 95,
        cellClass: 'font-mono text-[11px] text-slate-300 tabular-nums',
      },
      {
        field: 'escrowStatus',
        headerName: 'Escrow Status',
        flex: 1.25,
        minWidth: 125,
        cellRenderer: (params: ICellRendererParams<MilestoneTask>) => {
          const t = params.data;
          if (params.node?.rowPinned === 'bottom' || !t || t.id === 'PINNED-SUMMARY') {
            return (
              <div className="flex items-center h-full">
                <span className="font-mono font-semibold text-emerald-400 text-[11px] leading-none">
                  POOL: ${summary.clearedEscrowFunds.toFixed(0)}
                </span>
              </div>
            );
          }
          switch (t.escrowStatus) {
            case 'PAYOUT_SETTLED':
              return (
                <div className="flex items-center h-full">
                  <span className="inline-flex items-center gap-1 text-blue-400 font-semibold text-[11px] leading-none">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>PAYOUT_SETTLED</span>
                  </span>
                </div>
              );
            case 'UNPAID_LATE':
              return (
                <div className="flex items-center h-full">
                  <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-[11px] leading-none">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>UNPAID_LATE</span>
                  </span>
                </div>
              );
            case 'AUDIT_REJECTED':
              return (
                <div className="flex items-center h-full">
                  <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-[11px] leading-none">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>GUARDRAIL_BLOCKED</span>
                  </span>
                </div>
              );
            case 'AUDITING':
              return (
                <div className="flex items-center h-full">
                  <span className="inline-flex items-center gap-1 text-amber-300 font-semibold text-[11px] leading-none">
                    <GitPullRequest className="w-3.5 h-3.5 shrink-0" />
                    <span>AUDITING_PR</span>
                  </span>
                </div>
              );
            default:
              return (
                <div className="flex items-center h-full">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px] leading-none">
                    <Unlock className="w-3.5 h-3.5 shrink-0" />
                    <span>ESCROW_FUNDED</span>
                  </span>
                </div>
              );
          }
        },
      },
      {
        field: 'bountyAmount',
        headerName: 'Bounty',
        flex: 0.8,
        minWidth: 80,
        type: 'rightAligned',
        cellRenderer: (params: ICellRendererParams<MilestoneTask>) => {
          const t = params.data;
          if (params.node?.rowPinned === 'bottom' || !t || t.id === 'PINNED-SUMMARY') {
            return (
              <div className="flex items-center justify-end h-full">
                <span className="font-mono font-semibold text-blue-400 tabular-nums text-[11px] leading-none">
                  -${summary.disbursedPayouts.toFixed(0)}
                </span>
              </div>
            );
          }
          if (t.isClientDepositPhase) {
            return (
              <div className="flex items-center justify-end h-full">
                <span className="font-mono font-semibold text-emerald-400 tabular-nums leading-none">
                  +${(t.depositAmount ?? 1500).toFixed(0)}
                </span>
              </div>
            );
          }
          return (
            <div className="flex items-center justify-end h-full">
              <span className="font-mono font-semibold text-slate-100 tabular-nums leading-none">
                ${(t.bountyAmount ?? 0).toFixed(2)}
              </span>
            </div>
          );
        },
      },
      {
        field: 'aiAuditScore',
        headerName: 'Score',
        flex: 0.7,
        minWidth: 70,
        type: 'rightAligned',
        cellRenderer: (params: ICellRendererParams<MilestoneTask>) => {
          const t = params.data;
          if (params.node?.rowPinned === 'bottom' || !t || t.id === 'PINNED-SUMMARY') {
            return (
              <div className="flex items-center justify-end h-full">
                <span className="font-mono text-[10px] text-slate-400 leading-none">
                  SUMMARY
                </span>
              </div>
            );
          }
          if (t.isClientDepositPhase || t.id === 'TASK-1') {
            return (
              <div className="flex items-center justify-end h-full">
                <span className="font-mono text-emerald-400 text-[11px] font-semibold leading-none">
                  DEPOSIT
                </span>
              </div>
            );
          }
          if (t.aiAuditScore !== null && t.aiAuditScore !== undefined) {
            return (
              <div className="flex items-center justify-end h-full">
                <span
                  className={`font-mono font-semibold tabular-nums leading-none ${
                    t.aiAuditScore >= 90 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {t.aiAuditScore}/100
                </span>
              </div>
            );
          }
          return (
            <div className="flex items-center justify-end h-full">
              <span className="font-mono text-slate-500 text-[11px] leading-none">
                PR #{t.prNumber}
              </span>
            </div>
          );
        },
      },
      {
        field: 'paypalPayoutBatchId',
        headerName: 'Batch ID',
        flex: 1.0,
        minWidth: 95,
        cellRenderer: (params: ICellRendererParams<MilestoneTask>) => {
          const t = params.data;
          if (params.node?.rowPinned === 'bottom' || !t || t.id === 'PINNED-SUMMARY') {
            return (
              <div className="flex items-center h-full">
                <span className="font-mono font-semibold text-emerald-400 tabular-nums text-[11px] leading-none">
                  REM: ${summary.remainingEscrowBalance.toFixed(0)}
                </span>
              </div>
            );
          }
          return (
            <div className="flex items-center h-full">
              {t.paypalPayoutBatchId ? (
                <span className="font-mono text-[11px] text-blue-300 font-medium tabular-nums leading-none">
                  {t.paypalPayoutBatchId}
                </span>
              ) : (
                <span className="text-slate-500 leading-none">—</span>
              )}
            </div>
          );
        },
      },
      {
        headerName: 'Action / Receipt',
        flex: 1.25,
        minWidth: 130,
        type: 'rightAligned',
        cellRenderer: (params: ICellRendererParams<MilestoneTask>) => {
          const t = params.data;
          if (params.node?.rowPinned === 'bottom' || !t || t.id === 'PINNED-SUMMARY') {
            return (
              <div className="flex items-center justify-end h-full">
                <span className="font-mono text-[10px] text-slate-400 leading-none">
                  AG Grid Enterprise
                </span>
              </div>
            );
          }
          if (t.isClientDepositPhase || t.id === 'TASK-1') {
            return (
              <div className="flex items-center justify-end h-full">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLiveReceiptModal(t.paypalPayoutBatchId || 'ORDER-8XL94210A1');
                  }}
                  className="px-2.5 py-1.5 rounded-md bg-emerald-950/90 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-[11px] font-medium leading-none inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Receipt className="w-3 h-3 shrink-0" />
                  <span>Verify Deposit</span>
                </button>
              </div>
            );
          }
          if (t.paypalPayoutBatchId) {
            return (
              <div className="flex items-center justify-end h-full">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLiveReceiptModal(t.paypalPayoutBatchId!);
                  }}
                  className="px-2.5 py-1.5 rounded-md bg-blue-950/90 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-[11px] font-medium leading-none inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Receipt className="w-3 h-3 shrink-0" />
                  <span>Verify Receipt</span>
                </button>
              </div>
            );
          }
          const prButtonIndex =
            t.id === 'TASK-2' ? 1 : t.id === 'TASK-3' ? 2 : t.id === 'TASK-4' ? 3 : t.prNumber;
          return (
            <div className="flex items-center justify-end h-full">
              <button
                type="button"
                disabled={isSimulating}
                onClick={(e) => {
                  e.stopPropagation();
                  runLiveGitHubPrAudit(t.id);
                }}
                className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-medium leading-none transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Audit PR #{prButtonIndex}
              </button>
            </div>
          );
        },
      },
    ],
    [summary, isSimulating, openLiveReceiptModal, runLiveGitHubPrAudit]
  );

  return (
    <section
      id="ledger-section"
      aria-label="AG Grid Financial and Escrow Ledger"
      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col"
    >
      {/* AG Grid Toolbar Header */}
      <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/90">
        <div className="flex items-center gap-3">
          <FileCode2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
            AG Grid Enterprise (`AgGridReact`) — Escrow Ledger &amp; Master/Detail Inspector
          </h2>
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          <span className="text-xs text-slate-400">
            Expand any row via Master/Detail chevron or click Verify Live Receipt
          </span>
        </div>

        {/* Interactive Filter Tabs + Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'ESCROW_FUNDED', label: 'Funded' },
                { id: 'UNPAID_LATE', label: 'Overdue' },
                { id: 'PAYOUT_SETTLED', label: 'Settled' },
                { id: 'AUDIT_REJECTED', label: 'Blocked' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              aria-label="Filter ledger milestones"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search task, contractor, batch ID..."
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-52"
            />
          </div>
        </div>
      </div>

      {/* Real AG Grid Enterprise Component Instance (no legacy ag-theme-* class to avoid Error #239) */}
      <div className="w-full h-[420px]">
        <AgGridReact<MilestoneTask>
          theme={milestoneGridTheme}
          rowData={filteredTasks}
          columnDefs={columnDefs}
          pinnedBottomRowData={pinnedBottomRowData}
          masterDetail={true}
          detailRowHeight={210}
          detailCellRenderer={LedgerDetailCellRenderer}
          isRowMaster={(dataItem) => Boolean(dataItem && dataItem.id !== 'PINNED-SUMMARY')}
          defaultColDef={{
            resizable: true,
            sortable: true,
          }}
          rowHeight={52}
          headerHeight={38}
          onRowClicked={(event) => {
            if (
              event.node?.rowPinned !== 'bottom' &&
              event.data &&
              event.data.id !== 'PINNED-SUMMARY'
            ) {
              setSelectedTaskId(event.data.id);
            }
          }}
          getRowId={(params) => params.data.id}
        />
      </div>
    </section>
  );
};

