"use client";

import UserForm from "@/components/UserForm";
import { usersApi } from "@/lib/api";
import type { CreateUserPayload } from "@/lib/types";
import PageHeader from "@/components/admin/PageHeader";

export default function NewUserPage() {
  return (
    <div>
      <PageHeader
        title="Create User"
        description="Add a new user and their CompuVOIP PBX connection details."
        breadcrumbs={[
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/users", label: "Users" },
          { label: "New" },
        ]}
      />
      <UserForm
        mode="create"
        onSubmit={(payload) => usersApi.create(payload as CreateUserPayload)}
        onSuccessHref="/admin/users"
      />
    </div>
  );
}
