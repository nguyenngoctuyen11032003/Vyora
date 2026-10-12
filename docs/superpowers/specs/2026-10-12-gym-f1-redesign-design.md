# Gym for Beginners: giao diện F1, bấm giờ và calo, đồng bộ Fitora

Ngày: 2026-10-12 · Trạng thái: đã duyệt hướng thiết kế, chờ duyệt spec

## 1. Mục tiêu

1. Làm lại toàn bộ giao diện theo phong cách mẫu F1 "Lewis Hamilton / Silverstone", lấy thêm từ mẫu "Coffee profile" các nút liquid-glass và thẻ stat. Giữ nguyên giáo án và toàn bộ video YouTube trong `src/data/workout-plan.ts`.
2. Thêm bấm giờ buổi tập: Bắt đầu, Tạm dừng / Tiếp tục, Kết thúc. Calo ước lượng tăng dần theo thời gian thực.
3. Lưu buổi tập vào backend dùng chung (Supabase của Note_mytasks), ghi vào đúng bảng `fit_workouts` để Fitora tự tính vào "calo đã đốt".
4. Đăng nhập bằng email và mật khẩu, dùng chung tài khoản với Note_mytasks và Fitora.
5. CI/CD: test, build tĩnh, deploy lên GitHub Pages khi push `main`.

Ngoài phạm vi: đăng ký tài khoản mới, đổi mật khẩu trong app gym, ghi số kg và số rep từng set, theo dõi tuần 1–12 của giáo án, PWA hay push notification.

## 2. Kiến trúc

```
gym-for-beginners (Next.js 16, output: 'export')  ──supabase-js (anon key + JWT)──►  Supabase (Note_mytasks)
GitHub Actions → GitHub Pages                                                          fit_workouts (RLS chủ sở hữu)
                                                                                       fit_body_measurements, fit_profiles (chỉ đọc)
Fitora (GitHub Pages) ──────────────────────────────────────────────────────────────►  cùng bảng: fit_day_summary / fit_range_summary
```

- Giữ Next.js 16 App Router, React 19, Tailwind 4. Trước khi sửa cấu hình, đọc `node_modules/next/dist/docs/` (theo AGENTS.md), nhất là phần static export.
- `next.config.ts` dùng `output: 'export'`, `basePath` lấy từ `NEXT_PUBLIC_BASE_PATH` (CI đặt là `/gym-for-beginners`, chạy local để trống), `images.unoptimized: true`, `trailingSlash: true`.
- Chỉ có **một trang**. Điều hướng giữa các màn bằng state phía client, không dùng route, nên GitHub Pages không phải rewrite.
- Supabase client: `@supabase/supabase-js`, `storageKey: 'gym.auth'` (khác `fitora.auth` và `nm.auth` để đăng xuất app này không đăng xuất app kia), `persistSession: true`, `autoRefreshToken: true`.
- Không có server riêng. Bảo mật hoàn toàn dựa trên RLS có sẵn của bảng `fit_*`.
- Chỉ dùng npm và xoá `pnpm-lock.yaml`.

## 3. Giao diện

### 3.1 Design tokens

| Token | Giá trị |
|---|---|
| Font | Albert Sans 300–800 (`next/font/google`), thay Geist |
| Nền | `#0a0e1c`, chữ trắng, nhãn phụ `text-white/60` |
| Nhấn | vàng `#EDB40B` (đồng hồ khi đang chạy, kcal, nút chính) |
| Menu | `linear-gradient(160deg, #1a0000 0%, #8B0000 40%, #E10600 100%)`, hover `#EDB40B` |
| Thẻ glass | `rgba(20,20,30,0.8)`, `border 1px rgba(255,255,255,0.1)`, `backdrop-filter: blur(16px)` |
| Nút glass | lớp `.glass` của mẫu coffee: nền `rgba(255,255,255,0.03)`, inset highlight, `blur(2px) saturate(1.3)`, thu nhỏ khi `:active`; nút nav dùng `rgba(255,255,255,0.15)` + `blur(12px)` |
| Thẻ stat | `rgba(255,255,255,0.06)`, bo 24px |
| Tiêu đề | tracking −0.05em đến −0.08em, leading 0.72–0.95; số lớn 110–120px |

Keyframes lấy từ mẫu F1: `fadeSlideUp`, `fadeSlideDown`, `fadeSlideLeft`, `scaleIn`, `fadeIn`, `speedReveal`, cùng các lớp delay 100–1600. Count-up dùng ease-out bậc ba, 2200ms. Khi người dùng bật `prefers-reduced-motion: reduce` thì tắt mọi animation và count-up hiện ngay số cuối.

