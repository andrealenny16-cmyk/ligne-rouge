"use client";

import { useActionState, useState } from "react";
import { addReview } from "@/app/actions";

export default function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const [state, action, pending] = useActionState(addReview, null);
  const [rating, setRating] = useState(5);
  if (state?.ok) return <p className="text-legal">{state.message}</p>;
  return (
    <form action={action} className="glass space-y-3 rounded-3xl p-5">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />
      <p className="label">Ton avis</p>
      <div className="flex gap-1 text-2xl" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} onClick={() => setRating(n)} className={n <= rating ? "text-bronze" : "text-white/20"}>
            ★
          </button>
        ))}
      </div>
      <textarea name="comment" required minLength={3} rows={3} className="field" placeholder="Le son, le montage, les sensations…" />
      {state && !state.ok && <p className="text-sm text-[#ff7a84]">{state.error}</p>}
      <button disabled={pending} className="rounded-full bg-bronze px-6 py-2.5 font-bold text-ink disabled:opacity-50">
        {pending ? "Envoi…" : "Publier"}
      </button>
    </form>
  );
}
