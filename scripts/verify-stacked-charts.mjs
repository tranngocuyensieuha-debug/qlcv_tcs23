import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');

const officerChart = read('src/components/OfficerWorkloadChart.tsx');
const initiativeChart = read('src/components/InitiativeProgressChart.tsx');

for (const [label, source] of [
  ['OfficerWorkloadChart', officerChart],
  ['InitiativeProgressChart', initiativeChart],
]) {
  assert.equal(
    source.includes('remaining: Math.max(0, assigned - completed)'),
    true,
    `${label} must calculate remaining quantity for a stacked total column`,
  );
  assert.equal(
    source.includes('stackId="assigned"'),
    true,
    `${label} must stack completed and remaining in one bar per label`,
  );
  assert.equal(
    source.includes('dataKey="remaining"'),
    true,
    `${label} must render the remaining segment`,
  );
}

assert.equal(
  /dataKey="(?:Cần thực hiện|Tổng chỉ tiêu giao)"/u.test(officerChart),
  false,
  'OfficerWorkloadChart must not render total assigned as a separate side-by-side bar',
);
assert.equal(
  /dataKey="(?:Cần thực hiện|Tổng chỉ tiêu giao)"/u.test(initiativeChart),
  false,
  'InitiativeProgressChart must not render total assigned as a separate side-by-side bar',
);

console.log('Stacked chart verification passed.');
