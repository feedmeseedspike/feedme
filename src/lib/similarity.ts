
export function levenshteinDistance(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export function similarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();

  if (str1 === str2) return 1.0;

  // Substring check (covers "wings" vs "chicken wings")
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  let score = 0;

  // 1. Check if one is a substring of another
  if (longer.includes(shorter)) {
    // Substring bonus: higher if the shorter one is a large part of the longer one
    const subScore = shorter.length / longerLength;
    // We boost substring matches because they are very likely related
    score = Math.max(score, 0.7 + (subScore * 0.3));
  }

  // 2. Word set intersection (covers flipped names or added markers)
  const noiseWords = new Set(["fresh", "organic", "premium", "quality", "and", "with", "the", "big", "small", "medium"]);
  const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 2 && !noiseWords.has(w)));
  const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 2 && !noiseWords.has(w)));
  
  if (words1.size > 0 && words2.size > 0) {
    let intersectionCount = 0;
    words1.forEach(w => { if (words2.has(w)) intersectionCount++; });
    
    if (intersectionCount > 0) {
      const jaccard = intersectionCount / (words1.size + words2.size - intersectionCount);
      // Boost score if many words match, especially if one set is fully contained in another.
      const containment = intersectionCount / Math.min(words1.size, words2.size);
      score = Math.max(score, jaccard * 0.5 + containment * 0.5);
    }
  }

  // 3. Levenshtein fallback
  const levScore = (longerLength - levenshteinDistance(longer, shorter)) / longerLength;
  score = Math.max(score, levScore);

  return score;
}
