/**
 * Creates a promise that resolves after a specified delay.
 *
 * @param ms - The delay in milliseconds
 * @param options - Optional configuration
 * @param options.speedMultiplier - Multiplier to adjust delay duration (default: 1)
 * @param options.maxDuration - Maximum duration in milliseconds (useful for reduced motion)
 * @returns Promise that resolves after the delay
 */
export function delay(
  ms: number,
  options?: {
    speedMultiplier?: number;
    maxDuration?: number;
  }
): Promise<void> {
  const { speedMultiplier = 1, maxDuration } = options ?? {};
  let duration = ms * speedMultiplier;

  if (maxDuration !== undefined) {
    duration = Math.min(duration, maxDuration);
  }

  return new Promise((resolve) => setTimeout(resolve, duration));
}
