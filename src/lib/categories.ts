import { Code2, GitBranch, type LucideIcon } from "lucide-react";

export interface CategoryMeta {
  slug: string;
  label: string;
  description: string;
  longDescription: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
}

const categories: CategoryMeta[] = [
  {
    slug: "python",
    label: "Python",
    description:
      "From zero to confident — variables, data structures, functions, and beyond.",
    longDescription:
      "This series takes you from your very first Python script to writing clean, modular code. You will master variables, strings, numbers, lists, tuples, dictionaries, control flow, functions, and modules — each concept explained with hands-on examples you can run immediately.",
    icon: Code2,
    color: "text-emerald-500",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    slug: "dsa",
    label: "Data Structures & Algorithms",
    description:
      "Big-O, recursion, sorting, searching — the CS fundamentals that make you a stronger engineer.",
    longDescription:
      "Understand the building blocks of efficient software. This track covers algorithmic complexity analysis, recursion, common sorting and searching algorithms, and the data structures that underpin every tech interview and production system.",
    icon: GitBranch,
    color: "text-blue-500",
    gradient: "from-blue-500/20 to-blue-500/5",
  },
];

export function getCategoryMeta(slug: string): CategoryMeta | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getAllCategoryMetas(): CategoryMeta[] {
  return categories;
}
