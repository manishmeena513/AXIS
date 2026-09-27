/**
 * Simplified magnetic declination lookup.
 * Returns approximate declination in degrees for a given lat/lon.
 * Based on simplified WMM coefficients — good to ~1° accuracy globally.
 */
export function getMagneticDeclination(lat: number, lon: number): number {
  // Simplified model: main dipole + first-order corrections
  // This is a rough approximation of IGRF/WMM without full coefficient tables.
  const phi  = (lat * Math.PI) / 180
  const lam  = (lon * Math.PI) / 180

  // Dipole contribution (dominant term)
  const dipole = -11.5 * Math.sin(phi) * Math.cos(lam + 1.27)

  // Longitude correction
  const lonCorr = 3.0 * Math.cos(phi) * Math.sin(lam)

  // Latitude correction
  const latCorr = 2.5 * Math.sin(2 * phi)

  return dipole + lonCorr + latCorr
}
