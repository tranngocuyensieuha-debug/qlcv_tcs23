export function serializeCsv(rows: readonly (readonly unknown[])[]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          let cell = String(value ?? "");
      let firstContent = 0;
      while (firstContent < cell.length && (/\s/.test(cell[firstContent]) || cell.charCodeAt(firstContent) <= 0x1f)) firstContent += 1;
      if (/^[=+\-@]/.test(cell.slice(firstContent))) cell = `'${cell}`;
          return `"${cell.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\n");
}
export function downloadCsv(
  filename: string,
  rows: readonly (readonly unknown[])[],
) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", serializeCsv(rows)], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
