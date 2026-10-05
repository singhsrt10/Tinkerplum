export function compare(expected, actual) {
  return { detected: expected.filter(id => actual.includes(id)), missed: expected.filter(id => !actual.includes(id)),
    unexpected: actual.filter(id => !expected.includes(id)) };
}
