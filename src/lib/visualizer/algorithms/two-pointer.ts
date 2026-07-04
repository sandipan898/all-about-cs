import type { AlgorithmDef, Frame } from "../types";

export const twoPointer: AlgorithmDef = {
  id: "two-pointer",
  name: "Two Pointer (Two Sum)",
  category: "technique",
  timeComplexity: "O(n)",
  spaceComplexity: "O(1)",
  description:
    "Uses two pointers converging from both ends of a sorted array to find a pair that sums to a target.",
  defaultInput: [2, 7, 11, 15, 19, 23, 28, 34],
  code: `function twoSum(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) {
      return [left, right];
    } else if (sum < target) {
      left++;
    } else {
      right--;
    }
  }
  return null; // No pair found
}`,
  generateFrames(input: number[]): Frame[] {
    const arr = [...input].sort((a, b) => a - b);
    // Pick a target that exists as a valid pair sum
    const target = arr[1] + arr[arr.length - 2];
    const frames: Frame[] = [];

    frames.push({
      array: [...arr],
      highlights: {},
      description: `Sorted array. Finding two numbers that sum to ${target}.`,
      codeLine: 0,
      pointers: {},
    });

    let left = 0;
    let right = arr.length - 1;

    while (left < right) {
      const sum = arr[left] + arr[right];

      frames.push({
        array: [...arr],
        highlights: { [left]: "active", [right]: "active" },
        description: `left=${left}, right=${right}. Sum = arr[${left}]+arr[${right}] = ${arr[left]}+${arr[right]} = ${sum}. Target = ${target}.`,
        codeLine: 4,
        pointers: { left, right },
      });

      if (sum === target) {
        frames.push({
          array: [...arr],
          highlights: { [left]: "found", [right]: "found" },
          description: `Found! arr[${left}]=${arr[left]} + arr[${right}]=${arr[right]} = ${target}`,
          codeLine: 6,
          pointers: { left, right },
        });
        return frames;
      } else if (sum < target) {
        frames.push({
          array: [...arr],
          highlights: { [left]: "left-partition", [right]: "active" },
          description: `Sum ${sum} < target ${target}. Move left pointer right.`,
          codeLine: 8,
          pointers: { left: left + 1, right },
        });
        left++;
      } else {
        frames.push({
          array: [...arr],
          highlights: { [left]: "active", [right]: "right-partition" },
          description: `Sum ${sum} > target ${target}. Move right pointer left.`,
          codeLine: 10,
          pointers: { left, right: right - 1 },
        });
        right--;
      }
    }

    frames.push({
      array: [...arr],
      highlights: {},
      description: `No pair found that sums to ${target}.`,
      codeLine: 13,
      pointers: {},
    });

    return frames;
  },
};
