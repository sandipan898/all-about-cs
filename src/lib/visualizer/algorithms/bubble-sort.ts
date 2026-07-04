import type { AlgorithmDef, Frame } from "../types";

export const bubbleSort: AlgorithmDef = {
  id: "bubble-sort",
  name: "Bubble Sort",
  category: "sorting",
  timeComplexity: "O(n²)",
  spaceComplexity: "O(1)",
  description:
    "Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.",
  defaultInput: [64, 34, 25, 12, 22, 11, 90, 45],
  code: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
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
      description: "Initial array. Starting Bubble Sort.",
      codeLine: 0,
      pointers: {},
    });

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        // Comparing
        frames.push({
          array: [...arr],
          highlights: { [j]: "comparing", [j + 1]: "comparing" },
          description: `Comparing arr[${j}]=${arr[j]} and arr[${j + 1}]=${arr[j + 1]}`,
          codeLine: 4,
          pointers: { j: j, "j+1": j + 1 },
        });

        if (arr[j] > arr[j + 1]) {
          // Swap
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          frames.push({
            array: [...arr],
            highlights: { [j]: "swapping", [j + 1]: "swapping" },
            description: `Swapped arr[${j}] and arr[${j + 1}]`,
            codeLine: 5,
            pointers: { j: j, "j+1": j + 1 },
          });
        }
      }
      // Mark sorted
      const sorted: Frame["highlights"] = {};
      for (let k = n - i - 1; k < n; k++) sorted[k] = "sorted";
      frames.push({
        array: [...arr],
        highlights: sorted,
        description: `Pass ${i + 1} complete. Element at index ${n - i - 1} is in its final position.`,
        codeLine: 2,
        pointers: {},
      });
    }

    // Final frame — all sorted
    const allSorted: Frame["highlights"] = {};
    for (let k = 0; k < n; k++) allSorted[k] = "sorted";
    frames.push({
      array: [...arr],
      highlights: allSorted,
      description: "Array is fully sorted!",
      codeLine: 9,
      pointers: {},
    });

    return frames;
  },
};
