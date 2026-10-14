export const auditPassed = ({ completed, score, minimumScore }) =>
  completed === true &&
  Number.isFinite(score) &&
  score >= 0 &&
  score <= 100 &&
  Number.isFinite(minimumScore) &&
  minimumScore >= 0 &&
  minimumScore <= 100 &&
  score >= minimumScore
