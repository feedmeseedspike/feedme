"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Send } from "lucide-react";
import CommentItem from "./CommentItem";
import { Button } from "@components/ui/button";
import { useToast } from "src/hooks/useToast";

interface Comment {
  id: string;
  user_id?: string;
  guest_name?: string;
  comment_text: string;
  created_at: string;
  likes_count: number;
  parent_comment_id?: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  bundleId: string;
}

export default function CommentSection({ bundleId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [bundleId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/recipes/${bundleId}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      
      const data = await response.json();
      setComments(organizeComments(data.comments || []));
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Organize comments into nested structure
  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map
    flatComments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize hierarchy
    flatComments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!;
      
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      showToast("Please enter a comment", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/recipes/${bundleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment_text: newComment,
          parent_comment_id: replyingTo,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to post comment");
      }

      showToast("Comment posted successfully!", "success");
      setNewComment("");
      setReplyingTo(null);
      await fetchComments();
    } catch (error: any) {
      console.error("Comment error:", error);
      showToast(error.message || "Failed to post comment", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/recipes/${bundleId}/comments/${commentId}/like`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to like comment");

      await fetchComments();
    } catch (error) {
      console.error("Like error:", error);
      showToast("Failed to like comment", "error");
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    // Focus on input (you can add a ref if needed)
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Community Notes
          </h3>
          <span className="px-3 py-1 bg-orange-50 text-[#F0800F] rounded-full text-xs font-bold border border-orange-100">
            {comments.length}
          </span>
        </div>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-4">
        {replyingTo && (
           <div className="flex items-center justify-between px-4 py-2 bg-orange-50 border border-orange-100 rounded-md">
             <span className="text-sm font-bold text-[#F0800F] uppercase tracking-wide">
               Replying to comment...
             </span>
             <button
               type="button"
               onClick={() => setReplyingTo(null)}
               className="text-xs font-bold text-slate-400 hover:text-slate-900 underline"
             >
               Cancel
             </button>
           </div>
         )}
         
        <div className="relative group">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Tell us what you think..."
            rows={4}
            className="w-full px-6 py-5 bg-stone-50 border-2 border-stone-100 text-slate-900 rounded-xl placeholder:text-stone-400 focus:outline-none focus:border-[#F0800F] focus:bg-white transition-all resize-none text-base font-medium"
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            {isSubmitting && <div className="w-4 h-4 border-2 border-[#F0800F] border-t-transparent rounded-full animate-spin" />}
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="p-3 bg-slate-900 text-white rounded-lg hover:bg-[#F0800F] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md group-focus-within:shadow-lg"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-[#F0800F] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
           <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={28} className="text-[#F0800F]" />
           </div>
           <h4 className="text-lg font-bold text-slate-900 mb-1">No notes yet</h4>
           <p className="text-slate-500 text-sm">Be the first to share your thoughts on this recipe.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onLike={handleLikeComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
