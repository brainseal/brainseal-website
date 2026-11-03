// Steam review summaries, fetched once per build. The nightly rebuild keeps them current.
// If Steam can't be reached the site still builds, just without review badges.

export interface Review {
  score: number; // Steam's 1–9 scale; 6 = Mostly Positive, 8 = Very Positive
  label: string;
  percent: number;
  count: number;
}

// Below this, badges stay off the page (Mixed and worse).
export const MIN_BADGE_SCORE = 6;

export async function fetchReviews(appIds: number[]): Promise<Record<number, Review>> {
  const input = {
    ids: appIds.map((appid) => ({ appid })),
    context: { language: 'english', country_code: 'US' },
    data_request: { include_reviews: true },
  };
  try {
    const res = await fetch(
      `https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=${encodeURIComponent(JSON.stringify(input))}`,
      { signal: AbortSignal.timeout(15000) },
    );
    const items: any[] = (await res.json()).response?.store_items ?? [];
    return Object.fromEntries(
      items
        .filter((i) => i.reviews?.summary_filtered?.review_count > 0)
        .map((i) => {
          const s = i.reviews.summary_filtered;
          return [i.appid, { score: s.review_score, label: s.review_score_label, percent: s.percent_positive, count: s.review_count }];
        }),
    );
  } catch (err) {
    console.warn(`Steam reviews unavailable, building without them: ${err}`);
    return {};
  }
}
