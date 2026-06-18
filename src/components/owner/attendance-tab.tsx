"use client";

import { useState, useEffect, useTransition } from "react";

import { getStaffAttendance, type StaffSession } from "@/app/dashboard/staff-sessions/actions";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcHours(timeIn: string, timeOut: string): number {
  const ms = new Date(timeOut).getTime() - new Date(timeIn).getTime();
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
}

function getDefaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

function getDefaultTo(): string {
  return new Date().toISOString().split("T")[0];
}

export function AttendanceTab() {
  const [sessions, setSessions] = useState<StaffSession[]>([]);
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState(getDefaultTo);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadAttendance() {
    startTransition(async () => {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      const data = await getStaffAttendance(
        fromDate.toISOString(),
        toDate.toISOString(),
      );
      setSessions(data);
    });
  }

  const totalHours = sessions.reduce(
    (sum, s) => (s.time_out ? sum + calcHours(s.time_in, s.time_out) : sum),
    0,
  );

  const hoursByName: Record<string, number> = {};
  for (const s of sessions) {
    if (s.time_out) {
      hoursByName[s.staff_name] =
        (hoursByName[s.staff_name] ?? 0) + calcHours(s.time_in, s.time_out);
    }
  }

  return (
    <section className="panel">
      <h2>Staff Attendance</h2>
      <p className="muted" style={{ marginBottom: "12px" }}>
        View staff time-in/out logs. Highlighted rows indicate auto-logged-out sessions.
      </p>

      {/* Date range filter */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <label className="salesField">
          <span>From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="salesField">
          <span>To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          className="button"
          type="button"
          disabled={isPending}
          onClick={loadAttendance}
        >
          Filter
        </button>
      </div>

      {/* Summary */}
      {Object.keys(hoursByName).length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          {Object.entries(hoursByName).map(([name, hours]) => (
            <div
              key={name}
              style={{
                padding: "8px 14px",
                background: "var(--panel-alt, #f3f4f6)",
                borderRadius: "8px",
                fontSize: "0.875rem",
              }}
            >
              <strong>{name}</strong>: {hours.toFixed(1)}h
            </div>
          ))}
          <div
            style={{
              padding: "8px 14px",
              background: "var(--panel-alt, #f3f4f6)",
              borderRadius: "8px",
              fontSize: "0.875rem",
            }}
          >
            <strong>Total</strong>: {totalHours.toFixed(1)}h
          </div>
        </div>
      )}

      {/* Table */}
      {sessions.length === 0 ? (
        <p className="muted">{isPending ? "Loading..." : "No attendance records found."}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="txnTable">
            <thead>
              <tr>
                <th>Date</th>
                <th>Staff</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const hours = s.time_out ? calcHours(s.time_in, s.time_out) : null;
                return (
                  <tr
                    key={s.id}
                    style={
                      s.auto_logged_out
                        ? { background: "var(--color-danger-bg, #fef2f2)" }
                        : undefined
                    }
                  >
                    <td>{formatDate(s.time_in)}</td>
                    <td><strong>{s.staff_name}</strong></td>
                    <td>{formatTime(s.time_in)}</td>
                    <td>
                      {s.time_out ? formatTime(s.time_out) : "—"}
                      {s.auto_logged_out && (
                        <span
                          className="badge"
                          style={{
                            marginLeft: "6px",
                            fontSize: "0.7rem",
                            background: "var(--color-danger, #e74c3c)",
                            color: "#fff",
                          }}
                        >
                          auto
                        </span>
                      )}
                    </td>
                    <td>{hours !== null ? `${hours.toFixed(1)}h` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
