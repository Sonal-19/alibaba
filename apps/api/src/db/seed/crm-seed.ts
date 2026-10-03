import type { TX } from "$/db";
import {
  type AudienceSize,
  contactQueriesTable,
  followUpsTable,
  type LeadSource,
  type LeadStatus,
  leadActivitiesTable,
  leadNotesTable,
  leadsTable,
  type ShowBookingStatus,
  type ShowEventType,
  type ShowRequirement,
  showBookingsTable,
  type VenueType,
  waBroadcastListMembersTable,
  waBroadcastListsTable,
  waTemplatesTable,
} from "$/db/schema";
import { istDate } from "$/lib/utils/time";

const H = 3_600_000;
const D = 24 * H;

function istDayOffset(days: number) {
  return new Date(Date.now() + days * D).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

type LeadSeed = {
  name: string;
  phone: string;
  city: string;
  source: LeadSource;
  status: LeadStatus;
  priority?: "low" | "medium" | "high";
  tags: string[];
  daysAgo: number;
};

const leads: LeadSeed[] = [
  {
    name: "Gurjeet Sandhu",
    phone: "919814000101",
    city: "Jalandhar",
    source: "show_booking",
    status: "new",
    tags: ["show", "wedding", "jalandhar"],
    daysAgo: 1,
    priority: "high",
  },
  {
    name: "Dera Mela Committee, Nakodar",
    phone: "919814000102",
    city: "Nakodar",
    source: "show_booking",
    status: "contacted",
    tags: ["show", "dargah_mela", "nakodar"],
    daysAgo: 3,
    priority: "high",
  },
  {
    name: "Simran Gill",
    phone: "919814000103",
    city: "Ludhiana",
    source: "show_booking",
    status: "confirmed",
    tags: ["show", "wedding", "ludhiana"],
    daysAgo: 6,
    priority: "high",
  },
  {
    name: "Harpreet Dhillon",
    phone: "919814000104",
    city: "Kapurthala",
    source: "show_booking",
    status: "completed",
    tags: ["show", "sufi_mehfil", "kapurthala"],
    daysAgo: 21,
  },
  {
    name: "Punjabi Cultural Society UK",
    phone: "447700900105",
    city: "Birmingham",
    source: "show_booking",
    status: "follow_up",
    tags: ["show", "international_tour", "uk", "nri"],
    daysAgo: 4,
  },
  {
    name: "Navjot Randhawa",
    phone: "919814000106",
    city: "Amritsar",
    source: "query",
    status: "new",
    tags: ["query"],
    daysAgo: 0,
  },
  {
    name: "Lovely Professional University",
    phone: "919814000107",
    city: "Phagwara",
    source: "query",
    status: "follow_up",
    tags: ["query", "event", "college"],
    daysAgo: 5,
    priority: "high",
  },
  {
    name: "Rajinder Bedi",
    phone: "919814000108",
    city: "Delhi",
    source: "query",
    status: "contacted",
    tags: ["query", "event"],
    daysAgo: 8,
  },
  {
    name: "Amarjit Brar",
    phone: "14165550109",
    city: "Brampton",
    source: "query",
    status: "closed",
    tags: ["query", "nri"],
    daysAgo: 40,
    priority: "low",
  },
  {
    name: "Kulwant Sidhu",
    phone: "919814000110",
    city: "Bathinda",
    source: "whatsapp",
    status: "new",
    tags: ["whatsapp"],
    daysAgo: 2,
  },
  {
    name: "Tejinder Dhol Group",
    phone: "919814000111",
    city: "Ludhiana",
    source: "whatsapp",
    status: "contacted",
    tags: ["whatsapp", "musician"],
    daysAgo: 12,
  },
  {
    name: "Urs Committee, Hoshiarpur",
    phone: "919814000112",
    city: "Hoshiarpur",
    source: "event",
    status: "follow_up",
    tags: ["event"],
    daysAgo: 9,
  },
  {
    name: "Baljeet Mann",
    phone: "919814000113",
    city: "Moga",
    source: "manual",
    status: "completed",
    tags: ["show", "private_party"],
    daysAgo: 35,
  },
  {
    name: "Ravneet Bajwa",
    phone: "919814000114",
    city: "Chandigarh",
    source: "show_booking",
    status: "new",
    tags: ["show", "private_party", "chandigarh"],
    daysAgo: 0,
  },
  {
    name: "Royal Palace Resorts",
    phone: "919814000115",
    city: "Jalandhar",
    source: "show_booking",
    status: "confirmed",
    tags: ["show", "live_concert", "jalandhar"],
    daysAgo: 10,
  },
  {
    name: "Inderjit Chahal",
    phone: "919814000116",
    city: "Phagwara",
    source: "manual",
    status: "closed",
    tags: ["show"],
    daysAgo: 50,
    priority: "low",
  },
  {
    name: "Mehakdeep Grewal",
    phone: "919814000117",
    city: "Ludhiana",
    source: "query",
    status: "new",
    tags: ["query", "collab"],
    daysAgo: 1,
  },
  {
    name: "Punjab Folk Festival Trust",
    phone: "919814000118",
    city: "Patiala",
    source: "event",
    status: "contacted",
    tags: ["event", "festival"],
    daysAgo: 15,
  },
  {
    name: "Parminder Virk",
    phone: "919814000119",
    city: "Sangrur",
    source: "whatsapp",
    status: "follow_up",
    tags: ["whatsapp", "show"],
    daysAgo: 6,
  },
  {
    name: "Arsh Events",
    phone: "919814000120",
    city: "Ludhiana",
    source: "show_booking",
    status: "closed",
    tags: ["show", "corporate_event", "ludhiana"],
    daysAgo: 2,
  },
];

export async function crmSeed(tx: TX, adminId: number) {
  console.info("Seeding CRM data...");
  const inserted = await tx
    .insert(leadsTable)
    .values(
      leads.map((l) => ({
        name: l.name,
        phone: l.phone,
        city: l.city,
        source: l.source,
        status: l.status,
        priority: l.priority ?? "medium",
        tags: l.tags,
        assignedTo: adminId,
        createdAt: new Date(Date.now() - l.daysAgo * D - 3 * H),
        lastContactedAt:
          l.status === "new"
            ? null
            : new Date(Date.now() - Math.max(0, l.daysAgo - 1) * D),
      })),
    )
    .returning();
  const byName = new Map(inserted.map((l) => [l.name, l]));
  const lead = (name: string) => {
    const l = byName.get(name);
    if (!l) throw new Error(`seed lead ${name} missing`);
    return l;
  };

  // Activities: every lead gets a "created" entry.
  await tx.insert(leadActivitiesTable).values(
    inserted.map((l) => ({
      leadId: l.id,
      kind: "created" as const,
      message: `Lead created from ${l.source}`,
      createdAt: l.createdAt,
    })),
  );

  // Show bookings
  type B = {
    who: string;
    eventType: ShowEventType;
    subject: string;
    status: ShowBookingStatus;
    day: number;
    time: string;
    duration: number;
    venueType: VenueType;
    venueName?: string;
    address: string;
    state: string;
    audience: AudienceSize;
    requirements: ShowRequirement[];
    confirmed?: boolean;
    message?: string;
    remark?: string;
  };
  const bookings: B[] = [
    {
      who: "Gurjeet Sandhu",
      eventType: "wedding",
      subject: "Sangeet night for my brother's wedding",
      status: "new",
      day: 9,
      time: "20:00",
      duration: 3,
      venueType: "banquet_hall",
      venueName: "Club Cabana",
      address: "GT Road",
      state: "Punjab",
      audience: "100_500",
      requirements: ["need_sound_light", "full_band"],
      message: "Family loves Nachde Malang, please include it!",
    },
    {
      who: "Ravneet Bajwa",
      eventType: "private_party",
      subject: "Mom's 60th birthday mehfil",
      status: "new",
      day: 18,
      time: "19:00",
      duration: 2,
      venueType: "home",
      venueName: "Farmhouse",
      address: "Sector 8",
      state: "Chandigarh",
      audience: "under_100",
      requirements: ["sound_available"],
    },
    {
      who: "Dera Mela Committee, Nakodar",
      eventType: "dargah_mela",
      subject: "Annual mela Sufi night",
      status: "contacted",
      day: 30,
      time: "21:00",
      duration: 4,
      venueType: "dargah_shrine",
      venueName: "Dera Baba Murad Shah Ji",
      address: "Nakodar",
      state: "Punjab",
      audience: "2000_plus",
      requirements: ["stage_setup", "live_stream"],
      message: "Main night of the mela. Live stream on our page.",
    },
    {
      who: "Simran Gill",
      eventType: "wedding",
      subject: "Reception performance",
      status: "confirmed",
      day: 2,
      time: "20:30",
      duration: 3,
      venueType: "banquet_hall",
      venueName: "Park Plaza",
      address: "Ferozepur Road",
      state: "Punjab",
      audience: "500_2000",
      requirements: ["sound_available", "full_band"],
      confirmed: true,
      remark: "Band of 6 + sound engineer. Entry with dhol at 8:30.",
    },
    {
      who: "Royal Palace Resorts",
      eventType: "live_concert",
      subject: "Sufi Night open concert",
      status: "confirmed",
      day: 0,
      time: "19:30",
      duration: 3,
      venueType: "open_ground",
      venueName: "Royal Palace Lawns",
      address: "Nakodar Road",
      state: "Punjab",
      audience: "2000_plus",
      requirements: ["need_sound_light", "stage_setup"],
      confirmed: true,
    },
    {
      who: "Harpreet Dhillon",
      eventType: "sufi_mehfil",
      subject: "Thursday mehfil at our village",
      status: "completed",
      day: -14,
      time: "20:00",
      duration: 3,
      venueType: "open_ground",
      address: "Village Talwandi",
      state: "Punjab",
      audience: "500_2000",
      requirements: ["need_sound_light"],
      confirmed: true,
    },
    {
      who: "Punjabi Cultural Society UK",
      eventType: "international_tour",
      subject: "Vaisakhi show, Birmingham",
      status: "contacted",
      day: 45,
      time: "18:00",
      duration: 3,
      venueType: "auditorium",
      venueName: "Town Hall",
      address: "Victoria Square",
      state: "Other",
      audience: "500_2000",
      requirements: ["stage_setup", "full_band"],
    },
    {
      who: "Arsh Events",
      eventType: "corporate_event",
      subject: "Annual dealer meet entertainment",
      status: "declined",
      day: 3,
      time: "20:00",
      duration: 2,
      venueType: "banquet_hall",
      venueName: "Hyatt",
      address: "Ferozepur Road",
      state: "Punjab",
      audience: "100_500",
      requirements: [],
      remark:
        "Already booked at the Nakodar mela that day. Shared alternate dates.",
    },
  ];
  const bookingRows = await tx
    .insert(showBookingsTable)
    .values(
      bookings.map((b) => {
        const l = lead(b.who);
        const scheduledStart = b.confirmed
          ? istDate(istDayOffset(b.day), b.time)
          : null;
        return {
          leadId: l.id,
          name: l.name,
          phone: l.phone,
          whatsapp: l.phone,
          eventType: b.eventType,
          subject: b.subject,
          language: "either" as const,
          expectedAudience: b.audience,
          requirements: b.requirements,
          message: b.message ?? null,
          referralSource: "YouTube",
          eventDate: istDayOffset(b.day),
          startTime: b.time,
          durationHours: b.duration,
          scheduledStart,
          scheduledEnd: scheduledStart
            ? new Date(scheduledStart.getTime() + b.duration * H)
            : null,
          venueType: b.venueType,
          venueName: b.venueName ?? null,
          address: b.address,
          city: l.city ?? "",
          state: b.state,
          status: b.status,
          adminRemark: b.remark ?? null,
          createdAt: l.createdAt,
        };
      }),
    )
    .returning();
  await tx.insert(leadActivitiesTable).values(
    bookingRows.flatMap((b) => [
      {
        leadId: b.leadId as number,
        kind: "show_booking_received" as const,
        message: `Show request #${b.id}: ${b.subject} — ${b.city}`,
        createdAt: b.createdAt,
      },
      ...(b.status !== "new"
        ? [
            {
              leadId: b.leadId as number,
              kind: "show_booking_status" as const,
              message: `Show booking #${b.id} ${b.status}`,
              adminId,
              createdAt: new Date(b.createdAt.getTime() + 6 * H),
            },
          ]
        : []),
    ]),
  );

  // Contact queries
  const queries = [
    {
      who: "Navjot Randhawa",
      subject: "Mehfil at our gurdwara-side mela",
      message:
        "Sat Sri Akal ji, we want Sardar Ali ji for our village mela next month. Is he available?",
    },
    {
      who: "Lovely Professional University",
      subject: "College fest performance",
      message:
        "Our cultural committee invites Sardar Ali for the annual fest. Please share availability and rider.",
    },
    {
      who: "Rajinder Bedi",
      subject: "Wedding in Delhi",
      message:
        "Looking for a Sufi performance at a wedding in Delhi in December.",
    },
    {
      who: "Amarjit Brar",
      subject: "Canada tour",
      message:
        "Is there any plan for a Canada tour next year? We'd like to host a show in Brampton.",
    },
    {
      who: "Mehakdeep Grewal",
      subject: "Collaboration",
      message:
        "I'm a music producer and would love to collaborate on a Sufi track.",
    },
  ];
  await tx.insert(contactQueriesTable).values(
    queries.map((q, i) => {
      const l = lead(q.who);
      return {
        leadId: l.id,
        name: l.name,
        phone: l.phone,
        subject: q.subject,
        message: q.message,
        isRead: i > 1,
        createdAt: l.createdAt,
      };
    }),
  );
  await tx.insert(leadActivitiesTable).values(
    queries.map((q) => ({
      leadId: lead(q.who).id,
      kind: "query_received" as const,
      message: `Query: ${q.subject}`,
      createdAt: lead(q.who).createdAt,
    })),
  );

  // Remarks
  const notes: [string, string][] = [
    [
      "Dera Mela Committee, Nakodar",
      "Spoke to the committee. Main stage night, expect a very large crowd. Need stage plan by next week.",
    ],
    [
      "Simran Gill",
      "Reception confirmed. Band of 6 + sound engineer; family arranging stay.",
    ],
    [
      "Lovely Professional University",
      "Cultural head called. Wants confirmation within a week.",
    ],
    [
      "Harpreet Dhillon",
      "Mehfil done. Village shared the video on Facebook and tagged our page.",
    ],
    [
      "Rajinder Bedi",
      "Date clashes with a Jalandhar booking. Shared alternate dates.",
    ],
    [
      "Urs Committee, Hoshiarpur",
      "Annual urs, needs a late-night set on the 2nd Thursday.",
    ],
  ];
  await tx.insert(leadNotesTable).values(
    notes.map(([who, body], i) => ({
      leadId: lead(who).id,
      adminId,
      body,
      createdAt: new Date(Date.now() - (i + 1) * 20 * H),
    })),
  );

  // Follow-ups: overdue, today, upcoming, done
  const fu: [
    string,
    number,
    number,
    "call" | "whatsapp" | "visit" | "meeting",
    string,
    "pending" | "done",
  ][] = [
    [
      "Gurjeet Sandhu",
      0,
      11,
      "call",
      "Call back about sangeet night",
      "pending",
    ],
    [
      "Navjot Randhawa",
      0,
      16,
      "whatsapp",
      "Share available dates for mela",
      "pending",
    ],
    [
      "Lovely Professional University",
      -1,
      12,
      "call",
      "Confirm fest date and rider",
      "pending",
    ],
    [
      "Urs Committee, Hoshiarpur",
      -2,
      10,
      "meeting",
      "Meet committee at Hoshiarpur",
      "pending",
    ],
    [
      "Dera Mela Committee, Nakodar",
      1,
      11,
      "call",
      "Confirm stage plan and timing",
      "pending",
    ],
    [
      "Parminder Virk",
      2,
      17,
      "whatsapp",
      "Send Book a Show form link",
      "pending",
    ],
    [
      "Punjabi Cultural Society UK",
      3,
      12,
      "call",
      "Discuss UK visa and travel",
      "pending",
    ],
    ["Kulwant Sidhu", 4, 10, "whatsapp", "Share upcoming show list", "pending"],
    [
      "Punjab Folk Festival Trust",
      6,
      15,
      "visit",
      "Visit festival venue",
      "pending",
    ],
    ["Mehakdeep Grewal", 1, 18, "call", "Reply about collaboration", "pending"],
    ["Harpreet Dhillon", -10, 12, "call", "Feedback on mehfil", "done"],
    ["Tejinder Dhol Group", -5, 11, "whatsapp", "Sent show schedule", "done"],
  ];
  await tx.insert(followUpsTable).values(
    fu.map(([who, day, hour, type, title, status]) => ({
      leadId: lead(who).id,
      dueAt: istDate(istDayOffset(day), `${String(hour).padStart(2, "0")}:00`),
      type,
      title,
      status,
      completedAt:
        status === "done" ? istDate(istDayOffset(day), "18:00") : null,
    })),
  );

  // WhatsApp templates & lists
  await tx.insert(waTemplatesTable).values([
    {
      name: "Festival greetings",
      category: "broadcast",
      body: "Sat Sri Akal {{name}} ji 🙏\n\nWishing you and your family a blessed festival! Catch Sardar Ali live this week.\n{{link}}",
    },
    {
      name: "Show request follow-up",
      category: "followup",
      body: "Sat Sri Akal {{name}} ji 🙏 Thank you for your interest in booking Sardar Ali. When is a good time to call and plan the show?",
    },
    {
      name: "Share new release",
      category: "share",
      body: "Sat Sri Akal {{name}} ji 🙏 Sardar Ali's new song is out now. Please listen and share:\n{{link}}",
    },
    {
      name: "Show reminder",
      category: "followup",
      body: "Sat Sri Akal {{name}} ji 🙏 A reminder that Sardar Ali and the band will reach your venue tomorrow. Please share the exact location pin and a contact person on WhatsApp.",
    },
  ]);
  const lists = await tx
    .insert(waBroadcastListsTable)
    .values([
      {
        name: "Musicians & Crew",
        description: "Band members, dhol groups and sound crew we work with",
      },
      {
        name: "Show Hosts",
        description: "Families, committees and organisers who booked a show",
      },
      {
        name: "Mela & Event Updates",
        description: "Committees, fans and event contacts",
      },
    ])
    .returning();
  const [crew, hosts, events] = lists;
  const members: { listId: number; leadId: number }[] = [];
  for (const l of inserted) {
    if (crew && l.tags.includes("musician"))
      members.push({ listId: crew.id, leadId: l.id });
    if (hosts && l.tags.includes("show"))
      members.push({ listId: hosts.id, leadId: l.id });
    if (events && (l.tags.includes("event") || l.tags.includes("query")))
      members.push({ listId: events.id, leadId: l.id });
  }
  if (members.length)
    await tx.insert(waBroadcastListMembersTable).values(members);
}
