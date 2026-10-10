import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  HandHeart,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Pill } from "@/components/admin/badges";
import { FollowUpForm } from "@/components/admin/follow-up-form";
import { LeadPicker } from "@/components/admin/lead-picker";
import { Spinner } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, call } from "@/lib/api";
import { eventLabel } from "@/lib/bookings";
import { cn, formatTime, IST_TZ, titleCase, todayIst } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/calendar")({
  component: CalendarPage,
});

type Ev = {
  key: string;
  kind: "follow_up" | "program";
  at: Date;
  title: string;
  sub: string;
  leadId: number | null;
  done?: boolean;
  id: number;
};

const istDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: IST_TZ });

const TYPE_COLOR: Record<string, string> = {
  call: "bg-blue-100 text-blue-800 border-blue-200",
  whatsapp: "bg-emerald-100 text-emerald-800 border-emerald-200",
  visit: "bg-violet-100 text-violet-800 border-violet-200",
  email: "bg-slate-100 text-slate-800 border-slate-200",
  meeting: "bg-amber-100 text-amber-800 border-amber-200",
  program: "bg-orange-500 text-white border-orange-600",
};

function CalendarPage() {
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(new Date());
  const [dayOpen, setDayOpen] = useState<string | null>(null);
  const [pickedLead, setPickedLead] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const qc = useQueryClient();

  const range = useMemo(() => {
    const start =
      view === "month"
        ? startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
        : startOfWeek(cursor, { weekStartsOn: 1 });
    const end =
      view === "month"
        ? endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
        : endOfWeek(cursor, { weekStartsOn: 1 });
    const days: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
    return { start, end: addDays(end, 1), days };
  }, [cursor, view]);

  const { data, isFetching } = useQuery({
    queryKey: [
      "admin",
      "calendar",
      range.start.toISOString(),
      range.end.toISOString(),
    ],
    queryFn: () =>
      call(
        api.admin["follow-ups"].calendar.get({
          query: {
            from: range.start.toISOString(),
            to: range.end.toISOString(),
          },
        }),
      ),
  });

  const markDone = useMutation({
    mutationFn: (id: number) =>
      call(api.admin["follow-ups"]({ id }).patch({ status: "done" })),
    onSuccess: () => {
      toast.success("Marked done");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const byDay = useMemo(() => {
    const map = new Map<string, Ev[]>();
    const push = (e: Ev) => {
      const k = istDay(e.at);
      map.set(k, [...(map.get(k) ?? []), e]);
    };
    for (const f of data?.followUps ?? []) {
      push({
        key: `f${f.id}`,
        id: f.id,
        kind: "follow_up",
        at: new Date(f.dueAt),
        title: f.leadName,
        sub: `${titleCase(f.type)}: ${f.title}`,
        leadId: f.leadId,
        done: f.status === "done",
      });
    }
    for (const s of data?.programs ?? []) {
      if (!s.start) continue;
      push({
        key: `s${s.id}`,
        id: s.id,
        kind: "program",
        at: new Date(s.start),
        title: s.name,
        sub: `Show: ${eventLabel(s.eventType)} · ${s.city}${s.end ? ` → ${formatTime(s.end)}` : ""}`,
        leadId: s.leadId,
        done: s.status === "completed",
      });
    }
    for (const list of map.values())
      list.sort((a, b) => a.at.getTime() - b.at.getTime());
    return map;
  }, [data]);

  const today = todayIst();
  const step = view === "month" ? addMonths : addWeeks;
  const openEvents = dayOpen ? (byDay.get(dayOpen) ?? []) : [];

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Follow-ups and confirmed shows. Click a day to add a follow-up."
        actions={
          <div className="flex rounded-md border bg-white p-0.5">
            <Button
              size="sm"
              variant={view === "month" ? "secondary" : "ghost"}
              onClick={() => setView("month")}
            >
              Month
            </Button>
            <Button
              size="sm"
              variant={view === "week" ? "secondary" : "ghost"}
              onClick={() => setView("week")}
            >
              Week
            </Button>
          </div>
        }
      />
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-3 sm:px-4">
          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setCursor((c) => step(c, -1))}
              aria-label="Previous"
            >
              <ChevronLeft />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setCursor((c) => step(c, 1))}
              aria-label="Next"
            >
              <ChevronRight />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCursor(new Date())}
            >
              Today
            </Button>
          </div>
          <h2 className="order-first flex w-full items-center gap-2 font-display text-lg text-night sm:order-none sm:w-auto">
            {view === "month"
              ? format(cursor, "MMMM yyyy")
              : `${format(range.days[0] ?? cursor, "d MMM")} – ${format(range.days[6] ?? cursor, "d MMM yyyy")}`}
            {isFetching && <Spinner className="size-4" />}
          </h2>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-orange-500" /> Show
              program
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-blue-200" /> Follow-up
            </span>
          </div>
        </div>
        <div>
          <div>
            <div
              className={cn(
                "grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground",
                view === "week" ? "hidden md:grid" : "grid",
              )}
            >
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="py-2">
                  <span className="md:hidden">{d.charAt(0)}</span>
                  <span className="hidden md:inline">{d}</span>
                </div>
              ))}
            </div>
            <div
              className={cn(
                "grid md:grid-cols-7",
                view === "month" ? "grid-cols-7" : "grid-cols-1",
              )}
            >
              {range.days.map((d) => {
                const k = format(d, "yyyy-MM-dd");
                const evs = byDay.get(k) ?? [];
                const max = view === "month" ? 3 : 20;
                return (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setDayOpen(k)}
                    className={cn(
                      "flex min-w-0 flex-col gap-1 border-r border-b p-1 text-left align-top transition hover:bg-accent/30 md:p-1.5",
                      view === "month"
                        ? "min-h-14 items-center md:min-h-28 md:items-stretch"
                        : "min-h-16 md:min-h-96",
                      view === "month" &&
                        !isSameMonth(d, cursor) &&
                        "bg-muted/30 text-muted-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full text-xs",
                          k === today && "bg-primary font-semibold text-white",
                        )}
                      >
                        {format(d, "d")}
                      </span>
                      {view === "week" && (
                        <span className="text-xs font-medium text-muted-foreground md:hidden">
                          {format(d, "EEEE")}
                          {evs.length === 0 && " · free"}
                        </span>
                      )}
                    </span>
                    {view === "month" && evs.length > 0 && (
                      <span className="flex flex-wrap justify-center gap-0.5 md:hidden">
                        {evs.slice(0, 4).map((e) => (
                          <span
                            key={e.key}
                            className={cn(
                              "size-1.5 rounded-full",
                              e.kind === "program"
                                ? "bg-orange-500"
                                : e.done
                                  ? "bg-muted-foreground/40"
                                  : e.at.getTime() < Date.now()
                                    ? "bg-red-500"
                                    : "bg-blue-500",
                            )}
                          />
                        ))}
                      </span>
                    )}
                    {evs.slice(0, max).map((e) => (
                      <span
                        key={e.key}
                        className={cn(
                          "truncate rounded border px-1.5 py-0.5 text-[11px] leading-tight",
                          view === "month" && "hidden md:block",
                          e.kind === "program"
                            ? TYPE_COLOR.program
                            : (TYPE_COLOR[
                                e.sub.split(":")[0]?.toLowerCase() ?? ""
                              ] ?? TYPE_COLOR.call),
                          e.done && "line-through opacity-60",
                          e.kind === "follow_up" &&
                            !e.done &&
                            e.at.getTime() < Date.now() &&
                            "border-red-300 bg-red-100 text-red-800",
                        )}
                        title={`${formatTime(e.at)} ${e.title}: ${e.sub}`}
                      >
                        {formatTime(e.at)} {e.title}
                      </span>
                    ))}
                    {evs.length > max && (
                      <span className="hidden text-[11px] text-muted-foreground md:block">
                        +{evs.length - max} more
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Dialog
        open={!!dayOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDayOpen(null);
            setPickedLead(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {dayOpen &&
                format(new Date(`${dayOpen}T00:00`), "EEEE, d MMMM yyyy")}
            </DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {openEvents.length === 0 && (
              <li className="text-sm text-muted-foreground">
                Nothing scheduled.
              </li>
            )}
            {openEvents.map((e) => (
              <li
                key={e.key}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm"
              >
                {e.kind === "program" ? (
                  <HandHeart className="size-4 text-orange-500" />
                ) : (
                  <span className="size-2 rounded-full bg-blue-500" />
                )}
                <div className="min-w-0 flex-1">
                  {e.leadId ? (
                    <Link
                      to="/admin/leads/$id"
                      params={{ id: String(e.leadId) }}
                      className="font-medium hover:text-primary"
                    >
                      {e.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{e.title}</span>
                  )}
                  <p className="text-muted-foreground">
                    {formatTime(e.at)} · {e.sub}
                  </p>
                </div>
                {e.done ? (
                  <Pill tone="green">Done</Pill>
                ) : e.kind === "follow_up" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markDone.mutate(e.id)}
                  >
                    <Check /> Done
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Plus className="size-4" /> Add follow-up on this day
            </p>
            {pickedLead ? (
              <>
                <p className="text-sm">
                  For <strong>{pickedLead.name}</strong>{" "}
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => setPickedLead(null)}
                  >
                    change
                  </button>
                </p>
                <FollowUpForm
                  key={`${dayOpen}-${pickedLead.id}`}
                  leadId={pickedLead.id}
                  defaultDate={dayOpen ?? undefined}
                  onDone={() => setPickedLead(null)}
                />
              </>
            ) : (
              <LeadPicker
                value={null}
                onChange={(id, name) => setPickedLead({ id, name })}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
