try {
  console.log(new Date('2026-06-26T10:06').toISOString());
} catch (e) {
  console.log('Error 1:', e.message);
}

try {
  console.log(new Date('2026-06-26T10:06 AM').toISOString());
} catch (e) {
  console.log('Error 2:', e.message);
}
