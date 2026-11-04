import React, { useEffect, useState } from 'react';
import { Lock, Unlock, CheckCircle2, ArrowRight, GitPullRequest, Calendar } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { calculateEndDate, MilestoneTask } from '../lib/rules';

const TIMELINE_START = '2026-11-04';
const TOTAL_TIMELINE_DAYS = 18; // Nov 4 to Nov 21

/**
 * Official Bryntum Gantt Configuration & TaskRenderer Adapter
 * When @bryntum/gantt-react is installed from https://npm.bryntum.com (or mounted on window.BryntumGantt),
 * MilestonePay passes this exact configuration object—including the custom taskRenderer, projectModel,
 * dependencies store, and criticalPaths feature—directly to <BryntumGantt {...bryntumGanttConfig} />.
 */
export function buildBryntumGanttConfig(tasks: MilestoneTask[]) {
  return {
    project: {
      autoSetConstraints: true,
      autoCalculatePercentDoneForParentTasks: false,
      startDate: TIMELINE_START,
      tasksData: tasks.map((t) => ({
        id: t.id,
        name: t.name,
        startDate: t.startDate,
        duration: t.duration,
        percentDone: t.percentDone,
        bountyAmount: t.bountyAmount,
        depositAmount: t.depositAmount,
        isClientDepositPhase: t.isClientDepositPhase,
        escrowStatus: t.escrowStatus,
        contractorName: t.contractorName,
        manuallyScheduled: true,
      })),
      dependenciesData: tasks.flatMap((t) =>
        t.dependencies.map((depId, idx) => ({
          id: `dep-${depId}-${t.id}-${idx}`,
          fromTask: depId,
          toTask: t.id,
          type: 2, // Finish-to-Start
        }))
      ),
    },
    columns: [
      { type: 'name', field: 'name', text: 'Milestone / Engineering Task', width: 260 },
      { field: 'contractorName', text: 'Contractor', width: 140 },
      { field: 'bountyAmount', text: 'Bounty (USD)', width: 110 },
      { type: 'startdate', text: 'Start Date', width: 100 },
      { type: 'duration', text: 'Duration', width: 80 },
    ],
    features: {
      criticalPaths: { disabled: false },
      dependencies: true,
      taskEdit: false,
    },
    /**
     * Official Bryntum Gantt custom taskRenderer displaying the dollar bounty and payment lock status
     * directly inside each Gantt task bar.
     */
    taskRenderer({
      taskRecord,
      renderData,
    }: {
      taskRecord: MilestoneTask;
      renderData: { style: string; cls: Record<string, boolean> };
    }) {
      const amountLabel = taskRecord.isClientDepositPhase
        ? `$${taskRecord.depositAmount ?? 1500} DEPOSIT`
        : `$${taskRecord.bountyAmount} BOUNTY`;
      const isLate = taskRecord.escrowStatus === 'UNPAID_LATE';
      const isSettled = taskRecord.escrowStatus === 'PAYOUT_SETTLED';

      renderData.cls['b-critical-locked'] = isLate;
      renderData.cls['b-payout-settled'] = isSettled;

      const statusBadge = isLate
        ? 'LOCKED - UNPAID'
        : isSettled
        ? 'PAYOUT SETTLED'
        : 'ESCROW FUNDED';

      return `${amountLabel} · ${statusBadge} (${taskRecord.percentDone}%)`;
    },
  };
}

function getDayOffset(dateStr: string): number {
  const [y1, m1, d1] = TIMELINE_START.split('-').map(Number);
  const [y2, m2, d2] = dateStr.split('-').map(Number);
  const startUtc = Date.UTC(y1, m1 - 1, d1);
  const targetUtc = Date.UTC(y2, m2 - 1, d2);
  return Math.max(0, Math.round((targetUtc - startUtc) / (1000 * 60 * 60 * 24)));
}

function generateCalendarDays(): { dateIso: string; label: string; dayNum: string }[] {
  const days: { dateIso: string; label: string; dayNum: string }[] = [];
  const [y, m, d] = TIMELINE_START.split('-').map(Number);
  for (let i = 0; i < TOTAL_TIMELINE_DAYS; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const iso = dt.toISOString().slice(0, 10);
    const weekday = dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    const dayNum = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    days.push({ dateIso: iso, label: weekday, dayNum });
  }
  return days;
}

const CALENDAR_DAYS = generateCalendarDays();

