"use client";

import type { MDXComponents } from "mdx/types";
import { YouTubeEmbed } from "./youtube-embed";

/**
 * Custom MDX component overrides.
 * Maps component names used in .mdx files to actual React components.
 *
 * The YouTubeEmbed used inside MDX is a *context-unaware* version —
 * it always renders the collapsed card in Read mode and the sticky
 * player in Watch mode, powered by DualModeProvider from the layout.
 */
export function useMDXComponents(): MDXComponents {
  return {
    YouTubeEmbed,
  };
}
