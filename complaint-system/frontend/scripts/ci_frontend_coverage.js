/* eslint-disable no-console */
// ESM-compatible script because package.json has "type": "module"
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
const stepSummary = process.env.GITHUB_STEP_SUMMARY;
// Lowered defaults to 70% (can still be overridden via env MIN_LINES/MIN_BRANCHES)
const minLines = parseFloat(process.env.MIN_LINES || '70');
const minBranches = parseFloat(process.env.MIN_BRANCHES || '70');

if (!fs.existsSync(summaryPath)) {
  console.log('No coverage summary found, failing');
  process.exit(1);
}

const s = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const lines = (s.total?.lines?.pct ?? 0);
const branches = (s.total?.branches?.pct ?? 0);
const text = `Lines: ${lines}%\nBranches: ${branches}%\nMinimums: Lines >= ${minLines}%, Branches >= ${minBranches}%\n`;

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