"use client";

// Spec §3.3 "Sheet Kết thúc": minutes from the clock (−/+ or typed, 1–300), intensity chips, optional km for
// speed-based activities (stored like Fitora's joinDistanceNote), weight + its source, live kcal, "Lưu buổi
// tập" and "Huỷ buổi tập" (confirmed). Under one minute only cancelling is possible; over 4 h it warns
// and pre-fills 60 minutes.
import { Check, Info, Scale, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { KCAL_MARGIN } from "@/src/components/session/copy";
import { useToast } from "@/src/components/app/toast";
import { Chip, ConfirmDialog, GlassButton, Sheet, TextField } from "@/src/components/f1";
import { MinutesStepper } from "@/src/components/session/MinutesStepper";
import { useActiveSession } from "@/src/hooks/use-active-session";
import { useWeight } from "@/src/hooks/use-weight";
import { estimateCaption, sessionKcal } from "@/src/lib/calories";
import { cn } from "@/src/lib/cn";
import { isSpeedBased, joinDistanceNote } from "@/src/lib/fitora";
import { formatClock, formatInt, formatKg } from "@/src/lib/format";
import { clampMinutes } from "@/src/lib/session";
import { isValidWeight } from "@/src/lib/weight";
import type { ActiveSession, GymWorkout, WeightInfo } from "@/src/types/gym";

export interface FinishSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** After save (the saved row) or cancel (null); the parent usually navigates to 'week' / 'today'. */
  onDone?: (saved: GymWorkout | null) => void;
}

/** "5,2" / "5.2" → 5.2; empty → null; anything else → NaN. */
export function parseDecimal(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (!t) return null;
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}

/** Where the session's weight comes from, as shown under the kg. */
function weightSourceLabel(session: ActiveSession, current: WeightInfo): string {
  if (session.weightSource === current.source) return current.label;
  if (session.weightSource === "measured") return "Fitora · lần đo gần nhất";
  if (session.weightSource === "profile") return "Fitora · hồ sơ";
  return session.weightSource === "manual" ? "nhập tay" : "gợi ý, chưa xác nhận";
}

interface FormState {
  sessionId: string;
  minutesText: string;
  variant: string;
  kmText: string;
  weightText: string;
  weightConfirmed: boolean;
}

