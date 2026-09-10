// Centralized MSP (Minimum Support Price) dictionary for context/reference only.
// Values in ₹/Quintal for existing supported commodities.

export const MSP_BENCHMARKS: Record<string, number> = {
  "Wheat": 2275,
  "Soybean": 4892,
  "Rice (Basmati)": 2320,
  "Maize": 2090,
  "Mustard": 5650,
  "Cotton": 7121
};

export function getMspForCrop(crop: string): number | null {
  return MSP_BENCHMARKS[crop] || null;
}

export function formatLotId(id: string | undefined): string {
  if (!id) return "UNKNOWN";
  return `LOT-${id.slice(0, 8).toUpperCase()}`;
}
