import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Check, X, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  details?: { label: string; value: string }[];
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  details,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setStep(1);
      setProcessing(false);
      setError('');
    }
  }, [open]);

  const handleNext = () => {
    setStep(2);
  };

  const handleConfirm = useCallback(async () => {
    setProcessing(true);
    setError('');
    try {
      await onConfirm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi.';
      setError(msg);
      setProcessing(false);
      setStep(1);
      return;
    }
    setProcessing(false);
  }, [onConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => { if (!processing) onCancel(); }}
    >
      <div
        className="w-full max-w-md p-6 rounded-2xl bg-[#1a0a0a] border border-[#670201]/40 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-serif font-bold text-amber-100/90">{title}</h3>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">{message}</p>
          </div>
          {!processing && (
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {details && details.length > 0 && (
          <div className="mb-5 space-y-1.5 p-3 rounded-lg bg-black/30 border border-white/5">
            {details.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{d.label}</span>
                <span className="text-gray-200 font-semibold text-right">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5">
          <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-[#670201]/60' : 'bg-white/5'}`} />
          <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-[#670201]/60' : 'bg-white/5'}`} />
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 text-center">Bước 1/2 — Vui lòng kiểm tra kỹ thông tin</p>
            <button
              onClick={handleNext}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-200 text-sm font-semibold rounded-lg border border-white/10 transition-all"
            >
              Tiếp tục
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2.5 text-gray-500 hover:text-gray-300 text-sm transition-all"
            >
              {cancelLabel}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-amber-300/70 text-center">Bước 2/2 — Xác nhận lần cuối để thực hiện</p>
            {error && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                {error}
              </div>
            )}
            <button
              onClick={handleConfirm}
              disabled={processing}
              className="w-full py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {processing ? 'Đang xử lý...' : confirmLabel}
            </button>
            <button
              onClick={() => { if (!processing) { setStep(1); setError(''); } }}
              disabled={processing}
              className="w-full py-2.5 text-gray-500 hover:text-gray-300 text-sm transition-all disabled:opacity-50"
            >
              Quay lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