Ảnh: không dùng ảnh Hamilton, Ferrari hay logo F1. Ảnh lớn trên màn là thumbnail YouTube của bài đầu tiên trong ngày (`https://i.ytimg.com/vi/<id>/hqdefault.jpg`, lấy id từ `embedUrl`), đáy ảnh có lớp blur 6px với mask `transparent → black 50%`. Nếu bài không có video thì dùng ảnh nền trang của mẫu F1. Logo góc trái dùng `public/image/logo.png` có sẵn.

### 3.2 Bố cục theo kích thước màn hình

- **Dưới 768px (điện thoại):** app toàn màn hình, không có khung phone. Dưới cùng có thanh tab glass 3 mục: Hôm nay · Đang tập · Tuần này. Nút menu (hai vạch) mở overlay đỏ.
- **Từ 768px trở lên:** bố cục mẫu F1 gồm nền ảnh, lớp `bg-black/70` và 3 `PhoneMockup` xếp ngang (`gap-[2vw]`, phone giữa có `-mb-6`). Mỗi phone hiển thị một màn **thật và bấm được** của cùng một state: phone 1 Hôm nay, phone 2 Đang tập, phone 3 Tuần này. Mỗi phone có nội dung rộng 390px, được scale theo `screenW / 390` và cuộn được bên trong. Ở chế độ này không có thanh tab.
- Màn đăng nhập trên desktop chỉ hiện một phone ở giữa.
- Kích thước `.phone-frame` theo đúng mẫu: `clamp(200px,75vw,340px)`, `min(25vw,42vh)` từ 768px, `min(28vw,48vh,430px)` từ 1280px.

### 3.3 Các màn

**Đăng nhập**
- Nền ảnh có lớp phủ, tiêu đề "Gym / Training" cỡ 64px với hiệu ứng speedReveal.
- Ô Email, ô Mật khẩu (có nút hiện/ẩn), nút vàng "Đăng nhập".
- Lỗi hiển thị bằng chữ tiếng Việt: sai thông tin, mất mạng.
- Liên kết "Quên mật khẩu?" mở `NEXT_PUBLIC_NOTE_MYTASKS_URL`.
- Toàn bộ app yêu cầu đăng nhập. Khi đang khôi phục phiên, hiện skeleton thay cho form.

**Hôm nay** (theo Screen 1 của mẫu F1)
- Nhãn "Thứ Hai · 6 bài · ~60 phút" và tiêu đề nhóm cơ cỡ 48px. Ví dụ "Ngực, vai" / "và tay sau".
- Ảnh thumbnail có blur mask. Bên dưới là dải 7 ngày (T2–CN) dạng chip glass để đổi ngày; ngày hôm nay được chọn sẵn như logic hiện có.
- Danh sách bài tập: tên bài, tên tiếng Việt, số set × rep, nhóm cơ. Bấm vào bài mở **dialog/drawer chi tiết và video hiện có, giữ nguyên hành vi**, chỉ đổi style.
- Nút vàng cố định ở đáy "Bắt đầu buổi tập". Nếu đang có buổi tập thì nút đổi thành "Đang tập · 12:34" và bấm vào sẽ chuyển sang màn Đang tập.
- Ngày nghỉ hiển thị thẻ nghỉ phục hồi, vẫn có nút "Vẫn tập hôm nay" dùng giáo án của ngày đang chọn.

**Đang tập** (theo Screen 2)
- Khi chưa có buổi tập: hiện trạng thái rỗng và nút "Bắt đầu" cho ngày đang chọn.
- Đồng hồ `mm:ss` (vượt 60 phút thì `h:mm:ss`) cỡ 110px, chữ gradient trắng; khi đang chạy chữ đổi sang vàng.
- Dòng "≈ 245 kcal" màu vàng `#EDB40B`, cập nhật mỗi giây. Nhãn nhỏ: "ước lượng · 70 kg · Vừa".
- Checklist các bài trong buổi, bấm để tick hoàn thành. Phần này chỉ để theo dõi, không ảnh hưởng tới kcal.
- Hai nút lớn: "Tạm dừng" / "Tiếp tục" và "Kết thúc".
- Khi đồng hồ chạy, giữ màn hình sáng bằng `navigator.wakeLock`. Trình duyệt không hỗ trợ thì bỏ qua, không báo lỗi.

