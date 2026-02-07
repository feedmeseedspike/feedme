"use client";

import { useState } from "react";
import { Heart, Reply, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface CommentItemProps {
  comment: Comment;
  onReply?: (commentId: string) => void;
  onLike?: (commentId: string) => void;
  isLiked?: boolean;
  depth?: number;
}

export default function CommentItem({ 
  comment, 
  onReply, 
  onLike, 
  isLiked = false,
  depth = 0 
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  
  const authorName = comment.guest_name || "FeedMe User";
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  return (
    <div className={`${depth > 0 ? 'ml-12 mt-4' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B6013] to-[#F0800F] flex items-center justify-center text-white font-black flex-shrink-0">
          {authorName[0].toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-sm text-gray-900">{authorName}</h4>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{comment.comment_text}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2 px-2">
            <button
              onClick={() => onLike?.(comment.id)}
              className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                isLiked ? "text-[#F0800F]" : "text-gray-500 hover:text-[#F0800F]"
              }`}
            >
              <Heart size={14} className={isLiked ? "fill-current" : ""} />
              {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
            </button>

            {depth < 2 && (
              <button
                onClick={() => onReply?.(comment.id)}
                className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#1B6013] transition-colors"
              >
                <Reply size={14} />
                Reply
              </button>
            )}

            <span className="text-xs text-gray-400 font-medium">{timeAgo}</span>
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              {!showReplies && (
                <button
                  onClick={() => setShowReplies(true)}
                  className="text-xs font-bold text-[#1B6013] hover:underline uppercase tracking-widest"
                >
                  View {comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}
                </button>
              )}

              {showReplies && (
                <div className="space-y-4">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onReply={onReply}
                      onLike={onLike}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
