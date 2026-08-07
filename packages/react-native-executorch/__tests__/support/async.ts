/**
 * Microtask helpers for driving promise-based code deterministically.
 *
 * The fetcher and the pipelines never use timers, so their whole state machine
 * advances on microtasks. Spinning microtasks until a condition holds is both
 * deterministic and free of the arbitrary sleeps that make async tests flaky.
 */

/**
 * Yields to the microtask queue until `predicate` holds.
 * @param predicate The condition to wait for.
 * @param what What is being waited for, used in the timeout message.
 * @param maxTicks How many microtasks to spin before giving up.
 */
export async function until(predicate: () => boolean, what: string, maxTicks = 100): Promise<void> {
  for (let tick = 0; tick < maxTicks; tick++) {
    if (predicate()) return;
    await Promise.resolve();
  }
  throw new Error(`Timed out after ${maxTicks} microtasks waiting for ${what}.`);
}

/**
 * Drains the microtask queue.
 * @param ticks How many microtasks to yield.
 */
export async function flush(ticks = 20): Promise<void> {
  for (let tick = 0; tick < ticks; tick++) await Promise.resolve();
}
