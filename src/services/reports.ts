import {
  getDatabase,
  initializeDatabase,
} from "../database/database";
import {
  requireOfficialAccess,
} from "./access";

export type ProjectReportStatus =
  | "Planned"
  | "Ongoing"
  | "Completed"
  | "Cancelled";

export type ProjectReportRow = {
  id: string;
  title: string;
  status: ProjectReportStatus;
  budget: number;
  expenses: number;
  remaining: number;
  startDate: string | null;
  endDate: string | null;
  isArchived: boolean;
};

type ProjectReportDbRow = {
  id: string;
  title: string;
  status: string;
  budget: number;
  expenses: number;
  start_date: string | null;
  end_date: string | null;
  is_archived: number;
};

export type ProjectsReportSummary = {
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  plannedCount: number;
  ongoingCount: number;
  completedCount: number;
  cancelledCount: number;
  totalBudget: number;
  totalExpenses: number;
  totalRemaining: number;
};

function normalizeProjectStatus(
  value: string
): ProjectReportStatus {
  switch (value) {
    case "Ongoing":
    case "Completed":
    case "Cancelled":
      return value;

    default:
      return "Planned";
  }
}

export async function getProjectsReport(): Promise<{
  rows: ProjectReportRow[];
  summary: ProjectsReportSummary;
}> {
  await requireOfficialAccess();
  await initializeDatabase();
  const db = await getDatabase();

  const dbRows =
    await db.getAllAsync<ProjectReportDbRow>(
      `
        SELECT
          p.id,
          p.title,
          p.status,
          COALESCE(p.budget, 0) AS budget,
          COALESCE(
            SUM(e.amount),
            0
          ) AS expenses,
          p.start_date,
          p.end_date,
          COALESCE(
            p.is_archived,
            0
          ) AS is_archived
        FROM projects p
        LEFT JOIN expenses e
          ON e.project_id = p.id
        GROUP BY
          p.id,
          p.title,
          p.status,
          p.budget,
          p.start_date,
          p.end_date,
          p.is_archived
        ORDER BY
          p.is_archived ASC,
          CASE p.status
            WHEN 'Ongoing' THEN 0
            WHEN 'Planned' THEN 1
            WHEN 'Completed' THEN 2
            WHEN 'Cancelled' THEN 3
            ELSE 4
          END ASC,
          p.created_at DESC
      `
    );

  const rows =
    dbRows.map(
      (row): ProjectReportRow => {
        const budget =
          Number(row.budget) || 0;

        const expenses =
          Number(row.expenses) || 0;

        return {
          id: row.id,
          title: row.title,
          status:
            normalizeProjectStatus(
              row.status
            ),
          budget,
          expenses,
          remaining:
            budget - expenses,
          startDate:
            row.start_date,
          endDate:
            row.end_date,
          isArchived:
            Number(
              row.is_archived
            ) === 1,
        };
      }
    );

  const summary =
    rows.reduce<ProjectsReportSummary>(
      (current, row) => {
        current.totalProjects += 1;

        if (row.isArchived) {
          current.archivedProjects += 1;
        } else {
          current.activeProjects += 1;
        }

        switch (row.status) {
          case "Ongoing":
            current.ongoingCount += 1;
            break;

          case "Completed":
            current.completedCount += 1;
            break;

          case "Cancelled":
            current.cancelledCount += 1;
            break;

          default:
            current.plannedCount += 1;
            break;
        }

        current.totalBudget +=
          row.budget;

        current.totalExpenses +=
          row.expenses;

        current.totalRemaining +=
          row.remaining;

        return current;
      },
      {
        totalProjects: 0,
        activeProjects: 0,
        archivedProjects: 0,
        plannedCount: 0,
        ongoingCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        totalBudget: 0,
        totalExpenses: 0,
        totalRemaining: 0,
      }
    );

  return {
    rows,
    summary,
  };
}

export type ReportType =
  | "projects"
  | "budget"
  | "expenses"
  | "youth"
  | "meetings"
  | "attendance"
  | "inventory"
  | "activities";