**Sheet Kết thúc**
- Số phút: lấy sẵn từ đồng hồ, làm tròn đến phút, sửa được bằng nút −/+ hoặc nhập số trong khoảng 1–300.
- Cường độ: 3 chip.
- Cân nặng: hiện kg đang dùng và nguồn của nó ("lần đo 10/10", "hồ sơ Fitora" hoặc "nhập tay").
- Tổng kcal tính lại ngay khi người dùng đổi số phút, cường độ hoặc cân nặng.
- Nút "Lưu buổi tập" và nút phụ "Huỷ buổi tập" (có hỏi xác nhận). Nếu buổi dưới 1 phút thì không cho lưu, chỉ cho huỷ.
- Nếu đồng hồ đã chạy quá 4 giờ, hiện cảnh báo "Có thể bạn quên bấm kết thúc" và điền sẵn số phút theo kế hoạch của ngày.

**Tuần này** (theo Screen 3 cùng grid stat của mẫu coffee)
- Ba số lớn có count-up: số buổi, tổng phút, tổng kcal (màu vàng).
- Dải 7 ngày T2–CN của tuần hiện tại, ngày có buổi tập được đánh dấu chấm vàng và chữ "✓", không chỉ dựa vào màu.
- Danh sách buổi gần đây (tối đa 20): ngày, tên buổi, số phút, kcal, trạng thái đồng bộ ("Đã lưu" / "Chờ gửi"). Vuốt hoặc bấm nút xoá, có hỏi xác nhận.
- Màn này chỉ hiển thị các buổi có `source = 'gym'`.

**Menu overlay đỏ**
- Gồm: Hôm nay, Đang tập, Tuần này, Mở Fitora (`NEXT_PUBLIC_FITORA_URL`), Đăng xuất.
- Hiện tên hoặc email của người đăng nhập (đọc `public.profiles.display_name`, không có thì dùng email).
- Đăng xuất khi còn buổi chờ gửi phải hỏi xác nhận vì hàng chờ gắn với tài khoản.

## 4. Tính calo

Công thức giống hệt Fitora (`metKcal`) để số liệu hai app luôn khớp:

```
kcal = round(MET × cân_nặng_kg × phút / 60)
```

MET theo Compendium of Physical Activities (resistance training):

| Cường độ | MET | Mặc định cho |
|---|---|---|
| Vừa | 3.5 | T2 Ngực-vai-tay sau, T4 Lưng-xô-tay trước, T6 Vai-ngực-tay sau |
| Khá nặng | 5.0 | T3 Chân-mông-core, T5 Deadlift và chân |
| Nặng | 6.0 | chỉ khi người dùng chọn |

Mức mặc định được lưu thành trường `defaultIntensity` của mỗi `WorkoutDay` trong `workout-plan.ts`. Ví dụ với 70 kg tập 60 phút: Vừa ra 245 kcal, Khá nặng 350 kcal, Nặng 420 kcal. Giao diện luôn ghi "ước lượng" kèm chú thích "sai số khoảng ±20%, đã gồm năng lượng nghỉ".

Cân nặng được chọn giống `resolveWeight` của Fitora. Chỉ chấp nhận giá trị trong khoảng 25–300 kg:
1. `fit_body_measurements.weight_kg` mới nhất, khác null, `measured_on` không sau hôm nay.
2. `fit_profiles.start_weight_kg`.
3. Giá trị người dùng nhập ở sheet Kết thúc. Giá trị này lưu trong `localStorage` (`gym.weightKg`) và **không** ghi vào Fitora. Nếu chưa nhập thì gợi ý 65 kg và buộc người dùng xác nhận trước khi lưu.

Cân nặng được tải khi đăng nhập và khi bấm Bắt đầu. Nếu tải lỗi thì dùng giá trị đã cache gần nhất.

## 5. Đồng hồ

- State lưu trong `localStorage` (`gym.activeSession`) dưới dạng mốc thời gian, không dùng bộ đếm:
  `{ id: uuid, dayId, startedAt: ISO, pausedAt: ISO|null, pausedMs: number, intensity, checked: string[] }`.
- Thời gian đã tập = `(pausedAt ?? now) − startedAt − pausedMs`. Cách này chịu được việc khoá màn hình, chuyển tab, tải lại trang hay trình duyệt bị đóng.
- Mỗi lúc chỉ có một buổi đang tập. `id` của buổi chính là `client_ref` khi ghi vào backend.
- UI cập nhật mỗi giây bằng `setInterval`, khi tab quay lại thì cập nhật ngay qua `visibilitychange`.
- Phần logic tách thành hàm thuần (`start`, `pause`, `resume`, `elapsedMs`, `finish`) trong `src/lib/session.ts` để test không phụ thuộc thời gian thật.

