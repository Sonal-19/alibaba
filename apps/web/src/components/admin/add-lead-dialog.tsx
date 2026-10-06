import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppSelect } from "@/components/common/app-select";
import { Field } from "@/components/common/field";
import {
  FormDialogBody,
  FormDialogContent,
  FormDialogFooter,
  FormDialogHeader,
} from "@/components/common/form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, callMsg } from "@/lib/api";
import { titleCase } from "@/lib/utils";
import {
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  type LeadPriority,
  type LeadSource,
} from "./lead-constants";

export function AddLeadDialog() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    source: "manual" as LeadSource,
    priority: "medium" as LeadPriority,
    tags: "",
  });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: () =>
      callMsg(
        api.admin.leads.post({
          ...f,
          email: f.email || undefined,
          city: f.city || undefined,
          tags: f.tags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
        }),
      ),
    onSuccess: ({ data, message }) => {
      toast.success(message);
      qc.invalidateQueries({ queryKey: ["admin"] });
      setOpen(false);
      if (data)
        navigate({ to: "/admin/leads/$id", params: { id: String(data.id) } });
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Add lead
        </Button>
      </DialogTrigger>
      <FormDialogContent>
        <FormDialogHeader>
          <DialogTitle>New lead</DialogTitle>
        </FormDialogHeader>
        <FormDialogBody>
          <form
            id="add-lead"
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <Field label="Name" required>
              <Input
                required
                minLength={2}
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
            </Field>
            <Field label="Phone / WhatsApp" required>
              <Input
                required
                minLength={10}
                value={f.phone}
                onChange={(e) => setF({ ...f, phone: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
            </Field>
            <Field label="City">
              <Input
                value={f.city}
                onChange={(e) => setF({ ...f, city: e.target.value })}
              />
            </Field>
            <Field label="Source">
              <AppSelect
                className="w-full"
                value={f.source}
                onValueChange={(v) => setF({ ...f, source: v as LeadSource })}
                options={LEAD_SOURCES.map((s) => ({
                  value: s,
                  label: titleCase(s),
                }))}
              />
            </Field>
            <Field label="Priority">
              <AppSelect
                className="w-full"
                value={f.priority}
                onValueChange={(v) =>
                  setF({ ...f, priority: v as LeadPriority })
                }
                options={LEAD_PRIORITIES.map((s) => ({
                  value: s,
                  label: titleCase(s),
                }))}
              />
            </Field>
            <Field
              label="Tags"
              hint="Comma separated, e.g. raagi, event"
              className="sm:col-span-2"
            >
              <Input
                value={f.tags}
                onChange={(e) => setF({ ...f, tags: e.target.value })}
              />
            </Field>
          </form>
        </FormDialogBody>
        <FormDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-lead" disabled={create.isPending}>
            Create lead
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </Dialog>
  );
}
