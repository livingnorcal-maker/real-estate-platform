import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md space-y-6 p-4">
        <Skeleton className="h-10 w-48 mx-auto" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}
