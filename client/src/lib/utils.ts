import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

/**
 * Combines class names with Tailwind CSS and utility classes.
 * Uses clsx for conditional classes and twMerge for proper merging of Tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a currency value to a string representation
 * @param cents The amount in cents
 * @param locale The locale to use for formatting
 * @param currency The currency code
 * @returns Formatted currency string
 */
export function formatCurrency(
  cents: number,
  locale: string = "en-US",
  currency: string = "USD"
): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Formats a date to a string representation
 * @param date The date to format
 * @param formatStr The format string to use (defaults to "PPp" - "Apr 29, 2021, 9:30 AM")
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  formatStr: string = "PPp"
): string {
  return format(date, formatStr);
}

/**
 * Truncates a string to a specified length and adds an ellipsis if needed
 * @param str The string to truncate
 * @param length The maximum length of the string
 * @returns Truncated string
 */
export function truncateString(str: string, length: number = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Extracts initials from a name (e.g., "John Doe" -> "JD")
 * @param name Full name
 * @param maxInitials Maximum number of initials to extract
 * @returns String with initials
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  if (!name) return "";
  
  return name
    .split(" ")
    .map(part => part.charAt(0))
    .slice(0, maxInitials)
    .join("")
    .toUpperCase();
}

/**
 * Generates a range of numbers
 * @param start Starting number (inclusive)
 * @param end Ending number (inclusive)
 * @param step Step between numbers
 * @returns Array of numbers
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const result = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Delays execution for a specified time
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounces a function to limit how often it can be called
 * @param fn Function to debounce
 * @param ms Milliseconds to delay
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(this: any, ...args: Parameters<T>): void {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Creates a throttled function that only invokes the provided function at most once per the wait period
 * @param fn Function to throttle
 * @param ms Milliseconds to wait between invocations
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return function(this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}
