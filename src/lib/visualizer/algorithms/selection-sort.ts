import type { AlgorithmDef, Frame } from "../types";

export const selectionSort: AlgorithmDef = {
  id: "selection-sort",
  name: "Selection Sort",
  category: "sorting",
  timeComplexity: "O(n²)",
  spaceComplexity: "O(1)",
  description:
    "Finds the minimum element from the unsorted portion and places it at the beginning.",
  defaultInput: [64, 25, 12, 22, 11, 90, 34, 45],
  code: `function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
  return arr;
}`,
  generateFrames(input: number[]): Frame[] {
    const arr = [...input];
    const n = arr.length;
    const frames: Frame[] = [];

    frames.push({
      array: [...arr],
      highlights: {},
      description: "Initial array. Starting Selection Sort.",
      codeLine: 0,
      pointers: {},
    });

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;

      frames.push({
        array: [...arr],
        highlights: { [i]: "active" },
        description: `Looking for minimum in unsorted portion starting at index ${i}.`,
        codeLine: 3,
        pointers: { i, minIdx: i },
      });

      for (let j = i + 1; j < n; j++) {
        frames.push({
          array: [...arr],
          highlights: {
            [j]: "comparing",
            [minIdx]: "pivot",
            ...(i !== minIdx ? { [i]: "active" } : {}),
          },
          description: `Comparing arr[${j}]=${arr[j]} with current min arr[${minIdx}]=${arr[minIdx]}`,
          codeLine: 5,
          pointers: { i, j, minIdx },
        });

        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          frames.push({
            array: [...arr],
            highlights: { [minIdx]: "pivot", [i]: "active" },
            description: `New minimum found: arr[${minIdx}]=${arr[minIdx]}`,
            codeLine: 6,
            pointers: { i, minIdx },
          });
        }
      }

      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        frames.push({
          array: [...arr],
          highlights: { [i]: "swapping", [minIdx]: "swapping" },
          description: `Swapped arr[${i}] and arr[${minIdx}]. Position ${i} is now sorted.`,
          codeLine: 9,
          pointers: { i, minIdx },
        });
      }

      // Mark sorted
      const sorted: Frame["highlights"] = {};
      for (let k = 0; k <= i; k++) sorted[k] = "sorted";
      frames.push({
        array: [...arr],
        highlights: sorted,
        description: `Element at index ${i} is in its final position.`,
        codeLine: 2,
        pointers: {},
      });
    }

    const allSorted: Frame["highlights"] = {};
    for (let k = 0; k < n; k++) allSorted[k] = "sorted";
    frames.push({
      array: [...arr],
      highlights: allSorted,
      description: "Array is fully sorted!",
      codeLine: 11,
      pointers: {},
    });

    return frames;
  },
};
