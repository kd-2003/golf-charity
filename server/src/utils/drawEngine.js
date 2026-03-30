function randomNumbers() {
  const nums = new Set();
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }
  return [...nums].sort((a, b) => a - b);
}

function algorithmicNumbers(allScores) {
  if (!allScores.length) return randomNumbers();
  const freq = new Map();
  allScores.forEach((n) => freq.set(n, (freq.get(n) || 0) + 1));
  const ranked = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  const selected = ranked.slice(0, 3);
  while (selected.length < 5) {
    const n = Math.floor(Math.random() * 45) + 1;
    if (!selected.includes(n)) selected.push(n);
  }
  return selected.sort((a, b) => a - b);
}

function countMatches(userScores, drawNumbers) {
  const drawSet = new Set(drawNumbers);
  return userScores.filter((n) => drawSet.has(n)).length;
}

module.exports = { randomNumbers, algorithmicNumbers, countMatches };
