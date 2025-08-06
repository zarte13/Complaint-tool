/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
const stepSummary = process.env.GITHUB_STEP_SUMMARY;
const minLines = parseFloat(process.env.MIN_LINES || '80');
const minBranches = parseFloat(process.env.MIN_BRANCHES || '80');

if (!fs.existsSync(summaryPath)) {
  console.log('No coverage summary found, failing');
  process.exit(1);
}

const s = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const lines = (s.total?.lines?.pct ?? 0);
const branches = (s.total?.branches?.pct ?? 0);
const text = `Lines: ${lines}%\nBranches: ${branches}%\n`;

console.log(text.trim());

if (stepSummary) {
  try {
    fs.appendFileSync(stepSummary, `\n## Frontend Coverage Summary\n${text}`);
  } catch (e) {
    console.log('Warning: failed to write step summary:', e.message);
  }
}

const failures = [];
if (lines < minLines) failures.push(`Lines ${lines}% < ${minLines}%`);
if (branches < minBranches) failures.push(`Branches ${branches}% < ${minBranches}%`);

if (failures.length) {
  console.log('Coverage threshold not met: ' + failures.join('; '));
  process.exit(1);
}
console.log('Coverage thresholds met');