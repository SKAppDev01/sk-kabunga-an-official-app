import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import {
  GeneratedReport,
} from "./reports";

function escapeHtml(
  value: string
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeFileName(
  value: string
) {
  const cleaned = value
    .trim()
    .replace(
      /[^a-zA-Z0-9._-]+/g,
      "-"
    )
    .replace(/-+/g, "-")
    .replace(
      /^[-._]+|[-._]+$/g,
      ""
    )
    .slice(0, 80);

  return cleaned || "report";
}

function formatGeneratedAt() {
  return new Date().toLocaleString(
    "en-PH",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function buildSummaryHtml(
  report: GeneratedReport
) {
  if (
    report.summary.length === 0
  ) {
    return "";
  }

  const rows =
    report.summary
      .map(
        (metric) => `
          <tr>
            <td class="summary-label">
              ${escapeHtml(
                metric.label
              )}
            </td>
            <td class="summary-value">
              ${escapeHtml(
                metric.value
              )}
            </td>
          </tr>
        `
      )
      .join("");

  return `
    <section>
      <h2>Summary</h2>
      <table class="summary-table">
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

function buildSectionHtml(
  report: GeneratedReport
) {
  return report.sections
    .map((section) => {
      if (
        section.rows.length === 0
      ) {
        return `
          <section>
            <h2>
              ${escapeHtml(
                section.title
              )}
            </h2>
            <div class="empty-state">
              No records available.
            </div>
          </section>
        `;
      }

      const headerCells =
        section.columns
          .map(
            (column) => `
              <th>
                ${escapeHtml(
                  column
                )}
              </th>
            `
          )
          .join("");

      const bodyRows =
        section.rows
          .map((row) => {
            const cells =
              section.columns
                .map(
                  (
                    _column,
                    index
                  ) => `
                    <td>
                      ${escapeHtml(
                        row[index] || ""
                      )}
                    </td>
                  `
                )
                .join("");

            return `
              <tr>
                ${cells}
              </tr>
            `;
          })
          .join("");

      return `
        <section class="report-section">
          <div class="section-title-row">
            <h2>
              ${escapeHtml(
                section.title
              )}
            </h2>
            <span class="count-badge">
              ${section.rows.length}
            </span>
          </div>

          <table class="records-table">
            <thead>
              <tr>
                ${headerCells}
              </tr>
            </thead>
            <tbody>
              ${bodyRows}
            </tbody>
          </table>
        </section>
      `;
    })
    .join("");
}

export function buildReportHtml(
  report: GeneratedReport
) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        <style>
          @page {
            size: A4 landscape;
            margin: 12mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            color: #111827;
            font-size: 10px;
            line-height: 1.4;
          }

          .app-name {
            color: #2563EB;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.3px;
            text-transform: uppercase;
          }

          h1 {
            margin:
              4px 0 0;
            font-size: 24px;
            line-height: 1.15;
          }

          .subtitle {
            margin-top: 7px;
            color: #6B7280;
            font-size: 11px;
          }

          .generated-at {
            margin-top: 5px;
            color: #9CA3AF;
            font-size: 9px;
          }

          .top-rule {
            margin:
              14px 0 16px;
            border: 0;
            border-top:
              1px solid #E5E7EB;
          }

          section {
            margin-top: 18px;
            break-inside: auto;
          }

          h2 {
            margin:
              0 0 8px;
            font-size: 14px;
          }

          .section-title-row {
            display: flex;
            align-items: center;
            gap: 7px;
          }

          .section-title-row h2 {
            margin-bottom: 8px;
          }

          .count-badge {
            min-width: 22px;
            padding: 3px 7px;
            margin-bottom: 8px;
            border-radius: 999px;
            background: #EFF6FF;
            color: #2563EB;
            text-align: center;
            font-size: 9px;
            font-weight: 700;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            padding: 6px 7px;
            border-bottom:
              1px solid #E5E7EB;
            vertical-align: top;
            overflow-wrap: anywhere;
          }

          th {
            background: #F9FAFB;
            color: #374151;
            font-size: 9px;
            text-align: left;
            font-weight: 700;
          }

          td {
            color: #4B5563;
            font-size: 9px;
          }

          .summary-table {
            max-width: 560px;
          }

          .summary-label {
            width: 60%;
            color: #6B7280;
          }

          .summary-value {
            color: #111827;
            font-weight: 700;
            text-align: right;
          }

          .records-table {
            table-layout: fixed;
          }

          .records-table
          tbody
          tr:nth-child(even) {
            background: #FCFCFD;
          }

          .empty-state {
            padding: 18px;
            border-top:
              1px solid #E5E7EB;
            color: #9CA3AF;
            text-align: center;
          }

          .footer {
            margin-top: 22px;
            padding-top: 10px;
            border-top:
              1px solid #E5E7EB;
            color: #9CA3AF;
            font-size: 8px;
            text-align: center;
          }
        </style>
      </head>

      <body>
        <div class="app-name">
          SK Kabunga-an Official App
        </div>

        <h1>
          ${escapeHtml(
            report.title
          )}
        </h1>

        <div class="subtitle">
          ${escapeHtml(
            report.subtitle
          )}
        </div>

        <div class="generated-at">
          Generated:
          ${escapeHtml(
            formatGeneratedAt()
          )}
        </div>

        <hr class="top-rule" />

        ${buildSummaryHtml(
          report
        )}

        ${buildSectionHtml(
          report
        )}

        <div class="footer">
          Generated offline from local app records.
        </div>
      </body>
    </html>
  `;
}

function getPdfFileName(
  report: GeneratedReport
) {
  const date =
    new Date()
      .toISOString()
      .slice(0, 10);

  return `${sanitizeFileName(
    report.title
  )}-${date}.pdf`;
}

export async function generateReportPdf(
  report: GeneratedReport
) {
  const html =
    buildReportHtml(
      report
    );

  const result =
    await Print.printToFileAsync({
      html,
      base64: false,
    });

  return {
    uri: result.uri,
    fileName:
      getPdfFileName(
        report
      ),
  };
}

export async function printReport(
  report: GeneratedReport
) {
  const html =
    buildReportHtml(
      report
    );

  await Print.printAsync({
    html,
  });
}

export async function shareReportPdf(
  report: GeneratedReport
) {
  const available =
    await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error(
      "SHARING_NOT_AVAILABLE"
    );
  }

  const pdf =
    await generateReportPdf(
      report
    );

  try {
    await Sharing.shareAsync(
      pdf.uri,
      {
        mimeType:
          "application/pdf",
        dialogTitle:
          `Share ${report.title}`,
        UTI: "com.adobe.pdf",
      }
    );
  } finally {
    try {
      await FileSystem.deleteAsync(
        pdf.uri,
        {
          idempotent: true,
        }
      );
    } catch {
      // Temporary print PDF cleanup is best-effort.
    }
  }
}

export async function saveReportPdf(
  report: GeneratedReport
) {
  const permissions =
    await FileSystem
      .StorageAccessFramework
      .requestDirectoryPermissionsAsync();

  if (!permissions.granted) {
    return {
      saved: false as const,
      fileName:
        getPdfFileName(
          report
        ),
    };
  }

  const pdf =
    await generateReportPdf(
      report
    );

  try {
    const destination =
      await FileSystem
        .StorageAccessFramework
        .createFileAsync(
          permissions.directoryUri,
          pdf.fileName,
          "application/pdf"
        );

    const base64 =
      await FileSystem
        .readAsStringAsync(
          pdf.uri,
          {
            encoding:
              FileSystem
                .EncodingType
                .Base64,
          }
        );

    await FileSystem
      .writeAsStringAsync(
        destination,
        base64,
        {
          encoding:
            FileSystem
              .EncodingType
              .Base64,
        }
      );

    return {
      saved: true as const,
      fileName:
        pdf.fileName,
      uri: destination,
    };
  } finally {
    try {
      await FileSystem.deleteAsync(
        pdf.uri,
        {
          idempotent: true,
        }
      );
    } catch {
      // Temporary print PDF cleanup is best-effort.
    }
  }
}
