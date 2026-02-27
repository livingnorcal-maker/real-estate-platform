import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}
