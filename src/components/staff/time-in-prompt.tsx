"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";

import {
  clockIn,
  clockOut,
  getActiveSessions,
  type StaffSession,
} from "@/app/dashboard/staff-sessions/actions";

const STAFF_NAMES = ["Buknoy", "Mark"] as const;

export function StaffShiftPanel() {
  const [activeSessions, setActiveSessions] = useState<StaffSession[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchSessions = useCallback(async () => {
    try {
      const sessions = await getActiveSessions();
      setActiveSessions(sessions);
      setError(null);
    } catch (err) {
      console.error("[StaffShiftPanel] Failed to fetch sessions:", err);
      setError(err instanceof Error ? err.message : "Failed to load staff sessions.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchSessions();
  }, [fetchSessions]);

  const activeNames = new Set(activeSessions.map((s) => s.staff_name));

  function handleClockIn(name: string) {
    startTransition(async () => {
      try {
        await clockIn([name]);
        await fetchSessions();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to clock in.");
      }
    });
  }

  function handleClockOut(name: string) {
    startTransition(async () => {
      try {
        await clockOut([name]);
        await fetchSessions();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to clock out.");
      }
    });
  }

  if (!loaded) {
    return (
      <section className="panel" style={{ marginBottom: "18px" }}>
        <h2 style={{ marginBottom: "8px" }}>Staff Shift</h2>
        <p className="muted">Loading...</p>
      </section>
    );
  }

  return (
    <section className="panel" style={{ marginBottom: "18px" }}>
      <h2 style={{ marginBottom: "12px" }}>Staff Shift</h2>

      {error && (
        <div
          style={{
            padding: "8px 12px",
            marginBottom: "12px",
            background: "#e74c3c20",
            border: "1px solid #e74c3c40",
            borderRadius: "6px",
            color: "#e74c3c",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {STAFF_NAMES.map((name) => {
          const isActive = activeNames.has(name);
          const session = activeSessions.find((s) => s.staff_name === name);
          const timeIn = session
            ? new Date(session.time_in).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null;

          return (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border, #e5e7eb)",
                background: isActive ? "#22c55e10" : "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: isActive ? "#22c55e" : "#9ca3af",
                  }}
                />
                <div>
                  <strong>{name}</strong>
                  {isActive && timeIn && (
                    <span
                      className="muted"
                      style={{ marginLeft: "8px", fontSize: "0.8rem" }}
                    >
                      on shift since {timeIn}
                    </span>
                  )}
                  {!isActive && (
                    <span
                      className="muted"
                      style={{ marginLeft: "8px", fontSize: "0.8rem" }}
                    >
                      off shift
                    </span>
                  )}
                </div>
              </div>

              {isActive ? (
                <button
                  className="buttonSmall buttonSmall--danger"
                  type="button"
                  disabled={isPending}
                  onClick={() => handleClockOut(name)}
                >
                  Time Out
                </button>
              ) : (
                <button
                  className="button"
                  type="button"
                  disabled={isPending}
                  onClick={() => handleClockIn(name)}
                  style={{ padding: "6px 16px", fontSize: "0.85rem" }}
                >
                  Time In
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
