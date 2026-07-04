import type { AlgorithmDef, Frame } from "../types";

export const insertionSort: AlgorithmDef = {
  id: "insertion-sort",
  name: "Insertion Sort",
  category: "sorting",
  timeComplexity: "O(n²)",
  spaceComplexity: "O(1)",
  description:
    "Builds the sorted array one element at a time by inserting each element into its correct position.",
  defaultInput: [12, 11, 13, 5, 6, 90, 34, 22],
  code: `function insertionSort(arr) {
  const n = arr.length;
  for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`,
  generateFrames(input: number[]): Frame[] {
    const arr = [...input];
    const n = arr.length;
    const frames: Frame[] = [];

    frames.push({
      array: [...arr],
      highlights: { 0: "sorted" },
      description: "Initial array. First element is trivially sorted.",
      codeLine: 0,
      pointers: {},
    });

    for (let i = 1; i < n; i++) {
      const key = arr[i];
      let j = i - 1;

      const sortedHighlights: Frame["highlights"] = { [i]: "active" };
      for (let k = 0; k < i; k++) sortedHighlights[k] = "sorted";
      frames.push({
        array: [...arr],
        highlights: sortedHighlights,
        description: `Picking key=${key} at index ${i}. Will insert into sorted portion.`,
        codeLine: 3,
        pointers: { i, key: i },
      });

      while (j >= 0 && arr[j] > key) {
        frames.push({
          array: [...arr],
          highlights: { [j]: "comparing", [i]: "active" },
          description: `arr[${j}]=${arr[j]} > key=${key}. Shifting arr[${j}] right.`,
          codeLine: 5,
          pointers: { j, key: i },
        });

        arr[j + 1] = arr[j];
        j--;

        frames.push({
          array: [...arr],
          highlights: { [j + 1]: "swapping" },
          description: `Shifted. Checking next position.`,
          codeLine: 6,
          pointers: { j: j + 1 },
        });
      }

      arr[j + 1] = key;
      const afterInsert: Frame["highlights"] = { [j + 1]: "pivot" };
      for (let k = 0; k <= i; k++) if (k !== j + 1) afterInsert[k] = "sorted";
      frames.push({
        array: [...arr],
        highlights: afterInsert,
        description: `Inserted key=${key} at index ${j + 1}.`,
        codeLine: 9,
        pointers: { inserted: j + 1 },
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
