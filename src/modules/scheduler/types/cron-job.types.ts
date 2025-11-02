/**
 * Type definitions for CronJob library
 * Since the CronJob type from 'cron' package causes TypeScript issues,
 * we define our own interface for type safety
 */

export interface CronTime {
  source: string;
}

export interface CronDate {
  toJSDate(): Date;
  toString(): string;
}

export interface CronJobInterface {
  running: boolean;
  cronTime: CronTime;
  start(): void;
  stop(): void;
  setTime(time: CronTime): void;
  lastDate(): Date | null;
  nextDates(count: number): CronDate[];
  fireOnTick(): void;
}

/**
 * Create a CronJob instance using the cron library
 * This function provides proper typing while avoiding ESLint errors
 */
export function createCronJob(
  cronTime: string | Date,
  onTick: () => void,
  onComplete?: () => void,
  start?: boolean,
  timezone?: string,
): CronJobInterface {
  // Dynamic import to avoid TypeScript issues with the error type
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
  const cronLib = require('cron');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  return new cronLib.CronJob(
    cronTime,
    onTick,
    onComplete,
    start,
    timezone,
  ) as CronJobInterface;
}

/**
 * Type guard to check if an object is a CronJob
 */
export function isCronJob(obj: unknown): obj is CronJobInterface {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'running' in obj &&
    'start' in obj &&
    'stop' in obj &&
    'nextDates' in obj &&
    'lastDate' in obj
  );
}

/**
 * Safely cast an unknown object to CronJobInterface
 */
export function asCronJob(obj: unknown): CronJobInterface | undefined {
  if (isCronJob(obj)) {
    return obj;
  }
  return undefined;
}