## 6. Lưu và đồng bộ

Ghi vào `fit_workouts`:

| Cột | Giá trị |
|---|---|
| `workout_on` | ngày theo giờ máy lúc bấm Bắt đầu (`YYYY-MM-DD`) |
| `start_time` | `HH:MM` lúc bắt đầu |
| `category` / `activity` | `'gym'` / `'weight_training'` |
| `title` | `"Gym · " + title của ngày`, cắt còn tối đa 80 ký tự |
| `met`, `duration_min`, `kcal` | theo §4 |
| `status` | `'done'` |
| `notes` | `"5/6 bài · Ngực, vai, tay sau"`, tối đa 1000 ký tự |
| `source` | `'gym'` (cột mới) |
| `client_ref` | `id` của buổi (cột mới) |

- Ghi bằng `upsert(row, { onConflict: 'user_id,client_ref' })`, nên gửi lại bao nhiêu lần cũng không tạo bản trùng.
- **Hàng chờ** (`gym.outbox:<user_id>`): bấm "Lưu" thì đưa bản ghi vào hàng chờ, xoá `activeSession`, rồi thử gửi ngay. Hàng chờ được gửi lại khi mở app, khi có sự kiện `online` và sau khi đăng nhập. Mỗi lần gửi thành công thì xoá mục đó. Lỗi mạng giữ lại để gửi sau. Lỗi 4xx do dữ liệu sai (vi phạm check) thì đánh dấu `failed` và hiện trong Tuần này kèm nút "Sửa".
- Xoá buổi: bản đã gửi thì `delete` theo `id`; bản còn chờ thì chỉ xoá khỏi hàng chờ.
- Tuần này đọc `fit_workouts` với `source = 'gym'` của 8 tuần gần nhất, gộp với các mục còn trong hàng chờ.

### 6.1 Migration (repo Note_mytasks, chỉ thêm)

File mới `supabase/migrations/20261013000100_fitora_workout_source.sql`. Nếu khi làm đã có file mới hơn thì lấy timestamp sau file đó. Không được sửa migration đã deploy.

```sql
alter table public.fit_workouts
  add column if not exists source text not null default 'fitora'
    check (source in ('fitora', 'gym')),
  add column if not exists client_ref uuid;

alter table public.fit_workouts
  add constraint fit_workouts_user_client_ref_key unique (user_id, client_ref);
```

- NULL trong `client_ref` không bao giờ trùng nhau, nên các bản ghi cũ của Fitora không bị ảnh hưởng. Constraint `add` phải viết idempotent bằng khối `do $$ … if not exists … $$`.
- RLS, grant, trigger, RPC tổng hợp và `workout_kcal` đều giữ nguyên.
- Thêm file vào danh sách file tường minh trong `tests/db/fitora.test.js`. Thêm test: upsert hai lần cùng `client_ref` chỉ ra một dòng; `source` sai bị từ chối; user khác không đọc hay ghi được.

### 6.2 Thay đổi bên Fitora (tối thiểu)

- `src/types/db.ts`: thêm `source` và `client_ref` (optional) vào `Workout`. Code insert của Fitora không gửi hai cột này nên mặc định là `'fitora'`.
- Danh sách buổi tập hiện nhãn nhỏ "Gym" cho bản ghi có `source = 'gym'`. Người dùng vẫn sửa và xoá được bình thường.
- Cập nhật bảng `fit_workouts` trong `docs/PLAN.md` §2.

## 7. Cấu trúc code (gym-for-beginners)

```
app/layout.tsx, app/page.tsx, app/globals.css   font, tokens, keyframes, khung trang
src/lib/supabase.ts         tạo client (null nếu thiếu env, khi đó hiện màn "Chưa cấu hình")
src/lib/calories.ts         MET_BY_INTENSITY, metKcal, resolveWeight
src/lib/session.ts          hàm thuần của đồng hồ
src/lib/outbox.ts           hàng chờ: enqueue, flush(upsertFn), remove
src/lib/workout-row.ts      chuyển buổi tập thành dòng fit_workouts
src/hooks/use-auth.ts, use-active-session.ts, use-weight.ts, use-week-sessions.ts, use-wake-lock.ts
src/components/f1/          PhoneMockup, PhoneNav, MenuOverlay, GlassButton, CountUp, ScreenBackground
src/components/screens/     LoginScreen, TodayScreen, SessionScreen, FinishSheet, WeekScreen
src/components/workout/     giữ các component chi tiết và video, đổi style
```

