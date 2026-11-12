import type { Tier } from "../types";

/** A box in percent of the card (the back templates are 2:3). */
export interface Box { top: number; left: number; width: number; height: number }
export interface BackBoxes { title: Box; text1: Box; text2?: Box; visual?: Box; quiz?: Box }

// Measured on app/public/cards/full/back_<category>_<tier>.webp: every category shares the same
// panel positions, so one map per tier is enough. Each tier adds one panel below the previous ones.
const TITLE: Box = { top: 12.4, left: 8.7, width: 82.7, height: 6.2 }; // dark bar under the category banner
const TEXT1: Box = { top: 26.6, left: 9.1, width: 81.8, height: 9.8 }; // first light-blue panel
const TEXT2: Box = { top: 38.5, left: 9.1, width: 81.8, height: 9.8 }; // second light-blue panel
const VISUAL: Box = { top: 49.8, left: 9.1, width: 81.8, height: 22.3 }; // rink panel (drawn over: see .back-visual)
const QUIZ: Box = { top: 73.7, left: 9.1, width: 81.8, height: 15.1 }; // panel with four answer slots (drawn over: see .back-quiz)

export const BACK_LAYOUT: Record<Tier, BackBoxes> = {
  normal: { title: TITLE, text1: TEXT1 },
  silver: { title: TITLE, text1: TEXT1, text2: TEXT2 },
  gold: { title: TITLE, text1: TEXT1, text2: TEXT2, visual: VISUAL },
  diamond: { title: TITLE, text1: TEXT1, text2: TEXT2, visual: VISUAL, quiz: QUIZ },
};
