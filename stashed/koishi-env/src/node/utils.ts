export function normalizeValue(value, sum) {
  return value / sum
}

export function normalize(arr: number[]) {
  const sum = arr.reduce((a, b) => a + b, 0)

  return arr.map(value => normalizeValue(value, sum))
}
