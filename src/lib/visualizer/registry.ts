/**
 * Algorithm Registry — single source of truth for all visualizable algorithms.
 * Import from here; never import individual algorithm files directly in pages.
 */

import { bubbleSort } from "./algorithms/bubble-sort";
import { selectionSort } from "./algorithms/selection-sort";
import { insertionSort } from "./algorithms/insertion-sort";
import { mergeSort } from "./algorithms/merge-sort";
import { quickSort } from "./algorithms/quick-sort";
import { linearSearch } from "./algorithms/linear-search";
import { binarySearch } from "./algorithms/binary-search";
import { twoPointer } from "./algorithms/two-pointer";
import type { AlgorithmCategory, AlgorithmDef } from "./types";

export const ALGORITHMS: AlgorithmDef[] = [
  bubbleSort,
  selectionSort,
  insertionSort,
  mergeSort,
  quickSort,
  linearSearch,
  binarySearch,
  twoPointer,
];

export const ALGORITHM_MAP: Record<string, AlgorithmDef> = Object.fromEntries(
  ALGORITHMS.map((a) => [a.id, a])
);

export function getAlgorithm(id: string): AlgorithmDef | undefined {
  return ALGORITHM_MAP[id];
}

export function getAlgorithmsByCategory(
  category: AlgorithmCategory
): AlgorithmDef[] {
  return ALGORITHMS.filter((a) => a.category === category);
}

export const CATEGORIES: { id: AlgorithmCategory; label: string }[] = [
  { id: "sorting", label: "Sorting" },
  { id: "searching", label: "Searching" },
  { id: "technique", label: "Techniques" },
];
