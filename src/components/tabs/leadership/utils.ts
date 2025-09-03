export const getPerformanceLevel = (value: number, isEsatScore = false) => {
  if (isEsatScore) {
    // For eSAT score (1-5 scale), calculate thresholds differently
    if (value >= 4.2) return 'high';    // 4.2-5.0 = high
    if (value >= 3.0) return 'medium';  // 3.0-4.1 = medium  
    return 'low';                       // 1.0-2.9 = low
  }

  // For percentage metrics
  if (value >= 70) return 'high';
  if (value >= 50) return 'medium';
  return 'low';
};

export const getBarColor = (level: string) => {
  switch (level) {
    case 'high': return 'bg-gradient-to-r from-green-400 to-green-500 border border-green-300 shadow-sm';
    case 'medium': return 'bg-gradient-to-r from-amber-300 to-amber-400 border border-amber-200 shadow-sm';
    case 'low': return 'bg-gradient-to-r from-red-400 to-red-500 border border-red-300 shadow-sm';
    default: return 'bg-slate-300 border border-slate-200';
  }
};