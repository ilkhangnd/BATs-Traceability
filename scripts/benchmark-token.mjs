const baseUrl = process.env.BASE_URL ?? "http://localhost:4400";
const email = process.env.ADMIN_EMAIL ?? "admin@bats.vn";
const password = process.env.ADMIN_PASSWORD;

if (!password) {
  throw new Error("Thiếu ADMIN_PASSWORD của staging.");
}

const login = await fetch(`${baseUrl}/auth/admin/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password })
});
if (!login.ok) {
  throw new Error(`Đăng nhập staging thất bại: HTTP ${login.status}`);
}
const cookie = login.headers.get("set-cookie");
if (!cookie) throw new Error("Backend không trả session cookie.");

const issued = await fetch(`${baseUrl}/admin/actors/FARMER-0001/access-token`, {
  method: "POST",
  headers: { cookie }
});
if (!issued.ok) {
  throw new Error(`Cấp benchmark token thất bại: HTTP ${issued.status}`);
}
const body = await issued.json();
process.stdout.write(`${body.accessToken}\n`);
