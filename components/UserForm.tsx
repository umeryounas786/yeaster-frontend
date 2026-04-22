"use client";

import { useState } from "react";
import Link from "next/link";
import { Server, UserCircle2 } from "lucide-react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { ApiError } from "@/lib/api";
import { useToast } from "./ui/Toast";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserProfile,
  UserStatus,
} from "@/lib/types";

interface Props {
  mode: "create" | "edit";
  initial?: UserProfile;
  onSubmit: (
    payload: CreateUserPayload | UpdateUserPayload
  ) => Promise<UserProfile>;
  onSuccessHref: string;
}

export default function UserForm({
  mode,
  initial,
  onSubmit,
  onSuccessHref,
}: Props) {
  const toast = useToast();

  const [username, setUsername] = useState(initial?.username ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<UserStatus>(initial?.status ?? "active");

  const [pbxHost, setPbxHost] = useState(initial?.pbx?.host ?? "");
  const [pbxClientId, setPbxClientId] = useState(
    initial?.pbx?.apiClientId ?? ""
  );
  const [pbxClientSecret, setPbxClientSecret] = useState("");
  const [pbxPort, setPbxPort] = useState<number>(initial?.pbx?.port ?? 8088);
  // HTTPS is always used for PBX connections — P-Series requires it.
  const pbxUseHttps = true;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const pbx = {
        host: pbxHost || undefined,
        apiClientId: pbxClientId || undefined,
        ...(pbxClientSecret ? { apiClientSecret: pbxClientSecret } : {}),
        port: pbxPort,
        useHttps: pbxUseHttps,
      };

      if (mode === "create") {
        const payload: CreateUserPayload = {
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          fullName: fullName.trim() || undefined,
          password,
          pbx,
          status,
        };
        await onSubmit(payload);
        toast.success("User created", `@${payload.username} is ready to log in`);
      } else {
        const payload: UpdateUserPayload = {
          email: email.trim().toLowerCase(),
          fullName: fullName.trim() || undefined,
          ...(password ? { password } : {}),
          pbx,
          status,
        };
        await onSubmit(payload);
        toast.success("User updated", "Changes saved");
      }

      window.location.href = onSuccessHref;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        const details = err.details as
          | Record<string, { field: string; message: string }[]>
          | undefined;
        if (details) {
          const flat: Record<string, string> = {};
          for (const group of Object.values(details)) {
            for (const item of group) flat[item.field] = item.message;
          }
          setFieldErrors(flat);
        }
        toast.error(
          mode === "create" ? "Could not create user" : "Could not update user",
          err.message
        );
      } else {
        setError("Request failed");
        toast.error("Request failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <UserCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Login credentials and account status.
            </p>
          </div>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={mode === "edit"}
            required={mode === "create"}
            error={fieldErrors.username}
            hint={
              mode === "edit"
                ? "Username cannot be changed"
                : "Lowercase, 3+ characters"
            }
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={fieldErrors.email}
          />
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={fieldErrors.fullName}
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Input
              label={mode === "create" ? "Password" : "New password (optional)"}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={mode === "create"}
              error={fieldErrors.password}
              hint={
                mode === "edit"
                  ? "Leave blank to keep the current password"
                  : "Minimum 6 characters"
              }
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              CompuVOIP PBX Connection
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              API credentials this user will connect to. The Client Secret is
              write-only.
            </p>
          </div>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="PBX Host / IP"
            placeholder="10.0.0.5 or pbx.example.com"
            value={pbxHost}
            onChange={(e) => setPbxHost(e.target.value)}
          />
          <Input
            label="Port"
            type="number"
            min={1}
            max={65535}
            value={pbxPort}
            onChange={(e) => setPbxPort(Number(e.target.value))}
          />
          <Input
            label="API Client ID"
            value={pbxClientId}
            onChange={(e) => setPbxClientId(e.target.value)}
          />
          <Input
            label="API Client Secret"
            type="password"
            value={pbxClientSecret}
            onChange={(e) => setPbxClientSecret(e.target.value)}
            hint={
              mode === "edit"
                ? "Leave blank to keep the existing secret"
                : "Stored securely on the server"
            }
          />
        </CardBody>
      </Card>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link href={onSuccessHref}>
          <Button type="button" variant="secondary" disabled={submitting}>
            Cancel
          </Button>
        </Link>
        <Button type="submit" loading={submitting}>
          {mode === "create" ? "Create user" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