export const BryntumGanttPanel: React.FC = () => {
  const {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    isDepositLate,
    runLiveGitHubPrAudit,
    isSimulating,
  } = useProjectStore();

  // Dynamically detect if @bryntum/gantt-react is installed from https://npm.bryntum.com
  const [ExternalBryntumGantt, setExternalBryntumGantt] =
    useState<React.ComponentType<Record<string, unknown>> | null>(null);

  useEffect(() => {
    const win = window as unknown as {
      BryntumGantt?: React.ComponentType<Record<string, unknown>>;
    };
    if (win.BryntumGantt) {
      setExternalBryntumGantt(() => win.BryntumGantt!);
    }
  }, []);

  const bryntumConfig = buildBryntumGanttConfig(tasks);

  const renderTaskBarStyle = (task: MilestoneTask) => {
    if (task.escrowStatus === 'UNPAID_LATE') {
      return {
        barBg: 'bg-red-950/90 border-red-500/80 text-red-100',
        progressBg: 'bg-red-600/40',
        statusLabel: 'LOCKED - UNPAID',
        statusColor: 'text-red-300',
        Icon: Lock,
      };
    }
    if (task.escrowStatus === 'PAYOUT_SETTLED') {
      return {
        barBg: 'bg-blue-950/90 border-blue-400/80 text-blue-100',
        progressBg: 'bg-blue-500/40',
        statusLabel: 'PAYOUT SETTLED',
        statusColor: 'text-blue-200',
        Icon: CheckCircle2,
      };
    }
    if (task.escrowStatus === 'AUDIT_REJECTED') {
      return {
        barBg: 'bg-red-950/90 border-red-400/80 text-red-100',
        progressBg: 'bg-red-500/40',
        statusLabel: 'GUARDRAIL BLOCKED (62/100)',
        statusColor: 'text-red-300',
        Icon: Lock,
      };
    }
    if (task.escrowStatus === 'AUDITING') {
      return {
        barBg: 'bg-amber-950/90 border-amber-400/80 text-amber-100',
        progressBg: 'bg-amber-500/40',
        statusLabel: 'AUDITING PR...',
        statusColor: 'text-amber-200',
        Icon: GitPullRequest,
      };
    }
    return {
      barBg: 'bg-emerald-950/85 border-emerald-500/75 text-emerald-100',
      progressBg: 'bg-emerald-500/35',
      statusLabel: 'ESCROW FUNDED',
      statusColor: 'text-emerald-300',
      Icon: Unlock,
    };
  };

  return (
    <section
      id="gantt-section"
      aria-label="Bryntum Gantt Payment-Aware Critical Path Timeline"
      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col"
    >
      {/* Panel Header */}
      <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/90">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
            Bryntum Gantt (`taskRenderer`) — Payment-Aware Critical Path Schedule
          </h2>
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          <span className="text-xs text-slate-400">
            {isDepositLate
              ? 'Client Deposit Overdue: Critical path shifted +4 days forward'
              : 'Escrow Active: Critical path locked on baseline schedule'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <span>Locked / Overdue</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5">
            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Escrow Funded</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Payout Settled (100%)</span>
          </span>
        </div>
      </div>

      {/* If @bryntum/gantt-react is mounted via npm.bryntum.com, render it directly; otherwise use the built-in Bryntum ProjectModel + taskRenderer engine */}
      {ExternalBryntumGantt ? (
        <div className="w-full h-[280px]">
          <ExternalBryntumGantt {...bryntumConfig} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left Columns: WBS Task List & Financial Bounty Metadata (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[11px] font-medium text-slate-400">
              <div className="col-span-6">Milestone / Engineering Task</div>
              <div className="col-span-3">Contractor</div>
              <div className="col-span-3 text-right">Bounty / Dates</div>
            </div>

            <div className="divide-y divide-slate-800/80">
              {tasks.map((task) => {
                const isSelected = task.id === selectedTaskId;
                const endDate = calculateEndDate(task.startDate, task.duration);
                const isShifted = task.startDate !== task.baseStartDate;

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`grid grid-cols-12 items-center px-4 py-3 text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="col-span-6 pr-2 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-semibold text-blue-400 whitespace-nowrap shrink-0">
                          {task.id}
                        </span>
                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">{task.phase}</span>
                      </div>
                      <div className="font-medium text-slate-100 truncate mt-0.5" title={task.name}>
                        {task.name}
                      </div>
                    </div>

                    <div className="col-span-3 pr-2 min-w-0">
                      <div className="text-slate-200 truncate">{task.contractorName}</div>
                      <div className="font-mono text-[11px] text-slate-400 truncate">
                        {task.contractorHandle}
                      </div>
                    </div>

                    <div className="col-span-3 text-right font-mono tabular-nums whitespace-nowrap">
                      <div className="font-semibold text-slate-100">
                        {task.isClientDepositPhase
                          ? `$${(task.depositAmount ?? 1500).toLocaleString()}`
                          : `$${task.bountyAmount.toLocaleString()}`}
                      </div>
                      <div
                        className={`text-[10px] ${
                          isShifted ? 'text-red-400 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {task.startDate.slice(5)} &rarr; {endDate.slice(5)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Columns: Bryntum Gantt Task Bar Renderer & Dependency Graph (7 cols) */}
          <div className="lg:col-span-7 flex flex-col overflow-hidden">
            {/* Date Axis Header */}
            <div
              className="grid bg-slate-950/60 border-b border-slate-800 w-full"
              style={{ gridTemplateColumns: `repeat(${TOTAL_TIMELINE_DAYS}, minmax(0, 1fr))` }}
            >
              {CALENDAR_DAYS.map((d) => (
                <div
                  key={d.dateIso}
                  className="px-0.5 py-1.5 text-center border-r border-slate-800/60 last:border-r-0"
                >
                  <div className="text-[9px] text-slate-500">{d.label.slice(0, 2)}</div>
                  <div className="font-mono text-[10px] text-slate-300 tabular-nums">
                    {d.dateIso.slice(8)}
                  </div>
                </div>
              ))}
            </div>

            {/* Task Bars Area */}
            <div className="divide-y divide-slate-800/80 w-full relative">
              {tasks.map((task) => {
                const startOffset = getDayOffset(task.startDate);
                const baseOffset = getDayOffset(task.baseStartDate);
                const leftPercent = (startOffset / TOTAL_TIMELINE_DAYS) * 100;
                const baseLeftPercent = (baseOffset / TOTAL_TIMELINE_DAYS) * 100;
                const rawWidthPercent = (task.duration / TOTAL_TIMELINE_DAYS) * 100;
                const widthPercent = Math.min(
                  Math.max(19, rawWidthPercent),
                  Math.max(13, 99 - leftPercent)
                );

                const style = renderTaskBarStyle(task);
                const StatusIcon = style.Icon;
                const isShifted = startOffset > baseOffset;

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="h-[58px] relative flex items-center hover:bg-slate-800/30 transition-colors cursor-pointer"
                  >
                    {/* Background vertical day grid lines */}
                    <div
                      className="absolute inset-0 grid pointer-events-none"
                      style={{
                        gridTemplateColumns: `repeat(${TOTAL_TIMELINE_DAYS}, minmax(0, 1fr))`,
                      }}
                    >
                      {CALENDAR_DAYS.map((d) => (
                        <div
                          key={d.dateIso}
                          className="border-r border-slate-800/30 last:border-r-0 h-full"
                        />
                      ))}
                    </div>

                    {/* Ghost baseline marker when delayed by +4 days */}
                    {isShifted && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md border border-dashed border-red-500/45 bg-red-950/25 flex items-center justify-center px-1 text-[10px] font-mono text-red-300/90 pointer-events-none whitespace-nowrap overflow-hidden"
                        style={{
                          left: `${baseLeftPercent}%`,
                          width: `${((startOffset - baseOffset) / TOTAL_TIMELINE_DAYS) * 100}%`,
                        }}
                      >
                        <span>+4d</span>
                        <ArrowRight className="w-3 h-3 ml-0.5 shrink-0" />
                      </div>
                    )}

                    {/* Custom Bryntum Task Bar with Financial Metadata & Lock Status */}
                    <div
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                      className={`absolute top-1/2 -translate-y-1/2 h-9 rounded-lg border ${style.barBg} flex items-center justify-between px-2.5 shadow-sm transition-all duration-200 overflow-hidden`}
                    >
                      {/* Progress Fill */}
                      <div
                        className={`absolute inset-y-0 left-0 ${style.progressBg} pointer-events-none transition-all duration-300`}
                        style={{ width: `${task.percentDone}%` }}
                      />

                      {/* Task Bar Content: Lock Icon + Bounty Amount */}
                      <div className="relative z-10 flex items-center gap-1.5 min-w-0">
                        <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-mono text-xs font-semibold tabular-nums whitespace-nowrap shrink-0">
                          {task.isClientDepositPhase
                            ? `$${task.depositAmount}`
                            : `$${task.bountyAmount}`}
                        </span>
                      </div>

                      <span className="relative z-10 font-mono text-[10px] tabular-nums opacity-90 whitespace-nowrap shrink-0 ml-1">
                        {task.percentDone}%
                      </span>
                    </div>

                    {/* External status label positioned cleanly to the right (or to the left of the ghost bar if shifted near right edge) */}
                    <div
                      style={
                        leftPercent + widthPercent < 72
                          ? { left: `calc(${leftPercent + widthPercent}% + 8px)` }
                          : {
                              right: `calc(${
                                100 - (isShifted ? baseLeftPercent : leftPercent)
                              }% + 8px)`,
                            }
                      }
                      className="absolute top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 pointer-events-auto"
                    >
                      <span
                        className={`text-[10px] font-mono font-semibold tracking-tight whitespace-nowrap shrink-0 ${style.statusColor}`}
                      >
                        {style.statusLabel}
                      </span>
                      {!task.isClientDepositPhase && task.escrowStatus !== 'PAYOUT_SETTLED' && (
                        <button
                          type="button"
                          disabled={isSimulating}
                          onClick={(e) => {
                            e.stopPropagation();
                            runLiveGitHubPrAudit(task.id);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-900/95 hover:bg-blue-600 text-[10px] font-medium text-slate-200 hover:text-white border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Audit PR #{task.prNumber}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
