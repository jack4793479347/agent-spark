'use client';

import { useState } from 'react';
import { Star, ThumbsUp, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReviewData {
  id: string;
  rating: number;
  title?: string;
  body?: string;
  helpful_count: number;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
  interactive?: boolean;
}

function StarRating({ value, onChange, size = 'sm', interactive = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={cn(
            interactive && 'cursor-pointer hover:scale-110 transition-transform',
            !interactive && 'cursor-default'
          )}
        >
          <Star
            className={cn(
              iconSize,
              (hovered || value) >= star
                ? 'text-warning fill-warning'
                : 'text-bg-tertiary'
            )}
            strokeWidth={1.75}
          />
        </button>
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface ReviewItemProps {
  review: ReviewData;
  onHelpful: (reviewId: string) => void;
}

function ReviewItem({ review, onHelpful }: ReviewItemProps) {
  return (
    <div className="py-4 border-b border-bg-tertiary last:border-b-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-xs font-medium text-text-primary">
              {review.profiles?.display_name ?? 'Anonymous'}
            </span>
            <span className="text-[10px] text-text-tertiary ml-2">
              {formatDate(review.created_at)}
            </span>
          </div>
        </div>
        <StarRating value={review.rating} size="sm" />
      </div>

      {review.title && (
        <h5 className="text-sm font-semibold text-text-primary mb-1">{review.title}</h5>
      )}
      {review.body && (
        <p className="text-sm text-text-secondary leading-relaxed">{review.body}</p>
      )}

      <button
        onClick={() => onHelpful(review.id)}
        className="flex items-center gap-1 mt-2 text-[11px] text-text-tertiary hover:text-accent-primary transition-colors"
      >
        <ThumbsUp className="w-3 h-3" strokeWidth={1.75} />
        Helpful ({review.helpful_count})
      </button>
    </div>
  );
}

// ─── Write Review Form ──────────────────────────────────────────

interface WriteReviewFormProps {
  agentSlug: string;
  onSubmitted: () => void;
}

function WriteReviewForm({ agentSlug, onSubmitted }: WriteReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(undefined);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/marketplace/agent/${agentSlug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          body: body.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed (${res.status})`);
      }

      setRating(0);
      setTitle('');
      setBody('');
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-text-secondary font-medium block mb-1.5">Rating</label>
        <StarRating value={rating} onChange={setRating} size="md" interactive />
      </div>

      <div>
        <label className="text-xs text-text-secondary font-medium block mb-1.5">
          Title <span className="text-text-tertiary">(optional)</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Summarize your experience"
          className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="text-xs text-text-secondary font-medium block mb-1.5">
          Review <span className="text-text-tertiary">(optional)</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Share details about your experience..."
          className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors resize-none"
        />
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      <button
        type="submit"
        disabled={rating === 0 || submitting}
        className={cn(
          'btn-primary text-sm flex items-center gap-1.5',
          (rating === 0 || submitting) && 'opacity-60 cursor-not-allowed'
        )}
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit Review
      </button>
    </form>
  );
}

// ─── Main Component ─────────────────────────────────────────────

interface AgentReviewsProps {
  agentSlug: string;
  agentId: string;
  avgRating: number;
  reviewCount: number;
  className?: string;
}

export function AgentReviews({
  agentSlug,
  agentId,
  avgRating,
  reviewCount,
  className,
}: AgentReviewsProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadReviews = async (page = 1) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/marketplace/agent/${agentSlug}/reviews?page=${page}`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
        setTotalPages(data.totalPages ?? 1);
        setCurrentPage(page);
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    await fetch(`${apiUrl}/api/marketplace/agent/${agentSlug}/reviews/${reviewId}/helpful`, {
      method: 'POST',
      credentials: 'include',
    });

    // Optimistic update
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
      )
    );
  };

  // Load reviews on first render
  if (!loaded && !loading) {
    loadReviews();
  }

  return (
    <div className={cn('', className)}>
      {/* Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-warning fill-warning" strokeWidth={1.75} />
            <span className="text-lg font-heading font-bold text-text-primary">
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </span>
          </div>
          <span className="text-sm text-text-tertiary">
            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </span>
        </div>
        <button
          onClick={() => setShowWriteForm(!showWriteForm)}
          className="btn-secondary text-xs"
        >
          {showWriteForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {/* Write form */}
      {showWriteForm && (
        <div className="mb-6 p-4 rounded-[var(--radius-lg)] bg-bg-tertiary/50">
          <WriteReviewForm
            agentSlug={agentSlug}
            onSubmitted={() => {
              setShowWriteForm(false);
              loadReviews(1);
            }}
          />
        </div>
      )}

      {/* Review list */}
      {loading && !loaded ? (
        <div className="py-8 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-text-tertiary mx-auto" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-text-tertiary py-4">
          No reviews yet. Be the first to review this agent!
        </p>
      ) : (
        <>
          <div>
            {reviews.map((review) => (
              <ReviewItem key={review.id} review={review} onHelpful={handleHelpful} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => loadReviews(p)}
                  className={cn(
                    'w-8 h-8 rounded-md text-xs font-medium transition-colors',
                    p === currentPage
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
