/**
 * Time-based cancellation refund policy:
 *  - Full refund if cancelled 24+ hours before the trip's start time.
 *  - 50% refund if cancelled less than 24 hours before start.
 *  - No refund once the trip has started (startDate already passed) or
 *    once it's already marked ongoing.
 *
 * `now` is injectable for deterministic testing; defaults to the real
 * current time in production use.
 */
export function calculateRefundAmount(
  totalAmount: number,
  startDate: Date,
  isOngoing: boolean,
  now: Date = new Date()
): number {
  if (isOngoing) return 0;

  const hoursToStart = (startDate.getTime() - now.getTime()) / (60 * 60 * 1000);

  if (hoursToStart >= 24) return totalAmount;
  if (hoursToStart >= 0) return Math.round(totalAmount * 0.5);
  return 0;
}
