import type { AlgorithmDef, Frame } from "../types";

export const mergeSort: AlgorithmDef = {
  id: "merge-sort",
  name: "Merge Sort",
  category: "sorting",
  timeComplexity: "O(n log n)",
  spaceComplexity: "O(n)",
  description:
    "Divides the array into halves, recursively sorts them, then merges the sorted halves.",
  defaultInput: [38, 27, 43, 3, 9, 82, 10, 45],
  code: `function mergeSort(arr, l, r) {
  if (l >= r) return;
  const mid = Math.floor((l + r) / 2);
  mergeSort(arr, l, mid);
  mergeSort(arr, mid + 1, r);
  merge(arr, l, mid, r);
}

function merge(arr, l, mid, r) {
  const left = arr.slice(l, mid + 1);
  const right = arr.slice(mid + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) arr[k++] = left[i++];
    else arr[k++] = right[j++];
  }
  while (i < left.length) arr[k++] = left[i++];
  while (j < right.length) arr[k++] = right[j++];
}`,
  generateFrames(input: number[]): Frame[] {
    const arr = [...input];
    const frames: Frame[] = [];

    frames.push({
      array: [...arr],
      highlights: {},
      description: "Initial array. Starting Merge Sort.",
      codeLine: 0,
      pointers: {},
    });

    function mergeSortHelper(l: number, r: number) {
      if (l >= r) return;

      const mid = Math.floor((l + r) / 2);

      // Show divide
      const divideHighlights: Frame["highlights"] = {};
      for (let k = l; k <= mid; k++) divideHighlights[k] = "left-partition";
      for (let k = mid + 1; k <= r; k++)
        divideHighlights[k] = "right-partition";
      frames.push({
        array: [...arr],
        highlights: divideHighlights,
        description: `Dividing [${l}..${r}] at mid=${mid}. Left: [${l}..${mid}], Right: [${mid + 1}..${r}]`,
        codeLine: 2,
        pointers: { l, mid, r },
      });

      mergeSortHelper(l, mid);
      mergeSortHelper(mid + 1, r);

      // Merge
      const left = arr.slice(l, mid + 1);
      const right = arr.slice(mid + 1, r + 1);
      let i = 0,
        j = 0,
        k = l;

      frames.push({
        array: [...arr],
        highlights: (() => {
          const h: Frame["highlights"] = {};
          for (let x = l; x <= r; x++) h[x] = "comparing";
          return h;
        })(),
        description: `Merging [${l}..${mid}] and [${mid + 1}..${r}]`,
        codeLine: 8,
        pointers: { l, mid, r },
      });

      while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
          arr[k] = left[i];
          i++;
        } else {
          arr[k] = right[j];
          j++;
        }
        frames.push({
          array: [...arr],
          highlights: { [k]: "merged" },
          description: `Placed ${arr[k]} at index ${k}`,
          codeLine: 13,
          pointers: { k },
        });
        k++;
      }

      while (i < left.length) {
        arr[k] = left[i];
        frames.push({
          array: [...arr],
          highlights: { [k]: "merged" },
          description: `Placed remaining ${arr[k]} at index ${k}`,
          codeLine: 16,
          pointers: { k },
        });
        i++;
        k++;
      }

      while (j < right.length) {
        arr[k] = right[j];
        frames.push({
          array: [...arr],
          highlights: { [k]: "merged" },
          description: `Placed remaining ${arr[k]} at index ${k}`,
          codeLine: 17,
          pointers: { k },
        });
        j++;
        k++;
      }

      // Show merged section
      const mergedHighlights: Frame["highlights"] = {};
      for (let x = l; x <= r; x++) mergedHighlights[x] = "sorted";
      frames.push({
        array: [...arr],
        highlights: mergedHighlights,
        description: `Merged [${l}..${r}]: [${arr.slice(l, r + 1).join(", ")}]`,
        codeLine: 5,
        pointers: { l, r },
      });
    }

    mergeSortHelper(0, arr.length - 1);

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
