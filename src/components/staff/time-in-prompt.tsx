"use client";

import { useState, useTransition, useEffect, useRef } from "react";

import {
  clockIn,
  clockOut,
  getActiveSessions,
  type StaffSession,
} from "@/app/dashboard/staff-sessions/actions";

const STAFF_NAMES = ["Buknoy", "Mark"] as const;

const STORAGE_KEY = "staff-session-dismissed";

export function TimeInPrompt() {
  const [activeSessions, setActiveSessions] = useState<StaffSession[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(() =>
    typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "true",
  );
  const [loaded, setLoaded] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (dismissed || fetchedRef.current) return;
    fetchedRef.current = true;
    startTransition(async () => {
      const sessions = await getActiveSessions();
      setActiveSessions(sessions);
      setLoaded(true);
    });
  }, [dismissed, startTransition]);

  const activeNames = new Set(activeSessions.map((s) => s.staff_name));
  const allClockedIn = STAFF_NAMES.every((name) => activeNames.has(name));
  const hasPartial = activeSessions.length > 0 && !allClockedIn;

  if (!loaded || dismissed || allClockedIn) return null;

  function toggle(name: string) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  function handleStartShift() {
    if (selected.length === 0) return;
    startTransition(async () => {
      await clockIn(selected);
      const updated = await getActiveSessions();
      setActiveSessions(updated);
      setSelected([]);
      if (updated.length === STAFF_NAMES.length) {
        sessionStorage.setItem(STORAGE_KEY, "true");
        setDismissed(true);
      }
    });
  }

  function handleEndShift(name: string) {
    startTransition(async () => {
      await clockOut([name]);
      const updated = await getActiveSessions();
      setActiveSessions(updated);
    });
  }

  function handleDismiss() {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  const notClockedIn = STAFF_NAMES.filter((name) => !activeNames.has(name));

  return (
    <section className="panel" style={{ marginBottom: "18px" }}>
      <h2 style={{ marginBottom: "8px" }}>Staff Shift</h2>

      {activeSessions.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <p className="muted" style={{ marginBottom: "8px" }}>Currently on shift:</p>
          {activeSessions.map((session) => (
            <div
              key={session.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid var(--border, #e5e7eb)",
              }}
            >
              <span>
                <strong>{session.staff_name}</strong>
                <span className="muted" style={{ marginLeft: "8px", fontSize: "0.8rem" }}>
                  since {new Date(session.time_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </span>
              <button
                className="buttonSmall buttonSmall--danger"
                type="button"
                disabled={isPending}
                onClick={() => handleEndShift(session.staff_name)}
              >
                End Shift
              </button>
            </div>
          ))}
        </div>
      )}

      {notClockedIn.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <p className="muted" style={{ marginBottom: "8px" }}>
            {hasPartial ? "Add more staff:" : "Who's working today?"}
          </p>
          {notClockedIn.map((name) => (
            <label
              key={name}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={selected.includes(name)}
                onChange={() => toggle(name)}
              />
              <span>{name}</span>
            </label>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        {notClockedIn.length > 0 && (
          <button
            className="button"
            type="button"
            disabled={isPending || selected.length === 0}
            onClick={handleStartShift}
          >
            {hasPartial ? "Clock In Selected" : "Start Shift"}
          </button>
        )}
        <button
          className="buttonSecondary"
          type="button"
          onClick={handleDismiss}
        >
          Dismiss
        </button>
      </div>
    </section>
  );
}
