import type { AlgorithmDef, Frame } from "../types";

export const quickSort: AlgorithmDef = {
  id: "quick-sort",
  name: "Quick Sort",
  category: "sorting",
  timeComplexity: "O(n log n) avg",
  spaceComplexity: "O(log n)",
  description:
    "Picks a pivot, partitions the array so smaller elements go left and larger go right, then recurses.",
  defaultInput: [10, 80, 30, 90, 40, 50, 70, 20],
  code: `function quickSort(arr, low, high) {
  if (low < high) {
    const pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}`,
  generateFrames(input: number[]): Frame[] {
    const arr = [...input];
    const frames: Frame[] = [];
    const sortedIndices = new Set<number>();

    frames.push({
      array: [...arr],
      highlights: {},
      description: "Initial array. Starting Quick Sort.",
      codeLine: 0,
      pointers: {},
    });

    function quickSortHelper(low: number, high: number) {
      if (low >= high) {
        if (low === high) sortedIndices.add(low);
        return;
      }

      const pivot = arr[high];
      frames.push({
        array: [...arr],
        highlights: { [high]: "pivot", ...sortedHighlights() },
        description: `Partitioning [${low}..${high}]. Pivot = ${pivot} (at index ${high}).`,
        codeLine: 8,
        pointers: { low, high, pivot: high },
      });

      let i = low - 1;
      for (let j = low; j < high; j++) {
        frames.push({
          array: [...arr],
          highlights: {
            [j]: "comparing",
            [high]: "pivot",
            ...sortedHighlights(),
          },
          description: `Comparing arr[${j}]=${arr[j]} with pivot=${pivot}`,
          codeLine: 11,
          pointers: { i: i + 1, j },
        });

        if (arr[j] < pivot) {
          i++;
          if (i !== j) {
            [arr[i], arr[j]] = [arr[j], arr[i]];
            frames.push({
              array: [...arr],
              highlights: {
                [i]: "swapping",
                [j]: "swapping",
                [high]: "pivot",
                ...sortedHighlights(),
              },
              description: `arr[${j}] < pivot. Swapped arr[${i}] and arr[${j}].`,
              codeLine: 13,
              pointers: { i, j },
            });
          }
        }
      }

      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      const pivotFinal = i + 1;
      sortedIndices.add(pivotFinal);

      frames.push({
        array: [...arr],
        highlights: {
          [pivotFinal]: "sorted",
          ...sortedHighlights(),
        },
        description: `Pivot ${pivot} placed at index ${pivotFinal}. It's in its final position.`,
        codeLine: 16,
        pointers: { pivotFinal },
      });

      quickSortHelper(low, pivotFinal - 1);
      quickSortHelper(pivotFinal + 1, high);
    }

    function sortedHighlights(): Frame["highlights"] {
      const h: Frame["highlights"] = {};
      for (const idx of sortedIndices) h[idx] = "sorted";
      return h;
    }

    quickSortHelper(0, arr.length - 1);

    const allSorted: Frame["highlights"] = {};
    for (let k = 0; k < arr.length; k++) allSorted[k] = "sorted";
    frames.push({
      array: [...arr],
      highlights: allSorted,
      description: "Array is fully sorted!",
      codeLine: 0,
      pointers: {},
    });

    return frames;
  },
};
