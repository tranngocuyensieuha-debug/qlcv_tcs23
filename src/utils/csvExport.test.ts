import { expect, it, vi } from "vitest";
import { downloadCsv, serializeCsv } from "./csvExport";
it("escape CSV và vô hiệu công thức spreadsheet", () => {
  expect(
    serializeCsv([["a,b", 'a"b', "a\nb", "=SUM(A1)", "+1", "-2", "@cmd"]]),
  ).toBe('"a,b","a""b","a\nb","\'=SUM(A1)","\'+1","\'-2","\'@cmd"');
});
it("chặn công thức sau whitespace/control nhưng giữ whitespace bình thường", () => {
  expect(serializeCsv([["\t=1+1", "\r@SUM", "  -2+3", "\n+4", "  dữ liệu"]])).toBe(
    '"\'\t=1+1","\'\r@SUM","\'  -2+3","\'\n+4","  dữ liệu"',
  );
});
it("tạo Blob đúng nội dung, dọn anchor và revoke URL sau click", async () => {
  let blob: Blob | undefined;
  const create = vi.spyOn(URL, "createObjectURL").mockImplementation((value) => { blob = value as Blob; return "blob:test"; });
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  downloadCsv("report.csv", [["Mã", "Tên"], ["1", "a,b"]]);
  expect(create).toHaveBeenCalledOnce(); expect(click).toHaveBeenCalledOnce();
  expect(document.querySelector('a[download="report.csv"]')).toBeNull();
  expect(await blob!.text()).toContain('"1","a,b"');
  await new Promise((resolve) => setTimeout(resolve, 0)); expect(revoke).toHaveBeenCalledWith("blob:test");
});
