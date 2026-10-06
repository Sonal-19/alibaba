import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { AppSelect } from "@/components/common/app-select";
import { Field } from "@/components/common/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { waLink } from "@/lib/utils";
import type { BookingButtonSettings } from "$/db/schema";

const MAX_NUMBERS = 10;
const digits = (n: string) => n.replace(/\D/g, "");

/** Admin → Settings card for the landing page's floating Book a Show button. */
export function BookingButtonCard({
  value,
  fallbackNumber,
  onChange,
}: {
  value: BookingButtonSettings;
  /** The main WhatsApp number, used when no numbers are listed here. */
  fallbackNumber: string;
  onChange: (v: BookingButtonSettings) => void;
}) {
  const set = (patch: Partial<BookingButtonSettings>) =>
    onChange({ ...value, ...patch });
  const setNumber = (
    i: number,
    patch: Partial<BookingButtonSettings["numbers"][number]>,
  ) =>
    set({
      numbers: value.numbers.map((n, j) => (j === i ? { ...n, ...patch } : n)),
    });

  const active = value.numbers.filter((n) => n.active && digits(n.number));
  const testNumber = value.numbers.length ? active[0]?.number : fallbackNumber;

  return (
    <Card className="gap-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-night">
            <FaWhatsapp className="size-4 text-[#25D366]" /> Book a Show button
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Floating button on the home page. Visitors tap it and WhatsApp opens
            with your message ready; they only press send.
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm font-medium">
          {value.enabled ? "On" : "Off"}
          <Switch
            checked={value.enabled}
            onCheckedChange={(enabled) => set({ enabled })}
            aria-label="Show the Book a Show button"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Button text">
          <Input
            maxLength={40}
            value={value.label}
            onChange={(e) => set({ label: e.target.value })}
          />
        </Field>
        <Field label="Opens">
          <AppSelect
            className="w-full"
            value={value.channel}
            onValueChange={(v) =>
              set({ channel: v as BookingButtonSettings["channel"] })
            }
            options={[{ value: "whatsapp", label: "WhatsApp chat" }]}
          />
        </Field>
      </div>
      <Field
        label="Pre-filled message"
        hint="What the visitor sends you. They can edit it before sending."
      >
        <Textarea
          rows={3}
          maxLength={500}
          value={value.message}
          onChange={(e) => set({ message: e.target.value })}
        />
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">WhatsApp numbers</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={value.numbers.length >= MAX_NUMBERS}
            onClick={() =>
              set({
                numbers: [
                  ...value.numbers,
                  { number: "", label: "", active: true },
                ],
              })
            }
          >
            <Plus /> Add number
          </Button>
        </div>
        {value.numbers.length === 0 ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            No numbers added, so the button uses the main WhatsApp number
            {fallbackNumber ? ` (${fallbackNumber})` : ""} from Bookings &
            contact.
          </p>
        ) : (
          value.numbers.map((n, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:items-center"
            >
              <Input
                className="sm:w-48"
                inputMode="tel"
                placeholder="919876543210"
                aria-label="WhatsApp number"
                value={n.number}
                onChange={(e) => setNumber(i, { number: e.target.value })}
              />
              <Input
                className="flex-1"
                placeholder="Note, e.g. Manager"
                aria-label="Note"
                maxLength={60}
                value={n.label}
                onChange={(e) => setNumber(i, { label: e.target.value })}
              />
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={n.active}
                    onCheckedChange={(on) => setNumber(i, { active: on })}
                    aria-label="Number active"
                  />
                  Active
                </label>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Remove number"
                  onClick={() =>
                    set({ numbers: value.numbers.filter((_, j) => j !== i) })
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))
        )}
        {value.numbers.length > 0 && active.length === 0 && (
          <p className="text-sm text-destructive">
            No active number: the button is hidden until one is switched on.
          </p>
        )}
      </div>

      {active.length > 1 && (
        <Field
          label="With several active numbers"
          hint="Random spreads enquiries across the team."
        >
          <AppSelect
            className="w-full sm:w-72"
            value={value.rotation}
            onValueChange={(v) =>
              set({ rotation: v as BookingButtonSettings["rotation"] })
            }
            options={[
              { value: "first", label: "Always use the first active number" },
              { value: "random", label: "Pick a random active number" },
            ]}
          />
        </Field>
      )}

      {testNumber && (
        <a
          href={waLink(testNumber, value.message)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Test the link <ExternalLink className="size-3.5" />
        </a>
      )}
    </Card>
  );
}
