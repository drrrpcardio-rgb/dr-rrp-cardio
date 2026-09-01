import { type ClassValue, clsx } from "clsx";

/** Merge conditional class names. Thin wrapper so components don't import clsx directly. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
