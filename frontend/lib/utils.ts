import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function randomInt(min: number, max: number): number {
  const range = max - min + 1
  return Math.floor(Math.random() * range) + min
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))

  
}
