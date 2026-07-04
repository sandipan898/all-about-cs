import type { AlgorithmDef, Frame } from "../types";

export const binarySearch: AlgorithmDef = {
  id: "binary-search",
  name: "Binary Search",
  category: "searching",
  timeComplexity: "O(log n)",
  spaceComplexity: "O(1)",
  description:
    "Efficiently searches a sorted array by repeatedly halving the search space.",
  defaultInput: [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91],
  code: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1; // Not found
}`,
  generateFrames(input: number[]): Frame[] {
    const arr = [...input].sort((a, b) => a - b);
    // Pick a target that exists for a meaningful demo
    const targetIdx = Math.floor(arr.length * 0.7);
    const target = arr[targetIdx];
    const frames: Frame[] = [];

    frames.push({
      array: [...arr],
      highlights: {},
      description: `Sorted array. Searching for target = ${target}.`,
      codeLine: 0,
      pointers: {},
    });

    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      // Show search window
      const highlights: Frame["highlights"] = {};
      for (let k = left; k <= right; k++) highlights[k] = "active";
      highlights[mid] = "comparing";
      frames.push({
        array: [...arr],
        highlights,
        description: `Search window [${left}..${right}]. Checking mid=${mid}: arr[${mid}]=${arr[mid]}`,
        codeLine: 4,
        pointers: { left, right, mid },
      });

      if (arr[mid] === target) {
        frames.push({
          array: [...arr],
          highlights: { [mid]: "found" },
          description: `Found target ${target} at index ${mid}!`,
          codeLine: 5,
          pointers: { mid },
        });
        return frames;
      }

      if (arr[mid] < target) {
        frames.push({
          array: [...arr],
          highlights: { [mid]: "left-partition" },
          description: `arr[${mid}]=${arr[mid]} < target=${target}. Eliminating left half. Move left to ${mid + 1}.`,
          codeLine: 6,
          pointers: { left: mid + 1, right },
        });
        left = mid + 1;
      } else {
        frames.push({
          array: [...arr],
          highlights: { [mid]: "right-partition" },
          description: `arr[${mid}]=${arr[mid]} > target=${target}. Eliminating right half. Move right to ${mid - 1}.`,
          codeLine: 7,
          pointers: { left, right: mid - 1 },
        });
        right = mid - 1;
      }
    }

    frames.push({
      array: [...arr],
      highlights: {},
      description: `Target ${target} not found.`,
      codeLine: 9,
      pointers: {},
    });

    return frames;
  },
};
