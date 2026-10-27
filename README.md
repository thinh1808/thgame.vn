# TH Game — thgame.vn

Website giới thiệu game và admin chạy trên GitHub Pages. Không cần database hoặc phí máy chủ riêng. Nội dung nằm trong `content.json`, có lịch sử và khôi phục bằng GitHub. Admin ở `/admin/`.

## Chạy thử

Cần Node.js 22+ và Python 3 (chỉ cho server xem thử).

```powershell
npm.cmd test
npm.cmd run build
python -m http.server 8080 --directory dist
```

Mở http://localhost:8080 và http://localhost:8080/admin/. Không mở HTML bằng file:// vì trình duyệt chặn fetch JSON.

## Đưa lên GitHub Pages

1. Tại https://github.com/new, tạo repository `thgame.vn`. Chọn **Public** nếu dùng GitHub Free. Để repository trống, không thêm README, .gitignore hay license ở bước tạo vì mã nguồn đã có sẵn.
2. Mở PowerShell trong thư mục mã nguồn, chạy các lệnh dưới đây sau khi thay `TEN_GITHUB` bằng username / tổ chức sở hữu repository. Khi Git yêu cầu đăng nhập, đăng nhập tài khoản của anh.

```powershell
cd D:\Th-Game\001.Apps\0002.thgame.vn
git init
git add .
git commit -m "Initial TH Game website"
git branch -M main
git remote add origin https://github.com/TEN_GITHUB/thgame.vn.git
git push -u origin main
```

3. Repository → Settings → Pages → Build and deployment → Source: **GitHub Actions**. Không chọn Deploy from a branch.
4. Actions → Deploy TH Game → Run workflow → chọn `main`. Nếu lần chạy đầu thất bại vì chưa bật Pages, chạy lại sau bước 3. Chờ workflow xanh và kiểm tra địa chỉ Pages GitHub cung cấp.
5. Nên xác minh tên miền tại **Settings của tài khoản GitHub → Pages → Add a domain**: nhập `thgame.vn`, thêm bản ghi TXT do GitHub cấp tại nhà cung cấp DNS, rồi bấm Verify. Giữ bản ghi TXT này.
6. Trong **repository → Settings → Pages → Custom domain**, nhập `thgame.vn` rồi Save, trước khi đổi các bản ghi web bên dưới. Workflow Actions không tự cấu hình tên miền chỉ bằng file `CNAME`.
7. Tại nơi đang quản lý DNS của `thgame.vn`, tạo các bản ghi sau. Thay `TEN_GITHUB` bằng username / tổ chức GitHub, không kèm tên repository:

| Loại | Tên / Host | Giá trị |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | TEN_GITHUB.github.io |

TTL có thể để mặc định. Chỉ thay các bản ghi web A/AAAA/CNAME xung đột ở `@` và `www`; giữ các bản ghi email MX/TXT và các dịch vụ khác. Nếu đang dùng Cloudflare, để các bản ghi web ở chế độ DNS only trong lúc xác minh/cấp chứng chỉ.

8. Chờ DNS cập nhật (có thể tới 24 giờ), về GitHub Pages kiểm tra DNS và bật **Enforce HTTPS** khi khả dụng. Kiểm tra `https://thgame.vn`, `https://www.thgame.vn` và `https://thgame.vn/admin/`.

Tài liệu chính thức: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

Nếu dùng nhánh khác `main`, đổi nhánh trong `.github/workflows/pages.yml` và khi kết nối admin. Trước khi bật custom domain, trang dự án hoạt động tại `<username>.github.io/<repo>/`. Tên thương hiệu hiển thị vẫn là TH Game; tên miền được cấu hình là thgame.vn theo yêu cầu mới nhất.

## Admin authentication

The public website has no admin link. The editor is no longer included in the GitHub Pages artifact. Until the Cloudflare authentication service is configured, /admin shows a locked setup page.

GitHub sign-in is restricted on the server to thinh1808 (numeric ID 22042427), followed by explicit confirmation. Content updates use a repository-scoped token held only as a Worker secret. See [deployment setup](docs/admin-auth.md) for required Cloudflare and GitHub OAuth setup and the private admin build.

The original local preview command serves the public site only. npm run build:admin builds the editor separately for the authenticated Worker; serving that directory locally without the Worker does not implement login.

## Nội dung và dịch vụ bên ngoài

- Đã nhập Sudoku Arena, Rolling Ball và Chess King: 9 Board Games từ các trang Google Play của TH-GAME. Ảnh dùng URL Google Play; có thể thay đổi trong admin. QR dẫn đến trang tải chính thức. Cả ba game dùng liên kết Privacy Policy đang công bố trên Google Play. Đây là liên kết chính sách hiện có, chưa chuyển nội dung chính sách về thgame.vn.
- Privacy Policy là bản nháp, chưa công bố. Cần soạn dựa trên dữ liệu, SDK quảng cáo/analytics và thực tế từng game trước khi công bố. Liên kết đến bản nháp trả về thông báo chưa công bố.
- QR dùng `api.qrserver.com`: bên thứ ba nhận URL tải và yêu cầu mạng từ người xem; nếu dịch vụ gián đoạn, nút tải vẫn hoạt động. Font dùng Google Fonts, có font hệ thống dự phòng. Ảnh game do admin cung cấp URL. Cần phản ánh các dịch vụ thực tế trong chính sách website.
- Các trang dùng hash route (`/#/game/slug`, `/#/page/slug`) để chạy trên Pages mà không cần server rewrite. Nếu cần URL riêng không có dấu # và SEO riêng cho từng game, có thể nâng cấp sang static generator.
- Build chỉ đóng gói file website; không đưa README, tests hoặc tài liệu nội bộ lên Pages.
