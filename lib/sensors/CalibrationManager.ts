/**
 * Tracks manual figure-eight calibration progress across compass octants.
 */
export class CalibrationManager {
  private visitedOctants: Set<number> = new Set()
  private _calibrationProgress = 0

  update(heading: number): number {
    const octant = Math.floor((((heading % 360) + 360) % 360) / 45)
    this.visitedOctants.add(octant)
    this._calibrationProgress = Math.min(
      100,
      Math.round((this.visitedOctants.size / 8) * 100)
    )
    return this._calibrationProgress
  }

  markCalibrated(): void {
    this._calibrationProgress = 100
  }

  get calibrationProgress(): number {
    return this._calibrationProgress
  }

  reset(): void {
    this.visitedOctants.clear()
    this._calibrationProgress = 0
  }
}
