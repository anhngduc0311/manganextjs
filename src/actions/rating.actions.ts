"use server";

import { rateComicAction as rateAction } from "@/actions/comic.actions";
import type { ActionResult } from "@/types";

export async function rateComicAction(
  comicId: string,
  score: number
): Promise<ActionResult<{ ratingAvg: number; ratingCount: number }>> {
  return rateAction(comicId, score);
}

