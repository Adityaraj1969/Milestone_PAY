import React from 'react';
import {
  X,
  ShieldCheck,
  Server,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

export const PayPalLiveReceiptModal: React.FC = () => {
  const {
    lookupModalOpen,
    lookupLoading,
    lookupBatchId,
    lookupResult,
    closeLiveReceiptModal,
  } = useProjectStore();

  const [copied, setCopied] = React.useState(false);

  if (!lookupModalOpen) return null;

  const handleCopyJson = () => {
    if (!lookupResult) return;
    navigator.clipboard?.writeText(JSON.stringify(lookupResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paypal-live-lookup-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4"
      onClick={() => closeLiveReceiptModal()}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <h3
              id="paypal-live-lookup-title"
              className="text-sm font-semibold text-white"
            >
              Verified PayPal API Live Lookup — {lookupBatchId}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close Live Receipt Modal"
            onClick={() => closeLiveReceiptModal()}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          {lookupLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-300">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              <span>
                {lookupBatchId?.startsWith('ORDER-')
                  ? `Querying GET /v2/checkout/orders/${lookupBatchId.replace('ORDER-', '')} on backend...`
                  : `Querying GET /v1/payments/payouts/${lookupBatchId} on backend...`}
              </span>
            </div>
          ) : lookupResult ? (
            <>
              {/* Execution Mode Banner */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                  lookupResult.isLiveApi
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {lookupResult.isLiveApi ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold">
                      MODE: {lookupResult.mode.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] opacity-85 font-mono mt-0.5">
                      {lookupResult.endpointCalled} (HTTP {lookupResult.httpStatus})
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold">
                  {lookupResult.batchHeader.batch_status}
                </span>
              </div>

              {/* Key Financial Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono">
                <div>
                  <div className="text-[10px] text-slate-400">BATCH ID</div>
                  <div className="text-slate-100 font-semibold mt-0.5 truncate">
                    {lookupResult.batchHeader.payout_batch_id}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">AMOUNT DISBURSED</div>
                  <div className="text-emerald-400 font-semibold mt-0.5">
                    ${lookupResult.batchHeader.amount.value}{' '}
                    {lookupResult.batchHeader.amount.currency}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">PAYPAL FEE</div>
                  <div className="text-slate-300 mt-0.5">
                    ${lookupResult.batchHeader.fees.value}{' '}
                    {lookupResult.batchHeader.fees.currency}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">RECEIVER EMAIL</div>
                  <div className="text-blue-300 mt-0.5 truncate">
                    {lookupResult.items[0]?.payout_item.receiver || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Raw Response Headers */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Server className="w-3.5 h-3.5 text-slate-500" />
                  <span>PayPal API Response Headers:</span>
                </div>
                <pre className="font-mono text-[11px] text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                  {Object.entries(lookupResult.responseHeaders)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n')}
                </pre>
              </div>

              {/* Full PayPal Payouts v1 / Orders v2 JSON Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">
                    Verified PayPal API JSON Response Body:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-[11px] font-medium cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied JSON</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Payload</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="font-mono text-[11px] text-slate-300 bg-slate-950 p-3.5 rounded-lg border border-slate-800 overflow-x-auto max-h-56">
                  {JSON.stringify(
                    {
                      batch_header: lookupResult.batchHeader,
                      items: lookupResult.items,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-slate-400">
              Unable to load receipt details for {lookupBatchId}.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            No merchant Sandbox login required — fetched directly via backend API
          </span>
          <button
            type="button"
            onClick={() => closeLiveReceiptModal()}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