export type ReportMetric = {
  label: string;
  value: string;
};

export type ReportSection = {
  title: string;
  columns: string[];
  rows: string[][];
};

export type GeneratedReport = {
  type: ReportType;
  title: string;
  subtitle: string;
  summary: ReportMetric[];
  sections: ReportSection[];
};

function formatReportMoney(
  value: number
) {
  return `₱${value.toLocaleString(
    "en-PH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatReportDate(
  value: string | null
) {
  if (!value) {
    return "Not set";
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return value;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function calculateAgeFromBirthday(
  birthday: string | null
) {
  if (!birthday) {
    return null;
  }

  const match = birthday.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const birthDate = new Date(
    year,
    month - 1,
    day
  );

  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !==
      month - 1 ||
    birthDate.getDate() !== day
  ) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    year;

  const monthDifference =
    today.getMonth() -
    (month - 1);

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < day
    )
  ) {
    age -= 1;
  }

  return age >= 0
    ? age
    : null;
}

function incrementCount(
  map: Map<string, number>,
  rawValue: string | null,
  fallback: string
) {
  const value =
    rawValue?.trim() ||
    fallback;

  map.set(
    value,
    (map.get(value) || 0) + 1
  );
}

async function buildProjectsGeneratedReport():
  Promise<GeneratedReport> {
  const report =
    await getProjectsReport();

  return {
    type: "projects",
    title: "Projects Report",
    subtitle:
      "Project status, recorded budgets, project-linked expenses and balances.",
    summary: [
      {
        label: "Total Projects",
        value: String(
          report.summary.totalProjects
        ),
      },
      {
        label: "Active Projects",
        value: String(
          report.summary.activeProjects
        ),
      },
      {
        label: "Archived Projects",
        value: String(
          report.summary.archivedProjects
        ),
      },
      {
        label: "Planned",
        value: String(
          report.summary.plannedCount
        ),
      },
      {
        label: "Ongoing",
        value: String(
          report.summary.ongoingCount
        ),
      },
      {
        label: "Completed",
        value: String(
          report.summary.completedCount
        ),
      },
      {
        label: "Cancelled",
        value: String(
          report.summary.cancelledCount
        ),
      },
      {
        label: "Recorded Budget",
        value: formatReportMoney(
          report.summary.totalBudget
        ),
      },
      {
        label: "Project Expenses",
        value: formatReportMoney(
          report.summary.totalExpenses
        ),
      },
      {
        label: "Remaining",
        value: formatReportMoney(
          report.summary.totalRemaining
        ),
      },
    ],
    sections: [
      {
        title: "Project Records",
        columns: [
          "Project",
          "Status",
          "Period",
          "Budget",
          "Expenses",
          "Remaining",
        ],
        rows: report.rows.map(
          (row) => [
            row.title,
            row.isArchived
              ? `${row.status} • Archived`
              : row.status,
            `${formatReportDate(
              row.startDate
            )} → ${formatReportDate(
              row.endDate
            )}`,
            formatReportMoney(
              row.budget
            ),
            formatReportMoney(
              row.expenses
            ),
            formatReportMoney(
              row.remaining
            ),
          ]
        ),
      },
    ],
  };
}

async function buildBudgetReport():
  Promise<GeneratedReport> {
  await initializeDatabase();
  const db = await getDatabase();

  type CategoryRow = {
    id: string;
    name: string;
    allocated: number;
    spent: number;
  };

  type AllocationRow = {
    title: string;
    amount: number;
    fiscal_year: number | null;
    category_name: string | null;
    project_title: string | null;
  };

  const categories =
    await db.getAllAsync<CategoryRow>(
      `
        SELECT
          c.id,
          c.name,
          COALESCE(
            (
              SELECT SUM(ba.amount)
              FROM budget_allocations ba
              WHERE ba.category_id = c.id
            ),
            0
          ) AS allocated,
          COALESCE(
            (
              SELECT SUM(e.amount)
              FROM expenses e
              WHERE e.category_id = c.id
            ),
            0
          ) AS spent
        FROM budget_categories c
        ORDER BY
          c.name COLLATE NOCASE ASC
      `
    );

  const allocations =
    await db.getAllAsync<AllocationRow>(
      `
        SELECT
          ba.title,
          ba.amount,
          ba.fiscal_year,
          c.name AS category_name,
          p.title AS project_title
        FROM budget_allocations ba
        LEFT JOIN budget_categories c
          ON c.id = ba.category_id
        LEFT JOIN projects p
          ON p.id = ba.project_id
        ORDER BY
          COALESCE(
            ba.fiscal_year,
            0
          ) DESC,
          ba.created_at DESC
      `
    );

  const totals =
    await db.getFirstAsync<{
      allocated: number;
      spent: number;
      allocation_count: number;
    }>(
      `
        SELECT
          COALESCE(
            (
              SELECT SUM(amount)
              FROM budget_allocations
            ),
            0
          ) AS allocated,
          COALESCE(
            (
              SELECT SUM(amount)
              FROM expenses
            ),
            0
          ) AS spent,
          (
            SELECT COUNT(*)
            FROM budget_allocations
          ) AS allocation_count
      `
    );

  const uncategorized =
    await db.getFirstAsync<{
      allocated: number;
      spent: number;
    }>(
      `
        SELECT
          COALESCE(
            (
              SELECT SUM(amount)
              FROM budget_allocations
              WHERE category_id IS NULL
            ),
            0
          ) AS allocated,
          COALESCE(
            (
              SELECT SUM(amount)
              FROM expenses
              WHERE category_id IS NULL
            ),
            0
          ) AS spent
      `
    );

  const categoryRows =
    categories.map(
      (category) => {
        const allocated =
          Number(
            category.allocated
          ) || 0;

        const spent =
          Number(
            category.spent
          ) || 0;

        return [
          category.name,
          formatReportMoney(
            allocated
          ),
          formatReportMoney(
            spent
          ),
          formatReportMoney(
            allocated - spent
          ),
        ];
      }
    );

  const uncategorizedAllocated =
    Number(
      uncategorized?.allocated
    ) || 0;

  const uncategorizedSpent =
    Number(
      uncategorized?.spent
    ) || 0;

  if (
    uncategorizedAllocated !== 0 ||
    uncategorizedSpent !== 0
  ) {
    categoryRows.push([
      "Uncategorized",
      formatReportMoney(
        uncategorizedAllocated
      ),
      formatReportMoney(
        uncategorizedSpent
      ),
      formatReportMoney(
        uncategorizedAllocated -
          uncategorizedSpent
      ),
    ]);
  }

  const totalAllocated =
    Number(
      totals?.allocated
    ) || 0;

  const totalSpent =
    Number(
      totals?.spent
    ) || 0;

  return {
    type: "budget",
    title: "Budget Report",
    subtitle:
      "Budget allocations, category spending and remaining balances.",
    summary: [
      {
        label: "Allocation Records",
        value: String(
          Number(
            totals?.allocation_count
          ) || 0
        ),
      },
      {
        label: "Total Allocated",
        value: formatReportMoney(
          totalAllocated
        ),
      },
      {
        label: "Total Expenses",
        value: formatReportMoney(
          totalSpent
        ),
      },
      {
        label: "Remaining Balance",
        value: formatReportMoney(
          totalAllocated -
            totalSpent
        ),
      },
    ],
    sections: [
      {
        title: "Category Balances",
        columns: [
          "Category",
          "Allocated",
          "Expenses",
          "Remaining",
        ],
        rows: categoryRows,
      },
      {
        title: "Allocation Records",
        columns: [
          "Allocation",
          "Category",
          "Project",
          "Fiscal Year",
          "Amount",
        ],
        rows: allocations.map(
          (row) => [
            row.title,
            row.category_name ||
              "Uncategorized",
            row.project_title ||
              "None",
            row.fiscal_year == null
              ? "Not set"
              : String(
                  row.fiscal_year
                ),
            formatReportMoney(
              Number(
                row.amount
              ) || 0
            ),
          ]
        ),
      },
    ],
  };
}

async function buildExpensesReport():
  Promise<GeneratedReport> {
  await initializeDatabase();
  const db = await getDatabase();

  type ExpenseRow = {
    title: string;
    amount: number;
    expense_date: string | null;
    category_name: string | null;
    project_title: string | null;
    activity_title: string | null;
    receipt_uri: string | null;
  };

  const rows =
    await db.getAllAsync<ExpenseRow>(
      `
        SELECT
          e.title,
          e.amount,
          e.expense_date,
          c.name AS category_name,
          p.title AS project_title,
          a.title AS activity_title,
          e.receipt_uri
        FROM expenses e
        LEFT JOIN budget_categories c
          ON c.id = e.category_id
        LEFT JOIN projects p
          ON p.id = e.project_id
        LEFT JOIN activities a
          ON a.id = e.activity_id
        ORDER BY
          COALESCE(
            e.expense_date,
            e.created_at
          ) DESC,
          e.created_at DESC
      `
    );

  const totalAmount =
    rows.reduce(
      (total, row) =>
        total +
        (Number(row.amount) || 0),
      0
    );

  const receiptCount =
    rows.filter(
      (row) =>
        Boolean(row.receipt_uri)
    ).length;

  const projectLinked =
    rows.filter(
      (row) =>
        Boolean(
          row.project_title
        )
    ).length;

  const activityLinked =
    rows.filter(
      (row) =>
        Boolean(
          row.activity_title
        )
    ).length;

  return {
    type: "expenses",
    title: "Expenses Report",
    subtitle:
      "Central Finance expense records, categories and linked records.",
    summary: [
      {
        label: "Expense Records",
        value: String(
          rows.length
        ),
      },
      {
        label: "Total Expenses",
        value: formatReportMoney(
          totalAmount
        ),
      },
      {
        label: "With Receipt",
        value: String(
          receiptCount
        ),
      },
      {
        label: "Linked to Projects",
        value: String(
          projectLinked
        ),
      },
      {
        label: "Linked to Activities",
        value: String(
          activityLinked
        ),
      },
    ],
    sections: [
      {
        title: "Expense Records",
        columns: [
          "Expense",
          "Date",
          "Category",
          "Linked Record",
          "Amount",
          "Receipt",
        ],
        rows: rows.map(
          (row) => [
            row.title,
            formatReportDate(
              row.expense_date
            ),
            row.category_name ||
              "Uncategorized",
            row.project_title
              ? `Project: ${row.project_title}`
              : row.activity_title
              ? `Activity: ${row.activity_title}`
              : "None",
            formatReportMoney(
              Number(
                row.amount
              ) || 0
            ),
            row.receipt_uri
              ? "Attached"
              : "None",
          ]
        ),
      },
    ],
  };
}

async function buildYouthReport():
  Promise<GeneratedReport> {
  await initializeDatabase();
  const db = await getDatabase();

  type YouthReportRow = {
    birthday: string | null;
    sex: string | null;
    purok_sitio: string | null;
    youth_classification: string | null;
  };

  const rows =
    await db.getAllAsync<YouthReportRow>(
      `
        SELECT
          birthday,
          sex,
          purok_sitio,
          youth_classification
        FROM youth
        ORDER BY
          full_name COLLATE NOCASE ASC
      `
    );

  const sexCounts =
    new Map<string, number>();

  const purokCounts =
    new Map<string, number>();

  const classificationCounts =
    new Map<string, number>();

  let age15to17 = 0;
  let age18to24 = 0;
  let age25to30 = 0;
  let ageOutside = 0;
  let ageNotSet = 0;

  for (const row of rows) {
    const age =
      calculateAgeFromBirthday(
        row.birthday
      );

    if (age == null) {
      ageNotSet += 1;
    } else if (
      age >= 15 &&
      age <= 17
    ) {
      age15to17 += 1;
    } else if (
      age >= 18 &&
      age <= 24
    ) {
      age18to24 += 1;
    } else if (
      age >= 25 &&
      age <= 30
    ) {
      age25to30 += 1;
    } else {
      ageOutside += 1;
    }

    incrementCount(
      sexCounts,
      row.sex,
      "Not set"
    );

    incrementCount(
      purokCounts,
      row.purok_sitio,
      "Not set"
    );

    incrementCount(
      classificationCounts,
      row.youth_classification,
      "Not set"
    );
  }

  const mapRows = (
    map: Map<string, number>
  ) =>
    [...map.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1] ||
          a[0].localeCompare(
            b[0]
          )
      )
      .map(
        ([label, count]) => [
          label,
          String(count),
          rows.length > 0
            ? `${(
                (count /
                  rows.length) *
                100
              ).toFixed(1)}%`
            : "0.0%",
        ]
      );

  return {
    type: "youth",
    title: "Youth Registry Report",
    subtitle:
      "Aggregate youth registry statistics without listing personal contact details.",
    summary: [
      {
        label: "Registered Youth",
        value: String(
          rows.length
        ),
      },
      {
        label: "Age 15–17",
        value: String(
          age15to17
        ),
      },
      {
        label: "Age 18–24",
        value: String(
          age18to24
        ),
      },
      {
        label: "Age 25–30",
        value: String(
          age25to30
        ),
      },
      {
        label: "Age Not Set",
        value: String(
          ageNotSet
        ),
      },
      {
        label: "Outside 15–30",
        value: String(
          ageOutside
        ),
      },
      {
        label: "Purok/Sitio Count",
        value: String(
          [...purokCounts.keys()]
            .filter(
              (key) =>
                key !== "Not set"
            ).length
        ),
      },
    ],
    sections: [
      {
        title: "Sex Distribution",
        columns: [
          "Sex",
          "Count",
          "Percent",
        ],
        rows: mapRows(
          sexCounts
        ),
      },
      {
        title: "Purok/Sitio Distribution",
        columns: [
          "Purok/Sitio",
          "Count",
          "Percent",
        ],
        rows: mapRows(
          purokCounts
        ),
      },
      {
        title: "Youth Classification",
        columns: [
          "Classification",
          "Count",
          "Percent",
        ],
        rows: mapRows(
          classificationCounts
        ),
      },
    ],
  };
}

async function buildMeetingsReport():
  Promise<GeneratedReport> {
  await initializeDatabase();
  const db = await getDatabase();

  type MeetingRow = {
    title: string;
    meeting_date: string;
    status: string;
    attendance_count: number;
    present_count: number;
    resolution_count: number;
    has_agenda: number;
    has_minutes: number;
  };

  const rows =
    await db.getAllAsync<MeetingRow>(
      `
        SELECT
          m.title,
          m.meeting_date,
          m.status,
          (
            SELECT COUNT(*)
            FROM meeting_attendance ma
            WHERE ma.meeting_id = m.id
          ) AS attendance_count,
          (
            SELECT COUNT(*)
            FROM meeting_attendance ma
            WHERE ma.meeting_id = m.id
              AND ma.attendance_status = 'Present'
          ) AS present_count,
          (
            SELECT COUNT(*)
            FROM meeting_resolutions mr
            WHERE mr.meeting_id = m.id
          ) AS resolution_count,
          CASE
            WHEN TRIM(
              COALESCE(
                m.agenda,
                ''
              )
            ) <> ''
            THEN 1
            ELSE 0
          END AS has_agenda,
          CASE
            WHEN TRIM(
              COALESCE(
                m.minutes,
                ''
              )
            ) <> ''
            THEN 1
            ELSE 0
          END AS has_minutes
        FROM meetings m
        ORDER BY
          m.meeting_date DESC,
          m.created_at DESC
      `
    );

  const statusCounts =
    new Map<string, number>();

  let attendanceTotal = 0;
  let presentTotal = 0;
  let resolutionTotal = 0;
  let agendaCount = 0;
  let minutesCount = 0;

  for (const row of rows) {
    incrementCount(
      statusCounts,
      row.status,
      "Scheduled"
    );

    attendanceTotal +=
      Number(
        row.attendance_count
      ) || 0;

    presentTotal +=
      Number(
        row.present_count
      ) || 0;

    resolutionTotal +=
      Number(
        row.resolution_count
      ) || 0;

    agendaCount +=
      Number(row.has_agenda) ||
      0;

    minutesCount +=
      Number(row.has_minutes) ||
      0;
  }

  const statusRows =
    [...statusCounts.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .map(
        ([status, count]) => [
          status,
          String(count),
        ]
      );

  return {
    type: "meetings",
    title: "Meetings Report",
    subtitle:
      "Meeting status, attendance, agenda, minutes and resolutions.",
    summary: [
      {
        label: "Meetings",
        value: String(
          rows.length
        ),
      },
      {
        label: "Attendance Records",
        value: String(
          attendanceTotal
        ),
      },
      {
        label: "Present Records",
        value: String(
          presentTotal
        ),
      },
      {
        label: "With Agenda",
        value: String(
          agendaCount
        ),
      },
      {
        label: "With Minutes",
        value: String(
          minutesCount
        ),
      },
      {
        label: "Resolutions",
        value: String(
          resolutionTotal
        ),
      },
    ],
    sections: [
      {
        title: "Meeting Status",
        columns: [
          "Status",
          "Count",
        ],
        rows: statusRows,
      },
      {
        title: "Meeting Records",
        columns: [
          "Meeting",
          "Date",
          "Status",
          "Attendance",
          "Present",
          "Resolutions",
          "Agenda",
          "Minutes",
        ],
        rows: rows.map(
          (row) => [
            row.title,
            formatReportDate(
              row.meeting_date
            ),
            row.status,
            String(
              Number(
                row.attendance_count
              ) || 0
            ),
            String(
              Number(
                row.present_count
              ) || 0
            ),
            String(
              Number(
                row.resolution_count
              ) || 0
            ),
            Number(
              row.has_agenda
            ) === 1
              ? "Yes"
              : "No",
            Number(
              row.has_minutes
            ) === 1
              ? "Yes"
              : "No",
          ]
        ),
      },
    ],
  };
}

async function buildAttendanceReport():
  Promise<GeneratedReport> {
  await initializeDatabase();
  const db = await getDatabase();

  type MeetingAttendanceRow = {
    attendee_name: string;
    attendee_role: string | null;
    attendance_status: string;
    source_title: string;
    source_date: string;
  };

  type ActivityAttendanceRow = {
    participant_name: string;
    attendance_status: string;
    source_title: string;
    source_date: string;
  };

  const meetingRows =
    await db.getAllAsync<MeetingAttendanceRow>(
      `
        SELECT
          ma.attendee_name,
          ma.attendee_role,
          ma.attendance_status,
          m.title AS source_title,
          m.meeting_date AS source_date
        FROM meeting_attendance ma
        INNER JOIN meetings m
          ON m.id = ma.meeting_id
        ORDER BY
          m.meeting_date DESC,
          ma.attendee_name COLLATE NOCASE ASC
      `
    );

  const activityRows =
    await db.getAllAsync<ActivityAttendanceRow>(
      `
        SELECT
          ap.participant_name,
          ap.attendance_status,
          a.title AS source_title,
          a.activity_date AS source_date
        FROM activity_participants ap
        INNER JOIN activities a
          ON a.id = ap.activity_id
        ORDER BY
          a.activity_date DESC,
          ap.participant_name COLLATE NOCASE ASC
      `
    );

  const allStatuses = [
    ...meetingRows.map(
      (row) =>
        row.attendance_status
    ),
    ...activityRows.map(
      (row) =>
        row.attendance_status
    ),
  ];

  const countStatus = (
    status: string
  ) =>
    allStatuses.filter(
      (value) =>
        value === status
    ).length;

  return {
    type: "attendance",
    title: "Attendance Report",
    subtitle:
      "Combined meeting and activity attendance records.",
    summary: [
      {
        label: "Attendance Records",
        value: String(
          allStatuses.length
        ),
      },
      {
        label: "Present",
        value: String(
          countStatus(
            "Present"
          )
        ),
      },
      {
        label: "Absent",
        value: String(
          countStatus(
            "Absent"
          )
        ),
      },
      {
        label: "Excused",
        value: String(
          countStatus(
            "Excused"
          )
        ),
      },
      {
        label: "Not Marked",
        value: String(
          countStatus(
            "Not Marked"
          )
        ),
      },
      {
        label: "Meeting Attendance",
        value: String(
          meetingRows.length
        ),
      },
      {
        label: "Activity Attendance",
        value: String(
          activityRows.length
        ),
      },
    ],
    sections: [
      {
        title: "Meeting Attendance",
        columns: [
          "Attendee",
          "Role",
          "Meeting",
          "Date",
          "Status",
        ],
        rows: meetingRows.map(
          (row) => [
            row.attendee_name,
            row.attendee_role ||
              "Not set",
            row.source_title,
            formatReportDate(
              row.source_date
            ),
            row.attendance_status,
          ]
        ),
      },
      {
        title: "Activity Attendance",
        columns: [
          "Participant",
          "Activity",
          "Date",
          "Status",
        ],
        rows: activityRows.map(
          (row) => [
            row.participant_name,
            row.source_title,
            formatReportDate(
              row.source_date
            ),
            row.attendance_status,
          ]
        ),
      },
    ],
  };
}

async function buildInventoryReport():
  Promise<GeneratedReport> {
  await initializeDatabase();
  const db = await getDatabase();

  type InventoryRow = {
    item_name: string;
    quantity: number;
    available_quantity: number;
    condition: string;
    status: string;
  };

  const rows =
    await db.getAllAsync<InventoryRow>(
      `
        SELECT
          item_name,
          quantity,
          available_quantity,
          condition,
          status
        FROM inventory_items
        ORDER BY
          item_name COLLATE NOCASE ASC
      `
    );

  let totalUnits = 0;
  let availableUnits = 0;
  let borrowedUnits = 0;
  let needsAttention = 0;

  const conditionCounts =
    new Map<string, number>();

  for (const row of rows) {
    const quantity =
      Number(row.quantity) ||
      0;

    const available =
      Number(
        row.available_quantity
      ) || 0;

    const borrowed =
      Math.max(
        0,
        quantity - available
      );

    totalUnits += quantity;
    availableUnits +=
      available;
    borrowedUnits +=
      borrowed;

    if (
      row.condition ===
        "Needs Repair" ||
      row.condition ===
        "Damaged"
    ) {
      needsAttention += 1;
    }

    incrementCount(
      conditionCounts,
      row.condition,
      "Good"
    );
  }

  return {
    type: "inventory",
    title: "Inventory Report",
    subtitle:
      "SK property quantities, availability and physical condition.",
    summary: [
      {
        label: "Inventory Items",
        value: String(
          rows.length
        ),
      },
      {
        label: "Total Units",
        value: String(
          totalUnits
        ),
      },
      {
        label: "Available Units",
        value: String(
          availableUnits
        ),
      },
      {
        label: "Borrowed Units",
        value: String(
          borrowedUnits
        ),
      },
      {
        label: "Needs Attention",
        value: String(
          needsAttention
        ),
      },
    ],
    sections: [
      {
        title: "Condition Summary",
        columns: [
          "Condition",
          "Items",
        ],
        rows: [
          ...conditionCounts.entries(),
        ]
          .sort(
            (a, b) =>
              b[1] - a[1]
          )
          .map(
            ([condition, count]) => [
              condition,
              String(count),
            ]
          ),
      },
      {
        title: "Inventory Records",
        columns: [
          "Item",
          "Status",
          "Condition",
          "Total",
          "Available",
          "Borrowed",
        ],
        rows: rows.map(
          (row) => {
            const quantity =
              Number(
                row.quantity
              ) || 0;

            const available =
              Number(
                row.available_quantity
              ) || 0;

            return [
              row.item_name,
              row.status,
              row.condition,
              String(quantity),
              String(available),
              String(
                Math.max(
                  0,
                  quantity -
                    available
                )
              ),
            ];
          }
        ),
      },
    ],
  };
}

async function buildActivitiesReport():
  Promise<GeneratedReport> {
  await initializeDatabase();
  const db = await getDatabase();

  type ActivityRow = {
    title: string;
    activity_date: string;
    status: string;
    participant_count: number;
    present_count: number;
    expense_count: number;
    expense_total: number;
  };

  const rows =
    await db.getAllAsync<ActivityRow>(
      `
        SELECT
          a.title,
          a.activity_date,
          a.status,
          (
            SELECT COUNT(*)
            FROM activity_participants ap
            WHERE ap.activity_id = a.id
          ) AS participant_count,
          (
            SELECT COUNT(*)
            FROM activity_participants ap
            WHERE ap.activity_id = a.id
              AND ap.attendance_status = 'Present'
          ) AS present_count,
          (
            SELECT COUNT(*)
            FROM expenses e
            WHERE e.activity_id = a.id
          ) AS expense_count,
          COALESCE(
            (
              SELECT SUM(e.amount)
              FROM expenses e
              WHERE e.activity_id = a.id
            ),
            0
          ) AS expense_total
        FROM activities a
        ORDER BY
          a.activity_date DESC,
          a.created_at DESC
      `
    );

  const statusCounts =
    new Map<string, number>();

  let participants = 0;
  let present = 0;
  let expenseCount = 0;
  let expenseTotal = 0;

  for (const row of rows) {
    incrementCount(
      statusCounts,
      row.status,
      "Planned"
    );

    participants +=
      Number(
        row.participant_count
      ) || 0;

    present +=
      Number(
        row.present_count
      ) || 0;

    expenseCount +=
      Number(
        row.expense_count
      ) || 0;

    expenseTotal +=
      Number(
        row.expense_total
      ) || 0;
  }

  return {
    type: "activities",
    title: "Activities Report",
    subtitle:
      "Activity status, participation, attendance and event expenses.",
    summary: [
      {
        label: "Activities",
        value: String(
          rows.length
        ),
      },
      {
        label: "Participants",
        value: String(
          participants
        ),
      },
      {
        label: "Present",
        value: String(
          present
        ),
      },
      {
        label: "Expense Records",
        value: String(
          expenseCount
        ),
      },
      {
        label: "Event Expenses",
        value: formatReportMoney(
          expenseTotal
        ),
      },
    ],
    sections: [
      {
        title: "Activity Status",
        columns: [
          "Status",
          "Count",
        ],
        rows: [
          ...statusCounts.entries(),
        ]
          .sort(
            (a, b) =>
              b[1] - a[1]
          )
          .map(
            ([status, count]) => [
              status,
              String(count),
            ]
          ),
      },
      {
        title: "Activity Records",
        columns: [
          "Activity",
          "Date",
          "Status",
          "Participants",
          "Present",
          "Expense Records",
          "Expenses",
        ],
        rows: rows.map(
          (row) => [
            row.title,
            formatReportDate(
              row.activity_date
            ),
            row.status,
            String(
              Number(
                row.participant_count
              ) || 0
            ),
            String(
              Number(
                row.present_count
              ) || 0
            ),
            String(
              Number(
                row.expense_count
              ) || 0
            ),
            formatReportMoney(
              Number(
                row.expense_total
              ) || 0
            ),
          ]
        ),
      },
    ],
  };
}

export async function getGeneratedReport(
  type: ReportType
): Promise<GeneratedReport> {
  await requireOfficialAccess();
  switch (type) {
    case "budget":
      return buildBudgetReport();

    case "expenses":
      return buildExpensesReport();

    case "youth":
      return buildYouthReport();

    case "meetings":
      return buildMeetingsReport();

    case "attendance":
      return buildAttendanceReport();

    case "inventory":
      return buildInventoryReport();

    case "activities":
      return buildActivitiesReport();

    default:
      return buildProjectsGeneratedReport();
  }
}

