/**
 * Generate a unique simulation ID
 * If replaying a simulation, appends retry count to original ID
 */
export async function generateSimulationId(): Promise<string> {
  // Check if we're replaying a simulation
  const isReplay = typeof window !== "undefined" && sessionStorage.getItem("isReplay") === "true"
  const originalId = typeof window !== "undefined" ? sessionStorage.getItem("originalSimulationId") : null
  const retryCount = typeof window !== "undefined" ? sessionStorage.getItem(`retryCount_${originalId}`) : null

  if (isReplay && originalId && retryCount) {
    // Format the retry number with leading zero
    const retryNumberFormatted = retryCount.toString().padStart(2, "0")
    return `${originalId}-${retryNumberFormatted}`
  }

  // Generate a new simulation ID for a fresh simulation
  const simulationId =
    "SIM-" +
    Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, "0")

  return simulationId
}

/**
 * Check if a simulation ID follows the pattern of a replay.
 * A replay ID ends with a dash and two digits (e.g., original-01)
 */
export function isReplaySimulation(simulationId: string): boolean {
    return /^.*-\d{2}$/.test(simulationId);
  }

  /**
   * Extract the original simulation ID from a replay ID.
   * If it's a replay (ends with -XX), remove the suffix.
   */
  export function getOriginalSimulationId(replayId: string): string {
    if (isReplaySimulation(replayId)) {
      return replayId.replace(/-\d{2}$/, "");
    }

    // Otherwise, it's already an original ID
    return replayId;
  }


