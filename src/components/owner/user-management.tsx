"use client";

import { useState, useTransition } from "react";

import {
  addUser,
  updateUserRole,
  removeUser,
  type AllowedUser,
} from "@/app/dashboard/actions";
import { getDepartmentLabel, type UserRole } from "@/lib/auth/roles";
import { ALL_DEPARTMENTS } from "@/lib/auth/roles";

const ALL_ROLES: UserRole[] = ["owner", ...ALL_DEPARTMENTS];

export function UserManagement({ initialUsers }: { initialUsers: AllowedUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("physical_dept");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  function handleAddUser() {
    clearMessages();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    startTransition(async () => {
      const result = await addUser(email.trim(), role);
      if (!result.ok) {
        setError(result.error ?? "Failed to add user.");
        return;
      }
      setSuccess(`Added ${email.trim()} as ${getDepartmentLabel(role)}.`);
      setEmail("");
      setRole("physical_dept");

      // Refresh the list
      const { getAllowedUsers } = await import("@/app/dashboard/actions");
      const updated = await getAllowedUsers();
      setUsers(updated);
    });
  }

  function handleRoleChange(userId: string, newRole: UserRole) {
    clearMessages();
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (!result.ok) {
        setError(result.error ?? "Failed to update role.");
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    });
  }

  function handleRemove(userId: string, userEmail: string) {
    if (!confirm(`Remove ${userEmail} from the allowlist?`)) return;

    clearMessages();
    startTransition(async () => {
      const result = await removeUser(userId);
      if (!result.ok) {
        setError(result.error ?? "Failed to remove user.");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSuccess(`Removed ${userEmail}.`);
    });
  }

  return (
    <section className="panel">
      <h2>User Management</h2>
      <p className="muted" style={{ marginBottom: "16px" }}>
        Add or remove users and assign departments. Users must be in this list to sign in.
      </p>

      {/* Add user form */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <label className="salesField" style={{ flex: "1 1 240px" }}>
          <span>Email</span>
          <input
            type="email"
            placeholder="user@example.com"
            value={email}
            disabled={isPending}
            onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
          />
        </label>
        <label className="salesField" style={{ minWidth: "160px" }}>
          <span>Department / Role</span>
          <select
            value={role}
            disabled={isPending}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {r === "owner" ? "Owner" : getDepartmentLabel(r)}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button"
          type="button"
          disabled={isPending || !email.trim()}
          onClick={handleAddUser}
        >
          Add User
        </button>
      </div>

      {error && (
        <div style={{ padding: "8px 12px", marginBottom: "12px", background: "#e74c3c20", border: "1px solid #e74c3c40", borderRadius: "6px", color: "#e74c3c", fontSize: "0.875rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "8px 12px", marginBottom: "12px", background: "#22c55e20", border: "1px solid #22c55e40", borderRadius: "6px", color: "#22c55e", fontSize: "0.875rem" }}>
          {success}
        </div>
      )}

      {/* Users table */}
      {users.length === 0 ? (
        <p className="muted">No users in the allowlist.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="txnTable">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.email}</strong></td>
                  <td>
                    <select
                      value={u.role}
                      disabled={isPending}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.85rem" }}
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r === "owner" ? "Owner" : getDepartmentLabel(r)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="muted">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="buttonSmall buttonSmall--danger"
                      type="button"
                      disabled={isPending}
                      onClick={() => handleRemove(u.id, u.email)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
