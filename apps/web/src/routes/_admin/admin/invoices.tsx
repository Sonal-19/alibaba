import {
  DEFAULT_INVOICE_DESCRIPTION,
  formatPaise,
  GST_STATES,
  GSTIN_REGEX,
  PAYMENT_METHODS,
  type PaymentMethod,
  paymentMethodLabel,
  SELLER,
  splitGst,
  toPaise,
} from "@api/lib/utils/gst";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Ban, Download, Eye, FileText, Plus, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Pill } from "@/components/admin/badges";
import { AppSelect } from "@/components/common/app-select";
import { Field } from "@/components/common/field";
import {
  FormDialogBody,
  FormDialogContent,
  FormDialogFooter,
  FormDialogHeader,
} from "@/components/common/form-dialog";
import { EmptyState, ErrorState, PageLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api, call } from "@/lib/api";
import { cn, formatDate, todayIst, ymd } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/invoices")({
  component: InvoicesAdmin,
});

const invoicesQuery = (q: string) => ({
  queryKey: ["admin", "invoices", q],
  queryFn: () => call(api.admin.invoices.get({ query: q ? { q } : {} })),
});
type Invoice = NonNullable<
  Awaited<ReturnType<ReturnType<typeof invoicesQuery>["queryFn"]>>
>[number];

const pdfUrl = (id: number, inline = false) =>
  `/api/admin/invoices/${id}/pdf${inline ? "?inline=1" : ""}`;

/** Same-origin link, so the admin cookie authenticates it on every device. */
function downloadPdf(id: number) {
  const a = document.createElement("a");
  a.href = pdfUrl(id);
  a.download = "";
  document.body.append(a);
  a.click();
  a.remove();
}

const rupees = (paise: number) => `₹${formatPaise(paise)}`;
const invoiceDay = (d: string) => formatDate(`${ymd(d)}T00:00:00+05:30`);
const onError = (e: Error) => toast.error(e.message);

