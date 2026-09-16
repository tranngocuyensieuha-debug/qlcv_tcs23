export const DEFAULT_PASSWORD = 'abc@12345';
const PASSWORD_STORAGE_KEY = 'tcs23:auth:passwords:v1';

export function getStoredPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORD_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function getUserPassword(username: string): string {
  if (!username) return DEFAULT_PASSWORD;
  const passwords = getStoredPasswords();
  return passwords[username.trim().toLowerCase()] || DEFAULT_PASSWORD;
}

export function verifyPassword(username: string, passwordAttempt: string): boolean {
  if (!username) return false;
  const expected = getUserPassword(username);
  return expected === passwordAttempt;
}

export function changeUserPassword(
  username: string,
  oldPass: string,
  newPass: string
): { success: boolean; message: string } {
  const user = username.trim().toLowerCase();
  if (!user) {
    return { success: false, message: 'Vui lòng nhập tên đăng nhập.' };
  }

  if (!verifyPassword(user, oldPass)) {
    return { success: false, message: 'Mật khẩu hiện tại không đúng.' };
  }

  if (!newPass || newPass.trim().length < 6) {
    return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' };
  }

  if (newPass === oldPass) {
    return { success: false, message: 'Mật khẩu mới không được trùng với mật khẩu cũ.' };
  }

  try {
    const passwords = getStoredPasswords();
    passwords[user] = newPass;
    localStorage.setItem(PASSWORD_STORAGE_KEY, JSON.stringify(passwords));
    return { success: true, message: 'Đổi mật khẩu thành công! Hãy dùng mật khẩu mới từ lần sau.' };
  } catch {
    return { success: false, message: 'Không thể lưu mật khẩu vào bộ nhớ trình duyệt.' };
  }
}
