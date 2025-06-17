"use client";

import { useState } from "react";
import { useToast } from "src/hooks/useToast";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  ThumbsUp,
  Flag,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { Textarea } from "@components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import {
  useAddHelpfulVoteMutation,
  useRemoveHelpfulVoteMutation,
  useAddReportMutation,
} from "src/queries/reviews";

const reportReasons = [
  { value: "off_topic", label: "Off topic - Not about the product" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "fake", label: "Fake or sponsored review" },
  { value: "other", label: "Other issues" },
];

const reportFormSchema = z.object({
  reason: z.string().min(1, "Please select a reason"),
  details: z
    .string()
    .max(500, "Details must be less than 500 characters")
    .optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

interface ReviewActionsProps {
  reviewId: string;
  userId: string | undefined;
  initialHelpfulCount?: number;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  initialIsHelpful?: boolean;
  isPending?: boolean;
}

export default function ReviewActions({
  reviewId,
  userId,
  initialHelpfulCount = 0,
  isOwner = false,
  onEdit,
  onDelete,
  initialIsHelpful = false,
  isPending = false,
}: ReviewActionsProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [state, setState] = useState({
    helpfulCount: initialHelpfulCount,
    isHelpful: initialIsHelpful,
    isReported: false,
    isSubmittingVote: false,
    isSubmittingReport: false,
    isDeleting: false,
  });

  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Use Tanstack Query mutations
  const addHelpfulVoteMutation = useAddHelpfulVoteMutation();
  const removeHelpfulVoteMutation = useRemoveHelpfulVoteMutation();
  const addReportMutation = useAddReportMutation();

  const reportForm = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reason: "",
      details: "",
    },
  });

  const handleHelpfulClick = async () => {
    if (!userId) {
      showToast("Please sign in to vote", "error");
      router.push(
        `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    setState((prev) => ({ ...prev, isSubmittingVote: true }));

    try {
      if (state.isHelpful) {
        await removeHelpfulVoteMutation.mutateAsync({
          reviewId,
          userId,
        });

        setState((prev) => ({
          ...prev,
          helpfulCount: prev.helpfulCount - 1,
          isHelpful: false,
        }));
      } else {
        await addHelpfulVoteMutation.mutateAsync({
          reviewId,
          userId,
        });

        setState((prev) => ({
          ...prev,
          helpfulCount: prev.helpfulCount + 1,
          isHelpful: true,
        }));
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to update vote",
        "error"
      );
    } finally {
      setState((prev) => ({ ...prev, isSubmittingVote: false }));
    }
  };

  const handleReportSubmit: SubmitHandler<ReportFormValues> = async (data) => {
    if (!userId) {
      showToast("Please sign in to report", "error");
      router.push(
        `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    setState((prev) => ({ ...prev, isSubmittingReport: true }));

    try {
      const reasonText =
        reportReasons.find((r) => r.value === data.reason)?.label ||
        data.reason;
      const fullReason = data.details
        ? `${reasonText}: ${data.details}`
        : reasonText;

      const res = await addReportMutation.mutateAsync({
        reviewId,
        userId,
        reason: fullReason,
      });

      if (!res.success) throw new Error(res.message);

      setState((prev) => ({ ...prev, isReported: true }));
      setIsReportDialogOpen(false);
      reportForm.reset();
      showToast("Report submitted. Thank you!", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to submit report",
        "error"
      );
    } finally {
      setState((prev) => ({ ...prev, isSubmittingReport: false }));
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-4 pt-3">
        <div className="text-sm text-gray-500 italic">
          Your review is pending approval
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Helpful Count */}
      {state.helpfulCount > 0 && (
        <span className="text-sm text-gray-500">
          {state.helpfulCount} {state.helpfulCount === 1 ? "person" : "people"}{" "}
          found this helpful
        </span>
      )}
      <div className="flex items-center gap-4 pt-3">
        {/* Helpful Button - Only show if not owner */}
        {!isOwner && (
          <button
            onClick={handleHelpfulClick}
            disabled={state.isSubmittingVote}
            className={`flex items-center gap-1 text-sm px-3 py-1  transition-colors ${
              state.isHelpful
                ? "bg-green-50 border-green-200 text-green-600"
                : "border-gray-200 text-gray-600 hover:border-green-200 hover:text-green-600"
            } ${state.isSubmittingVote ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {state.isSubmittingVote ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : state.isHelpful ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Helpful
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                Helpful
              </span>
            )}
          </button>
        )}

        {/* Report Button - Only show if not owner */}
        {!isOwner && (
          <button
            onClick={() => setIsReportDialogOpen(true)}
            disabled={state.isReported}
            className={`flex items-center gap-1 text-sm px-3 py-1 transition-colors ${
              state.isReported
                ? "bg-gray-50 border-gray-200 text-gray-500"
                : "border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600"
            }`}
          >
            <Flag className="h-4 w-4" />
            {state.isReported ? "Reported" : "Report"}
          </button>
        )}

        {/* Edit and Delete Buttons (only for owner) */}
        {isOwner && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1 text-sm px-3 py-1 border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
            {onDelete && (
              <>
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="flex items-center gap-1 text-sm px-3 py-1 border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>

                <Dialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Review</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this review? This action
                        cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={onDelete}
                        disabled={state.isDeleting}
                      >
                        {state.isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Delete"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        )}

        {/* Report Dialog */}
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report this review</DialogTitle>
              <DialogDescription>
                Please tell us why you&apos;re reporting this review.
              </DialogDescription>
            </DialogHeader>

            <Form {...reportForm}>
              <form
                onSubmit={reportForm.handleSubmit(handleReportSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={reportForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          {reportReasons.map((reason) => (
                            <FormItem
                              key={reason.value}
                              className="flex items-center space-x-3 space-y-0"
                            >
                              <FormControl>
                                <RadioGroupItem value={reason.value} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {reason.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={reportForm.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional details (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide more details..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={state.isSubmittingReport}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {state.isSubmittingReport ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Submit Report"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