export function FinishSheet({ open, onOpenChange, onDone }: FinishSheetProps) {
  const s = useActiveSession();
  const { weight, setManualWeight } = useWeight();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const intensityId = useId();

  const session = s.session;
  const summary = s.finishSummary;

  // Fresh form every time the sheet opens (derived during render, no effect).
  if (open && session && summary && form?.sessionId !== session.id) {
    const manualCapable = session.weightSource === "fallback" || session.weightSource === "manual";
    setForm({
      sessionId: session.id,
      minutesText: String(Math.max(1, summary.suggestedMinutes)),
      variant: session.variant,
      kmText: "",
      weightText: formatKg(manualCapable && weight.source === "manual" ? weight.kg : session.weightKg),
      weightConfirmed: !(session.weightSource === "fallback" && weight.needsConfirm),
    });
  }
  if (!open && form) setForm(null);

  if (!session || !summary) return null;
  const f: FormState = form ?? {
    sessionId: session.id,
    minutesText: String(Math.max(1, summary.suggestedMinutes)),
    variant: session.variant,
    kmText: "",
    weightText: formatKg(session.weightKg),
    weightConfirmed: true,
  };
  const patch = (p: Partial<FormState>) => setForm({ ...f, ...p });

  const minutes = clampMinutes(Number(f.minutesText || 0));
  const variants = s.activity?.variants ?? [];
  const variant = variants.find((v) => v.id === f.variant) ?? s.variant;
  const met = variant?.met ?? session.met;

  const weightEditable = session.weightSource === "fallback" || session.weightSource === "manual";
  const parsedWeight = weightEditable ? parseDecimal(f.weightText) : session.weightKg;
  const weightOk = isValidWeight(parsedWeight);
  const kg = weightOk ? (parsedWeight as number) : session.weightKg;

  const speedBased = isSpeedBased(session.activity);
  const km = speedBased ? parseDecimal(f.kmText) : null;
  const kmOk = km === null || (Number.isFinite(km) && km > 0 && km <= 1000);

  const kcal = sessionKcal(met, kg, minutes);
  const canSave = summary.canSave && weightOk && kmOk && f.weightConfirmed && !busy;
  /** Why "Lưu" is disabled (the field may be scrolled out of view). */
  const blocker = !weightOk
    ? "Cân nặng chưa hợp lệ, xem ô cân nặng ở trên."
    : !f.weightConfirmed
      ? "Xác nhận cân nặng ở cuối danh sách để lưu."
      : !kmOk
        ? "Quãng đường chưa hợp lệ, sửa hoặc xoá ô km."
        : null;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      if (weightEditable) setManualWeight(kg);
      const saved = await s.complete({
        durationMin: minutes,
        variant: variant?.id,
        weightKg: kg,
        km: kmOk && km ? km : null,
      });
      onOpenChange(false);
      toast.show(saved.sync === "saved" ? "Đã lưu buổi tập" : "Đã lưu trên máy, sẽ gửi khi có mạng", {
        tone: saved.sync === "saved" ? "success" : "info",
      });
      onDone?.(saved);
    } finally {
      setBusy(false);
    }
  };

  const cancelSession = () => {
    s.discard();
    onOpenChange(false);
    toast.show("Đã huỷ buổi tập", { tone: "info" });
    onDone?.(null);
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title="Kết thúc buổi tập"
        description={session.title}
        footer={
          <div className="flex flex-col gap-2">
            {summary.canSave ? (
              <>
                <div className="mb-1 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] text-fg-muted">{estimateCaption(kg, variant?.label)}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-fg-subtle">{KCAL_MARGIN}</p>
                  </div>
                  <p aria-live="polite" className="tabular shrink-0 text-[36px] font-semibold leading-none tracking-[-0.04em] text-gold">
                    <span className="sr-only">Calo ước lượng </span>≈ {formatInt(kcal)}
                    {" "}
                    <span className="text-[16px] font-medium tracking-normal">kcal</span>
                  </p>
                </div>
                {blocker ? (
                  <p role="status" className="flex items-center gap-1.5 text-[13px] text-fg-muted">
                    <Info aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.8} />
                    {blocker}
                  </p>
                ) : null}
                <GlassButton variant="primary" size="lg" block disabled={!canSave} aria-busy={busy} onClick={save}>
                  {busy ? "Đang lưu…" : "Lưu buổi tập"}
                </GlassButton>
              </>
            ) : null}
            <GlassButton
              variant={summary.canSave ? "ghost" : "danger"}
              size="md"
              block
              className={cn("text-danger", !summary.canSave && "min-h-14")}
              disabled={busy}
              onClick={() => setConfirmCancel(true)}
            >
              Huỷ buổi tập
            </GlassButton>
          </div>
        }
      >
        {!summary.canSave ? (
          <div className="flex items-start gap-3 rounded-2xl bg-white/[0.06] p-4">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fg-muted" strokeWidth={1.8} />
            <p className="text-[15px] leading-relaxed">
              Buổi tập mới được {formatClock(summary.elapsedMs)}, chưa đủ 1 phút nên không lưu được. Bạn có thể huỷ buổi này
              hoặc đóng lại để tập tiếp.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {summary.forgotten ? (
              <div role="status" className="flex items-start gap-3 rounded-2xl bg-gold-soft p-4">
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.8} />
                <p className="text-[15px] leading-relaxed">
                  <strong className="font-semibold">Có thể bạn quên bấm kết thúc.</strong> Đồng hồ đã chạy{" "}
                  {formatClock(summary.elapsedMs)}, app đã điền sẵn 60 phút. Hãy sửa lại cho đúng.
                </p>
              </div>
            ) : null}

            <MinutesStepper
              value={f.minutesText}
              minutes={minutes}
              onChange={(text) => patch({ minutesText: text })}
              onCommit={(m) => patch({ minutesText: String(clampMinutes(m)) })}
            />

            {variants.length > 1 ? (
              <div role="group" aria-labelledby={intensityId}>
                <p id={intensityId} className="text-[14px] font-medium text-fg-muted">
                  Cường độ
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <Chip key={v.id} selected={v.id === f.variant} onClick={() => patch({ variant: v.id })}>
                      {v.label}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : null}

            {speedBased ? (
              <TextField
                label="Quãng đường (km, không bắt buộc)"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="Ví dụ 5,2"
                value={f.kmText}
                onChange={(e) => patch({ kmText: e.target.value.slice(0, 7) })}
                error={kmOk ? null : "Nhập số km lớn hơn 0, tối đa 1000"}
                hint={km && kmOk ? `Ghi vào ghi chú: “${joinDistanceNote(km, null)}”` : "Fitora dùng quãng đường để tính pace"}
              />
            ) : null}

            {weightEditable ? (
              <div className="flex flex-col gap-3">
                <TextField
                  label="Cân nặng (kg) để tính calo"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={f.weightText}
                  onChange={(e) => patch({ weightText: e.target.value.slice(0, 5), weightConfirmed: true })}
                  error={weightOk ? null : "Nhập cân nặng từ 25 đến 300 kg"}
                  hint="Fitora chưa có cân nặng của bạn. Số này chỉ lưu trên máy, không ghi sang Fitora."
                />
                {session.weightSource === "fallback" && weight.needsConfirm ? (
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={f.weightConfirmed}
                    onClick={() => patch({ weightConfirmed: !f.weightConfirmed })}
                    className="flex min-h-11 items-center gap-3 text-left text-[15px]"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md border",
                        f.weightConfirmed ? "border-gold bg-gold text-gold-ink" : "border-line-strong text-transparent",
                      )}
                    >
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                    Đúng, tôi nặng khoảng {weightOk ? formatKg(kg) : "…"} kg
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Scale aria-hidden="true" className="size-5 shrink-0 text-fg-muted" strokeWidth={1.8} />
                <p className="min-w-0 flex-1 text-[15px]">
                  <span className="font-medium">{formatKg(kg)} kg</span>
                  <span className="text-fg-muted"> · {weightSourceLabel(session, weight)}</span>
                  <span className="block text-[13px] text-fg-subtle">Sửa cân nặng trong Fitora</span>
                </p>
              </div>
            )}
          </div>
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Huỷ buổi tập này?"
        description="Thời gian và calo của buổi này sẽ không được lưu."
        confirmLabel="Huỷ buổi tập"
        cancelLabel="Quay lại"
        destructive
        onConfirm={cancelSession}
      />
    </>
  );
}
