import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const pythonExe =
  'C:\\Users\\thanh\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';

function localExcelApi(): Plugin {
  return {
    name: 'local-excel-api',
    configureServer(server) {
      server.middlewares.use('/api/local-file-du-lieu', (_request, response) => {
        const excelPath = resolve(process.cwd(), '..', 'file du lieu.xlsx');

        if (!existsSync(excelPath)) {
          response.statusCode = 404;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.end(JSON.stringify({ error: 'Không tìm thấy file du lieu.xlsx' }));
          return;
        }

        const script = String.raw`
from openpyxl import load_workbook
from datetime import datetime
import json
import sys

path = sys.argv[1]
wb = load_workbook(path, data_only=True)
ws = wb.worksheets[0]
tasks = [
    ('Số thu', 7, 8, 9),
    ('Kê khai thuế', 10, 11, 12),
    ('Quản lý rủi ro HKD', 13, 14, 15),
    ('Kiểm tra HKD', 16, 17, 18),
    ('Rà soát TMĐT', 19, 20, 21),
    ('Hỗ trợ hóa đơn điện tử', 22, 23, 24),
    ('Chuyển đổi lên doanh nghiệp', 25, 26, 27),
    ('Nộp thuế điện tử', 28, 29, 30),
    ('Nợ thuế', 31, 32, 33),
    ('Cưỡng chế xuất nhập cảnh', 34, 35, 36),
    ('Cưỡng chế tài khoản hóa đơn', 37, 38, 39),
    ('Hệ số K', 40, 41, 42),
    ('Thủ tục hành chính', 43, 44, 45),
]
name_map = {'Nguyễn Văn Toàn': 'Nguyễn Viết Toàn'}

def date_text(value):
    if isinstance(value, datetime):
        return value.date().isoformat()
    if value is None:
        return ''
    text = str(value).strip()
    for fmt in ('%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d'):
        try:
            return datetime.strptime(text[:10], fmt).date().isoformat()
        except ValueError:
            pass
    return text[:10]

def number(value):
    if value is None or value == '':
        return 0
    return round(float(value), 4)

rows = []
for r in range(3, 17):
    officer = ws.cell(r, 1).value
    if not officer:
        continue
    officer = name_map.get(str(officer).strip(), str(officer).strip())
    for task_title, assigned_col, completed_col, deadline_col in tasks:
        rows.append({
            'taskTitle': task_title,
            'officerName': officer,
            'assigned': number(ws.cell(r, assigned_col).value),
            'completed': number(ws.cell(r, completed_col).value),
            'deadline': date_text(ws.cell(r, deadline_col).value),
        })

print(json.dumps(rows, ensure_ascii=False))
`;

        const result = spawnSync(pythonExe, ['-c', script, excelPath], {
          encoding: 'utf8',
          env: { ...process.env, PYTHONUTF8: '1' },
        });

        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (result.status !== 0) {
          response.statusCode = 500;
          response.end(JSON.stringify({ error: result.stderr || 'Không đọc được file Excel' }));
          return;
        }

        response.end(result.stdout);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localExcelApi()],
  server: {
    port: 5174,
    proxy: {
      '/api/dataset': {
        target: 'http://127.0.0.1:5173',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
