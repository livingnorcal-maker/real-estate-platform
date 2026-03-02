"use client";

import { cn } from "@/lib/utils";
import { Check, Circle, Clock, X } from "lucide-react";
import type { TransactionMilestone } from "@/types/database";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Circle className="h-5 w-5 text-muted-foreground" />,
  in_progress: <Clock className="h-5 w-5 text-blue-500" />,
  completed: <Check className="h-5 w-5 text-green-600" />,
  waived: <X className="h-5 w-5 text-muted-foreground" />,
};

interface TransactionTimelineProps {
  milestones: TransactionMilestone[];
}

export function TransactionTimeline({ milestones }: TransactionTimelineProps) {
  return (
    <div className="space-y-0">
      {milestones.map((milestone, index) => {
        const isLast = index === milestones.length - 1;
        const isCompleted = milestone.status === "completed";
        const isActive = milestone.status === "in_progress";

        return (
          <div key={milestone.id} className="flex gap-3">
            {/* Vertical line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                  isCompleted && "border-green-600 bg-green-50",
                  isActive && "border-blue-500 bg-blue-50",
                  !isCompleted && !isActive && "border-muted bg-background"
                )}
              >
                {STATUS_ICONS[milestone.status]}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-8",
                    isCompleted ? "bg-green-600" : "bg-muted"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn("pb-6", isLast && "pb-0")}>
              <p
                className={cn(
                  "font-medium leading-8",
                  isCompleted && "text-green-700",
                  isActive && "text-blue-700",
                  milestone.status === "waived" && "text-muted-foreground line-through"
                )}
              >
                {milestone.title}
              </p>
              {milestone.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {milestone.description}
                </p>
              )}
              {milestone.completed_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Completed{" "}
                  {new Date(milestone.completed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
