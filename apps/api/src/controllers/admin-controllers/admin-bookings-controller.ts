import { and, desc, eq, gt, gte, ilike, lt, lte, ne, or } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import {
  followUpsTable,
  type LeadStatus,
  leadsTable,
  showBookingStatuses,
  showBookingsTable,
  showEventTypes,
} from "$/db/schema";
import { leadService } from "$/lib/services/lead-service";
import { fail, ok } from "$/lib/utils";
import { tEnum } from "$/lib/utils/schema";
import { IST_TZ, istTime } from "$/lib/utils/time";
import { protectedAdmin } from "$/pre-processor";

/** Moving a booking forward also moves its lead through the pipeline. */
const LEAD_STATUS_FOR: Partial<Record<string, LeadStatus>> = {
  contacted: "contacted",
  confirmed: "confirmed",
  completed: "completed",
  declined: "closed",
};

/** Gap the team needs between two shows (travel + setup). */
const TRAVEL_BUFFER_MS = 2 * 3_600_000;

export const adminBookingsController = new Elysia({
  name: "admin_bookings_controller",
  prefix: "/bookings",
})
  .use(protectedAdmin)
  .get(
    "/",
    async ({ query }) => {
      const s = query.search?.trim();
      const rows = await db
        .select()
        .from(showBookingsTable)
        .where(
          and(
            query.status
              ? eq(showBookingsTable.status, query.status)
              : undefined,
            query.eventType
              ? eq(showBookingsTable.eventType, query.eventType)
              : undefined,
            query.from
              ? gte(showBookingsTable.eventDate, query.from)
              : undefined,
            query.to ? lte(showBookingsTable.eventDate, query.to) : undefined,
            s
              ? or(
                  ilike(showBookingsTable.name, `%${s}%`),
                  ilike(showBookingsTable.phone, `%${s}%`),
                  ilike(showBookingsTable.city, `%${s}%`),
                  ilike(showBookingsTable.subject, `%${s}%`),
                )
              : undefined,
          ),
        )
        .orderBy(desc(showBookingsTable.createdAt))
        .limit(300);
      return ok(rows);
    },
    {
      query: t.Object({
        status: t.Optional(tEnum(showBookingStatuses)),
        eventType: t.Optional(tEnum(showEventTypes)),
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
        search: t.Optional(t.String()),
      }),
    },
  )
  .get("/:id", async ({ params, status }) => {
    const [row] = await db
      .select()
      .from(showBookingsTable)
      .where(eq(showBookingsTable.id, Number(params.id)))
      .limit(1);
    if (!row) return status(404, fail("Booking not found"));
    return ok(row);
  })
  .patch(
    "/:id/status",
    async ({ params, body, admin, status }) => {
      const id = Number(params.id);
      const [b] = await db
        .select()
        .from(showBookingsTable)
        .where(eq(showBookingsTable.id, id))
        .limit(1);
      if (!b) return status(404, fail("Booking not found"));

      let scheduledStart = b.scheduledStart;
      let scheduledEnd = b.scheduledEnd;
      const durationHours = body.durationHours ?? b.durationHours;
      let warning: string | null = null;

      if (body.status === "declined" && !body.adminRemark?.trim()) {
        return status(400, fail("Add a remark explaining why it was declined"));
      }

      if (body.status === "confirmed") {
        if (!body.scheduledStart) {
          return status(400, fail("Pick the program date and time to confirm"));
        }
        scheduledStart = new Date(body.scheduledStart);
        scheduledEnd = new Date(
          scheduledStart.getTime() + durationHours * 3_600_000,
        );
        // The team can do two shows a day, so an overlap is a warning only.
        const [clash] = await db
          .select({
            id: showBookingsTable.id,
            city: showBookingsTable.city,
            start: showBookingsTable.scheduledStart,
            end: showBookingsTable.scheduledEnd,
          })
          .from(showBookingsTable)
          .where(
            and(
              ne(showBookingsTable.id, id),
              eq(showBookingsTable.status, "confirmed"),
              lt(
                showBookingsTable.scheduledStart,
                new Date(scheduledEnd.getTime() + TRAVEL_BUFFER_MS),
              ),
              gt(
                showBookingsTable.scheduledEnd,
                new Date(scheduledStart.getTime() - TRAVEL_BUFFER_MS),
              ),
            ),
          )
          .limit(1);
        if (clash?.start && clash.end) {
          warning = `Close to program #${clash.id} in ${clash.city} (${istTime(clash.start)}–${istTime(clash.end)}). Check travel time.`;
        }
      }

      const [row] = await db
        .update(showBookingsTable)
        .set({
          status: body.status,
          durationHours,
          scheduledStart,
          scheduledEnd,
          adminRemark: body.adminRemark ?? b.adminRemark,
        })
        .where(eq(showBookingsTable.id, id))
        .returning();

      if (b.leadId) {
        const when =
          body.status === "confirmed" && scheduledStart
            ? ` for ${scheduledStart.toLocaleString("en-IN", { timeZone: IST_TZ, dateStyle: "medium", timeStyle: "short" })}`
            : "";
        await leadService.log(
          b.leadId,
          "show_booking_status",
          `Show booking #${id} ${body.status}${when}${body.adminRemark ? ` — ${body.adminRemark}` : ""}`,
          admin.id,
        );
        const nextLeadStatus = LEAD_STATUS_FOR[body.status];
        if (nextLeadStatus) {
          await db
            .update(leadsTable)
            .set({ status: nextLeadStatus })
            .where(eq(leadsTable.id, b.leadId));
        }
        if (body.status === "confirmed" && scheduledStart) {
          // Replace any previous program reminder for this booking.
          await db
            .delete(followUpsTable)
            .where(
              and(
                eq(followUpsTable.leadId, b.leadId),
                eq(followUpsTable.type, "program"),
                eq(followUpsTable.status, "pending"),
                ilike(followUpsTable.title, `%#${id}%`),
              ),
            );
          await db.insert(followUpsTable).values({
            leadId: b.leadId,
            dueAt: new Date(scheduledStart.getTime() - 86_400_000),
            type: "program",
            title: `Confirm arrangements for show #${id} tomorrow (${b.city})`,
          });
        }
      }
      return ok({ ...row, warning }, warning ?? "Booking updated");
    },
    {
      body: t.Object({
        status: tEnum(showBookingStatuses),
        scheduledStart: t.Optional(t.String()),
        durationHours: t.Optional(t.Number({ minimum: 1, maximum: 12 })),
        adminRemark: t.Optional(t.String()),
      }),
    },
  )
  .delete("/:id", async ({ params, status }) => {
    const [row] = await db
      .delete(showBookingsTable)
      .where(eq(showBookingsTable.id, Number(params.id)))
      .returning({ id: showBookingsTable.id });
    if (!row) return status(404, fail("Booking not found"));
    return ok(row, "Booking deleted");
  });
