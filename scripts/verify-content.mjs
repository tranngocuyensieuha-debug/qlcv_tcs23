import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const textExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.html', '.css']);

function filesBelow(directory) {
  assert.ok(existsSync(directory), `Thiếu thư mục bắt buộc: ${relative(appRoot, directory)}`);
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory()
      ? filesBelow(path)
      : textExtensions.has(extname(path)) ? [path] : [];
  });
}

function readRequired(relativePath) {
  const path = join(appRoot, relativePath);
  assert.ok(existsSync(path), `Thiếu file bắt buộc: ${relativePath}`);
  return readFileSync(path, 'utf8');
}

const appShell = readRequired('src/layout/AppShell.tsx');
const identitySources = `${readRequired('src/accounts.ts')}\n${readRequired('src/data/seedDataset.ts')}`;
const distFiles = filesBelow(join(appRoot, 'dist')).filter((file) => ['.js', '.html'].includes(extname(file)));
assert.ok(distFiles.length > 0, 'dist không có HTML/JavaScript; phải build trước khi xác minh.');
const dist = distFiles.map((file) => readFileSync(file, 'utf8')).join('\n');

const navigationLabels = [
  'Tổng quan', 'Công việc cá nhân', 'Nhân sự & địa bàn', 'Báo cáo',
  'Cảnh báo', 'Danh mục nhiệm vụ', 'Nhập dữ liệu Excel',
];
for (const label of navigationLabels) {
  assert.ok(appShell.includes(label), `AppShell thiếu nhãn điều hướng: ${label}`);
  assert.ok(dist.includes(label), `Bản build thiếu nhãn điều hướng: ${label}`);
}

const teamIds = ['HKD1', 'HKD2', 'QLDN1', 'QLDN2', 'KIEMTRA', 'HCTH', 'NVDTPC', 'QLTK'];
for (const teamId of teamIds) {
  assert.ok(identitySources.includes(teamId), `accounts/seed thiếu mã tổ: ${teamId}`);
  assert.ok(dist.includes(teamId), `Bản build thiếu mã tổ: ${teamId}`);
}

const runtimeSources = filesBelow(join(appRoot, 'src')).filter((file) => {
  const path = relative(join(appRoot, 'src'), file).replaceAll('\\', '/');
  return !/(^|\/)test\//.test(path)
    && !/\.(?:test|spec)\.[^.]+$/.test(path)
    && !path.endsWith('.d.ts');
});
for (const file of runtimeSources) {
  assert.ok(!readFileSync(file, 'utf8').includes('Math.random'), `Không được dùng Math.random trong runtime: ${relative(appRoot, file)}`);
}

assert.ok(existsSync(join(appRoot, 'public', 'mau-tong-hop.xlsx')), 'Thiếu workbook mẫu public/mau-tong-hop.xlsx.');
assert.ok(existsSync(join(appRoot, 'dist', 'mau-tong-hop.xlsx')), 'Thiếu workbook mẫu dist/mau-tong-hop.xlsx.');
console.log(`Content verification passed (${runtimeSources.length} runtime sources, ${distFiles.length} built assets, 7 navigation labels, 8 team IDs).`);
