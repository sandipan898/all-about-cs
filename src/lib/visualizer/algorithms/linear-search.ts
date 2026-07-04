import type { AlgorithmDef, Frame } from "../types";

export const linearSearch: AlgorithmDef = {
  id: "linear-search",
  name: "Linear Search",
  category: "searching",
  timeComplexity: "O(n)",
  spaceComplexity: "O(1)",
  description:
    "Sequentially checks each element until the target is found or the list ends.",
  defaultInput: [23, 45, 12, 67, 34, 89, 56, 78],
  code: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i; // Found!
    }
  }
  return -1; // Not found
}`,
  generateFrames(input: number[]): Frame[] {
    const arr = [...input];
    // Search for a value that exists (pick element at ~60% position for drama)
    const targetIdx = Math.floor(arr.length * 0.6);
    const target = arr[targetIdx];
    const frames: Frame[] = [];

    frames.push({
      array: [...arr],
      highlights: {},
      description: `Searching for target = ${target} in the array.`,
      codeLine: 0,
      pointers: { target: -1 },
    });

    for (let i = 0; i < arr.length; i++) {
      frames.push({
        array: [...arr],
        highlights: { [i]: "comparing" },
        description: `Checking index ${i}: arr[${i}]=${arr[i]} ${arr[i] === target ? "==" : "!="} target=${target}`,
        codeLine: 2,
        pointers: { i },
      });

      if (arr[i] === target) {
        frames.push({
          array: [...arr],
          highlights: { [i]: "found" },
          description: `Found target ${target} at index ${i}!`,
          codeLine: 3,
          pointers: { i },
        });
        return frames;
      }
    }

    frames.push({
      array: [...arr],
      highlights: {},
      description: `Target ${target} not found in the array.`,
      codeLine: 6,
      pointers: {},
    });

    return frames;
  },
};
