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
    case 'high': return 'bg-green-100';
    case 'medium': return 'bg-amber-200'; // Changed from yellow-100 to amber-200 for better visibility
    case 'low': return 'bg-red-100';
    default: return 'bg-slate-100';
  }
};