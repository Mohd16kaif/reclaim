export interface ChapterData {
  index: number;
  name: string;
  tagline: string;
  totalDays: number;
  startDay: number;
  endDay: number;
}

export const CHAPTERS: ChapterData[] = [
  {
    index: 1,
    name: 'Awareness',
    tagline: 'Recognizing the pattern is the first act of change.',
    totalDays: 7,
    startDay: 1,
    endDay: 7,
  },
  {
    index: 2,
    name: 'Detachment',
    tagline: 'Stepping back creates space for new habits.',
    totalDays: 10,
    startDay: 8,
    endDay: 17,
  },
  {
    index: 3,
    name: 'Stability',
    tagline: 'Consistency builds a solid foundation.',
    totalDays: 13,
    startDay: 18,
    endDay: 30,
  },
  {
    index: 4,
    name: 'Discipline',
    tagline: 'Daily habits sustain long‑term change.',
    totalDays: 16,
    startDay: 31,
    endDay: 46,
  },
  {
    index: 5,
    name: 'Confidence',
    tagline: 'Trusting yourself fuels progress.',
    totalDays: 18,
    startDay: 47,
    endDay: 64,
  },
  {
    index: 6,
    name: 'Mastery',
    tagline: 'Full ownership of your recovery journey.',
    totalDays: 21,
    startDay: 65,
    endDay: 85,
  },
  {
    index: 7,
    name: 'Freedom',
    tagline: 'Living without the hold of the addiction.',
    totalDays: 25,
    startDay: 86,
    endDay: 110,
  },
];
