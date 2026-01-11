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

  