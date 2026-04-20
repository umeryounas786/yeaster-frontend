"use client";

import { use, useEffect, useState } from "react";
import UserForm from "@/components/UserForm";
import { usersApi, ApiError } from "@/lib/api";
import type { UpdateUserPayload, UserProfile } from "@/lib/types";
import PageHeader from "@/components/admin/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: Props) {
  const { id } = use(params);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await usersApi.get(id);
        if (!cancelled) setUser(u);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof ApiError ? e.message : "Failed to load user");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Edit User"
          breadcrumbs={[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/users", label: "Users" },
            { label: "Edit" },
          ]}
        />
        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div>
        <PageHeader
          title="Edit User"
          breadcrumbs={[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/users", label: "Users" },
            { label: "Edit" },
          ]}
        />
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error ?? "User not found"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit User"
        description={`@${user.username}`}
        breadcrumbs={[
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/users", label: "Users" },
          { label: user.username },
        ]}
      />
      <UserForm
        mode="edit"
        initial={user}
        onSubmit={(payload) =>
          usersApi.update(id, payload as UpdateUserPayload)
        }
        onSuccessHref="/admin/users"
      />
    </div>
  );
}
