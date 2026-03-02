"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Circle, Minus } from "lucide-react";
import { toast } from "sonner";
import type { TransactionMilestone } from "@/types/database";

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  pending: { icon: <Circle className="h-4 w-4" />, label: "Pending", color: "text-muted-foreground" },
  in_progress: { icon: <Clock className="h-4 w-4" />, label: "In Progress", color: "text-blue-600" },
  completed: { icon: <Check className="h-4 w-4" />, label: "Completed", color: "text-green-600" },
  waived: { icon: <Minus className="h-4 w-4" />, label: "Waived", color: "text-muted-foreground" },
};

const NEXT_STATUS: Record<string, string> = {
  pending: "in_progress",
  in_progress: "completed",
};

interface MilestoneChecklistProps {
  milestones: TransactionMilestone[];
  transactionId: string;
  onUpdate: () => void;
}

export function MilestoneChecklist({ milestones, transactionId, onUpdate }: MilestoneChecklistProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  async function advanceMilestone(milestone: TransactionMilestone) {
    const nextStatus = NEXT_STATUS[milestone.status];
    if (!nextStatus) return;

    setUpdating(milestone.id);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId: milestone.id, status: nextStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update milestone");
      }

      toast.success(
        nextStatus === "completed"
          ? `"${milestone.title}" marked complete`
          : `"${milestone.title}" started`
      );
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdating(null);
    }
  }

  async function waiveMilestone(milestone: TransactionMilestone) {
    if (milestone.status === "completed" || milestone.status === "waived") return;

    setUpdating(milestone.id);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId: milestone.id, status: "waived" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to waive milestone");
      }

      toast.success(`"${milestone.title}" waived`);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-3">
      {milestones.map((milestone) => {
        const config = STATUS_CONFIG[milestone.status];
        const canAdvance = milestone.status === "pending" || milestone.status === "in_progress";
        const canWaive = milestone.status === "pending" || milestone.status === "in_progress";
        const isUpdating = updating === milestone.id;

        return (
          <div
            key={milestone.id}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <div className={config.color}>{config.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{milestone.title}</p>
              {milestone.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {milestone.description}
                </p>
              )}
            </div>
            <Badge variant="outline" className="shrink-0 text-xs">
              {config.label}
            </Badge>
            {canAdvance && (
              <Button
                size="sm"
                variant="ghost"
                disabled={isUpdating}
                onClick={() => advanceMilestone(milestone)}
              >
                {milestone.status === "pending" ? "Start" : "Complete"}
              </Button>
            )}
            {canWaive && (
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                disabled={isUpdating}
                onClick={() => waiveMilestone(milestone)}
              >
                Waive
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
