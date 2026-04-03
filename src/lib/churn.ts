// Churn Formula Integration

export function calculateChurnScore(daysSilent: number, noActivityLastWeek: boolean): number {
  // Formula: daysSilent × 3 + (noActivityLastWeek ? 50 : 0)
  const score = (daysSilent * 3) + (noActivityLastWeek ? 50 : 0);
  return score > 100 ? 100 : score;
}

export function determineRiskLevel(score: number): "HIGH RISK" | "SILENT" | "ACTIVE" {
  if (score > 80) return "HIGH RISK";
  if (score >= 42) return "SILENT"; // Since 14 days silent * 3 = 42
  return "ACTIVE";
}