function InvoicesAdmin() {
  const [search, setSearch] = useState("");
  const q = useDeferredValue(search.trim());
  const { data, isLoading, error } = useQuery(invoicesQuery(q));
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();

  const cancel = useMutation({
    mutationFn: (id: number) => call(api.admin.invoices({ id }).cancel.patch()),
    onSuccess: () => {
      toast.success("Invoice cancelled");
      qc.invalidateQueries({ queryKey: ["admin", "invoices"] });
    },
    onError,
  });
  const confirmCancel = (inv: Invoice) =>
    confirm(
      `Cancel invoice ${inv.invoiceNo}? The number stays used and the PDF will be marked CANCELLED.`,
    ) && cancel.mutate(inv.id);

  return (
    <>
      <PageHeader
        title="Invoices"
        description={`GST tax invoices from ${SELLER.tradeName} (GSTIN ${SELLER.gstin}). Enter the amount received; GST is worked out from it.`}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> New invoice
          </Button>
        }
      />

      <div className="relative mb-4 sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or invoice no."
          className="bg-white pl-9"
          aria-label="Search invoices"
        />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : error || !data ? (
        <ErrorState error={error} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-8" />}
          title={q ? "No matching invoices" : "No invoices yet"}
        >
          {!q && "Create the first invoice for a show client."}
        </EmptyState>
      ) : (
        <>
          {/* phones: cards */}
          <div className="space-y-3 md:hidden">
            {data.map((inv) => (
              <Card
                key={inv.id}
                className={cn(
                  "gap-3 p-4",
                  inv.status === "cancelled" && "opacity-70",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-night">
                      {inv.clientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {inv.invoiceNo} · {invoiceDay(inv.invoiceDate)}
                    </p>
                  </div>
                  <StatusPill status={inv.status} />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {inv.clientState}
                    <br />
                    {inv.igstPaise > 0 ? "IGST 18%" : "CGST 9% + SGST 9%"} ·{" "}
                    {paymentMethodLabel(inv.paymentMethod)}
                  </p>
                  <p className="text-lg font-semibold text-night">
                    {rupees(inv.totalPaise)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-11"
                    onClick={() => downloadPdf(inv.id)}
                  >
                    <Download /> Download
                  </Button>
                  <Button variant="outline" className="h-11" asChild>
                    <a
                      href={pdfUrl(inv.id, true)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Eye /> View
                    </a>
                  </Button>
                  {inv.status === "issued" && (
                    <Button
                      variant="ghost"
                      className="col-span-2 h-11 text-destructive"
                      onClick={() => confirmCancel(inv)}
                    >
                      <Ban /> Cancel invoice
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* tablet & desktop: table */}
          <Card className="hidden gap-0 overflow-hidden p-0 md:flex">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice no.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden lg:table-cell">State</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className={cn(inv.status === "cancelled" && "opacity-70")}
                  >
                    <TableCell className="font-medium text-night">
                      {inv.invoiceNo}
                    </TableCell>
                    <TableCell className="text-sm">
                      {invoiceDay(inv.invoiceDate)}
                    </TableCell>
                    <TableCell>
                      <p className="max-w-56 truncate font-medium text-night">
                        {inv.clientName}
                      </p>
                      {inv.clientGstin && (
                        <p className="text-xs text-muted-foreground">
                          {inv.clientGstin}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm lg:table-cell">
                      {inv.clientState}
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-medium">{rupees(inv.totalPaise)}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.igstPaise > 0 ? "IGST" : "CGST + SGST"} ·{" "}
                        {paymentMethodLabel(inv.paymentMethod)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={inv.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="View PDF"
                          title="View PDF"
                          asChild
                        >
                          <a
                            href={pdfUrl(inv.id, true)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Eye />
                          </a>
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Download PDF"
                          title="Download PDF"
                          onClick={() => downloadPdf(inv.id)}
                        >
                          <Download />
                        </Button>
                        {inv.status === "issued" && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive"
                            aria-label="Cancel invoice"
                            title="Cancel invoice"
                            onClick={() => confirmCancel(inv)}
                          >
                            <Ban />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <InvoiceDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function StatusPill({ status }: { status: Invoice["status"] }) {
  return status === "issued" ? (
    <Pill tone="green">Issued</Pill>
  ) : (
    <Pill tone="red">Cancelled</Pill>
  );
}

type Draft = {
  clientName: string;
  clientStateCode: string;
  amount: string;
  paymentMethod: PaymentMethod;
  clientAddress: string;
  clientMobile: string;
  clientGstin: string;
  description: string;
  invoiceDate: string;
};

const emptyDraft = (): Draft => ({
  clientName: "",
  clientStateCode: SELLER.stateCode,
  amount: "",
  paymentMethod: "bank",
  clientAddress: "",
  clientMobile: "",
  clientGstin: "",
  description: "",
  invoiceDate: todayIst(),
});

function InvoiceDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [d, setD] = useState<Draft>(emptyDraft);
  const qc = useQueryClient();
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));

  const amount = Number(d.amount);
  const validAmount = Number.isFinite(amount) && amount > 0;
  const split = validAmount
    ? splitGst(toPaise(amount), d.clientStateCode)
    : null;
  const gstin = d.clientGstin.trim().toUpperCase();

  const create = useMutation({
    mutationFn: (x: Draft) =>
      call(
        api.admin.invoices.post({
          clientName: x.clientName.trim(),
          clientStateCode:
            x.clientStateCode as (typeof GST_STATES)[number]["code"],
          amount: Number(x.amount),
          paymentMethod: x.paymentMethod,
          clientAddress: x.clientAddress.trim() || null,
          clientMobile: x.clientMobile.trim() || null,
          clientGstin: x.clientGstin.trim().toUpperCase() || null,
          description: x.description.trim() || null,
          invoiceDate: x.invoiceDate || null,
        }),
      ),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: ["admin", "invoices"] });
      toast.success(`Invoice ${inv.invoiceNo} created`, {
        action: { label: "Download PDF", onClick: () => downloadPdf(inv.id) },
        duration: 10_000,
      });
      setD(emptyDraft());
      onClose();
    },
    onError,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.clientName.trim()) return toast.error("Enter the client name");
    if (!d.clientStateCode) return toast.error("Select the client's state");
    if (!validAmount) return toast.error("Enter an amount greater than zero");
    if (!/^\d+(\.\d{1,2})?$/.test(d.amount.trim()))
      return toast.error("Amount can have at most 2 decimal places");
    if (amount > 100_000_000)
      return toast.error("Amount can't be more than ₹10,00,00,000");
    if (gstin && !GSTIN_REGEX.test(gstin))
      return toast.error("GSTIN must be a valid 15-character GST number");
    create.mutate(d);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>
            The invoice number is assigned automatically when you create it.
          </DialogDescription>
        </FormDialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <FormDialogBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Name (person / company)"
                htmlFor="inv-name"
                required
                className="sm:col-span-2"
              >
                <Input
                  id="inv-name"
                  value={d.clientName}
                  maxLength={160}
                  autoComplete="off"
                  onChange={(e) => set({ clientName: e.target.value })}
                />
              </Field>
              <Field label="State" htmlFor="inv-state" required>
                <AppSelect
                  id="inv-state"
                  className="w-full"
                  value={d.clientStateCode}
                  onValueChange={(v) => set({ clientStateCode: v })}
                  options={GST_STATES.map((s) => ({
                    value: s.code,
                    label: `${s.name} (${s.code})`,
                  }))}
                />
              </Field>
              <Field
                label="Amount received, incl. GST (₹)"
                htmlFor="inv-amount"
                required
              >
                <Input
                  id="inv-amount"
                  inputMode="decimal"
                  placeholder="e.g. 25000"
                  value={d.amount}
                  onChange={(e) =>
                    set({ amount: e.target.value.replace(/[^\d.]/g, "") })
                  }
                />
              </Field>
              <Field label="Payment method" required className="sm:col-span-2">
                <div
                  role="radiogroup"
                  aria-label="Payment method"
                  className="grid grid-cols-3 gap-2"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      role="radio"
                      aria-checked={d.paymentMethod === m.value}
                      onClick={() => set({ paymentMethod: m.value })}
                      className={cn(
                        "h-11 rounded-lg border-2 px-2 text-sm font-medium transition sm:h-10",
                        d.paymentMethod === m.value
                          ? "border-primary bg-accent/50 text-night"
                          : "border-border bg-white text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Mobile" htmlFor="inv-mobile">
                <Input
                  id="inv-mobile"
                  type="tel"
                  inputMode="tel"
                  maxLength={20}
                  value={d.clientMobile}
                  onChange={(e) => set({ clientMobile: e.target.value })}
                />
              </Field>
              <Field
                label="GST no."
                htmlFor="inv-gstin"
                hint="Only if the client is GST-registered."
              >
                <Input
                  id="inv-gstin"
                  maxLength={15}
                  autoCapitalize="characters"
                  placeholder="e.g. 03ABCDE1234F1Z5"
                  value={d.clientGstin}
                  aria-invalid={!!gstin && !GSTIN_REGEX.test(gstin)}
                  onChange={(e) =>
                    set({ clientGstin: e.target.value.toUpperCase() })
                  }
                />
              </Field>
              <Field
                label="Address"
                htmlFor="inv-address"
                className="sm:col-span-2"
              >
                <Textarea
                  id="inv-address"
                  rows={2}
                  maxLength={400}
                  value={d.clientAddress}
                  onChange={(e) => set({ clientAddress: e.target.value })}
                />
              </Field>
              <Field
                label="Description"
                htmlFor="inv-desc"
                hint="Leave blank to use the default."
              >
                <Input
                  id="inv-desc"
                  maxLength={300}
                  placeholder={DEFAULT_INVOICE_DESCRIPTION}
                  value={d.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </Field>
              <Field label="Invoice date" htmlFor="inv-date">
                <Input
                  id="inv-date"
                  type="date"
                  max={todayIst()}
                  value={d.invoiceDate}
                  onChange={(e) => set({ invoiceDate: e.target.value })}
                />
              </Field>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              {split ? (
                <dl className="space-y-1">
                  <Row
                    label="Taxable value"
                    value={rupees(split.taxablePaise)}
                  />
                  {split.intra ? (
                    <>
                      <Row label="CGST @ 9%" value={rupees(split.cgstPaise)} />
                      <Row label="SGST @ 9%" value={rupees(split.sgstPaise)} />
                    </>
                  ) : (
                    <Row label="IGST @ 18%" value={rupees(split.igstPaise)} />
                  )}
                  <Row
                    label="Total amount received"
                    value={rupees(split.totalPaise)}
                    strong
                  />
                </dl>
              ) : (
                <p className="text-muted-foreground">
                  Enter the amount to see the GST breakdown. Punjab clients pay
                  CGST + SGST, and other states pay IGST.
                </p>
              )}
            </div>
          </FormDialogBody>

          <FormDialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" disabled={create.isPending}>
              <FileText />
              {create.isPending ? "Creating…" : "Create invoice"}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-4",
        strong && "border-t pt-1 font-semibold text-night",
      )}
    >
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