Giữ nguyên dữ liệu trong `src/data/workout-plan.ts`, chỉ thêm `defaultIntensity` cho mỗi ngày. Bỏ `app-header` / `app-footer` / `workout-hero` khi đã được thay thế.

Biến môi trường (đều public, không có secret): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BASE_PATH`, `NEXT_PUBLIC_FITORA_URL`, `NEXT_PUBLIC_NOTE_MYTASKS_URL`. Thêm file `.env.example`.

## 8. Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Thiếu env Supabase | màn "Chưa cấu hình máy chủ", vẫn xem được giáo án |
| Sai email hoặc mật khẩu | "Email hoặc mật khẩu không đúng" |
| Mất mạng khi lưu | buổi nằm trong hàng chờ, hiện toast "Đã lưu trên máy, sẽ gửi khi có mạng" |
| Phiên hết hạn | về màn đăng nhập, hàng chờ còn nguyên và tự gửi sau khi đăng nhập lại |
| Backend chưa có cột mới (PGRST204 hoặc 42703) | giữ trong hàng chờ, hiện "Máy chủ chưa cập nhật" |
| Không có Wake Lock | bỏ qua, không báo |

## 9. Kiểm thử

- **Unit (Vitest):**
  - `calories`: bảng ví dụ ở §4, giá trị biên 25 và 300 kg, chuỗi số.
  - `session`: start, pause, resume, finish với thời gian giả lập; tạm dừng nhiều lần; tải lại từ JSON.
  - `outbox`: idempotent, giữ lại khi lỗi mạng, đánh dấu `failed` khi 4xx.
  - `workout-row`: cắt độ dài, ngày giờ local.
- **Component:** cập nhật test hiện có theo UI mới. Thêm test cho FinishSheet (kcal đổi khi đổi số phút hoặc cường độ) và LoginScreen.
- **DB (Note_mytasks):** các test ở §6.1.
- **E2E (Playwright, mobile 390×844):** chạy trên Supabase local (checkout Note_mytasks `main`, `supabase start`). Kịch bản: đăng nhập → Bắt đầu → giả lập 60 phút → Kết thúc → Lưu → kiểm tra có đúng một dòng `fit_workouts` với `source='gym'` và `kcal` đúng → `fit_day_summary` trả về `workout_kcal` tương ứng.

## 10. CI/CD (gym-for-beginners)

- `.github/workflows/ci.yml`, chạy trên PR và khi được gọi từ deploy:
  - Job `test`: `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`.
  - Job `e2e`: checkout Note_mytasks vào thư mục con, chạy `supabase start`, chạy Playwright.
- `.github/workflows/deploy.yml`, chạy khi push `main` hoặc `workflow_dispatch`: gọi CI → build với `NEXT_PUBLIC_*` lấy từ repo Variables và `NEXT_PUBLIC_BASE_PATH=/gym-for-beginners` → `actions/upload-pages-artifact` (thư mục `out`) → `actions/deploy-pages`. Dùng `concurrency` để không deploy chồng nhau.
- `.github/scripts/check-public-env.mjs` (chép từ Fitora, đổi tiền tố thành `NEXT_PUBLIC_`): chặn khi key trông giống `service_role` hoặc `sbp_`, và báo lỗi khi thiếu biến lúc chạy `--strict`.
- Cấu hình một lần:
  - Bật Pages với Source = GitHub Actions.
  - Thêm các repo Variables, giá trị Supabase chép từ Fitora.
  - Đăng nhập bằng mật khẩu không cần thêm redirect URL trong Supabase Auth.
- Thứ tự phát hành:
  1. Note_mytasks (migration, deploy áp dụng lên DB).
  2. gym-for-beginners.
  3. Fitora (nhãn "Gym").
- Lý do: CI của gym và của Fitora đều checkout Note_mytasks `main`. Trước khi commit, kiểm tra `ListAgents` để phối hợp với các phiên khác đang sửa Note_mytasks hoặc Fitora.

## 11. Tiêu chí hoàn thành

- Trên màn 360–430px, đi từ mở app đến lúc đồng hồ chạy chỉ mất tối đa 2 lần chạm sau khi đăng nhập.
- Tập 60 phút ngày T2 với cân nặng 70 kg cho ra 245 kcal ở app gym, và Fitora Today hiện thêm đúng 245 kcal đã đốt.
- Lưu khi mất mạng rồi bật lại mạng: chỉ có một dòng trong DB.
- Mọi video cũ vẫn mở được như trước.
- CI xanh, site Pages chạy được tại `https://<user>.github.io/gym-for-beginners/`.
