"use client";

import { useUser } from "@/hooks/useUser";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Skeleton } from "@/components/ui/skeleton";
import { redirect } from "next/navigation";

export default function ProfilePage() {
  const { user, profile, loading } = useUser();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <ProfileForm profile={profile} userId={user.id} />
    </div>
  );
}
