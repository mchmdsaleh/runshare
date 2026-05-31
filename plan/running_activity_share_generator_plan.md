# Plan Aplikasi: Running Activity Share Generator

## 1. Konsep Utama

Aplikasi ini bukan dibuat sebagai pengganti Strava, tapi sebagai **running activity formatter** untuk membuat hasil share activity yang lebih fleksibel, terutama untuk **interval run**.

Fokus utama aplikasi:

1. Membuat **transparent share card**.
2. Membuat **copyable text summary**.
3. Mendukung input dari **CSV**, **screenshot split Strava**, dan **manual input**.
4. Menghasilkan berbagai tipe format share, bukan hanya format standar seperti Strava.

Positioning:

> Bikin activity share yang lebih enak, fleksibel, dan interval-aware dibanding format share standar Strava.

---

## 2. Masalah yang Diselesaikan

### 2.1 Share Activity Strava Terbatas

Untuk non-subscription, opsi share activity di Strava terbatas dan kurang bisa dikustomisasi.

Masalahnya:

- Format share terlalu standar.
- Tidak banyak pilihan desain.
- Kurang fleksibel untuk kebutuhan sharing di Instagram Story, WhatsApp, X, atau caption.
- Tidak cocok untuk user yang ingin highlight detail tertentu dari latihannya.

### 2.2 Split Interval Tidak Ideal

Pada interval run, split di Strava seringnya ditampilkan per kilometer.

Padahal untuk interval run, data yang lebih penting adalah:

- Rep interval.
- Jarak tiap rep.
- Pace tiap rep.
- Rest/recovery.
- Warm up.
- Cool down.
- Fastest rep.
- Konsistensi pace.

Contoh:

```text
5 x 500m
Rep 1 — 2:39.2 — 5:18/km
Rep 2 — 2:50.2 — 5:40/km
Rep 3 — 2:53.3 — 5:47/km
Rep 4 — 2:49.8 — 5:40/km
Rep 5 — 2:12.9 — 4:26/km
```

Format seperti ini lebih berguna untuk latihan interval dibanding hanya melihat split per kilometer.

---

## 3. Output Utama

Aplikasi harus menghasilkan dua output utama.

---

## 3.1 Transparent Share Card

Output berupa **PNG transparan** yang bisa ditempel di atas:

- Foto lari.
- Screenshot route map.
- Background polos.
- Video.
- Instagram Story.
- Canva/CapCut layout.

Contoh format:

```text
INTERVAL RUN
8.00 KM · 1:01:19 · 7:40/KM

5 × 500M
01  2:39  5:18/km
02  2:50  5:40/km
03  2:53  5:47/km
04  2:49  5:40/km
05  2:12  4:26/km

FASTEST REP
#05 · 4:26/km
```

Format export:

- PNG transparent.
- 1080 × 1920 untuk IG Story.
- 1080 × 1080 untuk square post.
- Custom size.
- Optional background mode.

---

## 3.2 Copyable Text Summary

Aplikasi harus bisa menghasilkan teks siap copy.

Contoh:

```text
Interval Run — 8.00 km

Total time: 1:01:19
Avg pace: 7:40/km
Avg HR: 141 bpm
Max HR: 181 bpm

Warm up:
1.03 km @ 7:04/km

Main set:
5 x 500m

1 — 2:39.2 — 5:18/km
2 — 2:50.2 — 5:40/km
3 — 2:53.3 — 5:47/km
4 — 2:49.8 — 5:40/km
5 — 2:12.9 — 4:26/km

Fastest rep: #5 @ 4:26/km
Cool down: 3.66 km @ 8:21/km
```

Pilihan style copy text:

### Clean

```text
8.00 km · 1:01:19 · 7:40/km
5 x 500m interval
Fastest rep: #5 @ 4:26/km
```

### Coach Mode

```text
Main Set: 5 x 500m
Avg rep pace: 5:22/km
Fastest: 4:26/km
Slowest: 5:47/km
HR range: 145–150 avg bpm
```

### Social Caption

```text
5 x 500m today.
Started controlled, finished strong.

Fastest rep: #5 @ 4:26/km
Total: 8.00 km · 1:01:19
```

---

## 4. Input Source

Aplikasi mendukung tiga jenis input.

---

## 4.1 CSV Upload

Ini menjadi prioritas MVP.

User bisa upload CSV dari activity export atau hasil split table.

Contoh kolom yang dibutuhkan:

```text
Step Type
Interval
Lap
Time
Distance
Avg Pace
Avg HR
Max HR
Avg Power
Best Pace
Avg Cadence
Calories
```

Mapping logic:

```text
Step Type = Warm Up    → warmup section
Step Type = Run        → interval reps
Step Type = Rest       → recovery section
Step Type = Cool Down  → cooldown section
Interval = Summary     → activity summary
```

CSV parser harus bisa membaca:

- Total distance.
- Total duration.
- Average pace.
- Warm up.
- Run interval.
- Rest/recovery.
- Cool down.
- Average heart rate.
- Max heart rate.
- Cadence.
- Power.
- Calories.

CSV upload harus menjadi fitur pertama yang dibuat.

---

## 4.2 Screenshot Split Strava

Ini menjadi fitur lanjutan yang menggunakan AI/OCR.

Flow:

```text
User upload screenshot split Strava
→ OCR / Vision AI membaca tabel
→ App extract data split
→ User review hasil parsing
→ User koreksi jika ada yang salah
→ Generate transparent card dan copy text
```

Data yang perlu diekstrak:

- Split number.
- Lap number.
- Distance.
- Time.
- Pace.
- Heart rate, jika ada.
- Elevation, jika ada.
- Cadence, jika ada.

Karena OCR bisa salah baca angka, wajib ada step:

> Review parsed data before generate.

---

## 4.3 Manual Input

Manual input digunakan sebagai fallback.

User bisa isi data secara manual:

```text
Distance: 8 km
Time: 1:01:19
Workout: 5 x 500m
Rep 1: 2:39 / 5:18
Rep 2: 2:50 / 5:40
Rep 3: 2:53 / 5:47
Rep 4: 2:49 / 5:40
Rep 5: 2:12 / 4:26
```

Manual input penting supaya aplikasi tetap bisa digunakan meskipun CSV atau screenshot gagal dibaca.

---

## 5. Share Template Type

Minimal MVP memiliki lima tipe template.

---

## 5.1 Classic Summary

Untuk easy run, long run, atau recovery run.

Isi:

- Distance.
- Moving time.
- Average pace.
- Average heart rate.
- Calories.
- Elevation, jika ada.

---

## 5.2 Interval Breakdown

Template utama untuk interval run.

Isi:

- Workout title.
- Main set.
- Rep table.
- Fastest rep.
- Average rep pace.
- Warm up.
- Cool down.

Contoh:

```text
5 × 500M

01  2:39  5:18/km
02  2:50  5:40/km
03  2:53  5:47/km
04  2:49  5:40/km
05  2:12  4:26/km

Fastest: #05 · 4:26/km
```

---

## 5.3 Minimal Overlay

Template transparan yang hanya menampilkan angka utama.

Contoh:

```text
8.00 KM
1:01:19
7:40 /KM
```

Cocok untuk ditempel di foto atau video.

---

## 5.4 Rep Focus

Template yang hanya fokus ke interval reps.

Contoh:

```text
5 × 500M

5:18
5:40
5:47
5:40
4:26
```

Cocok untuk user yang ingin highlight performa interval saja.

---

## 5.5 Story Caption

Output berupa teks, bukan gambar.

Digunakan untuk caption Instagram, WhatsApp, atau X.

---

## 6. Data Normalization

Semua input harus dinormalisasi ke satu format internal yang sama.

Dengan begitu, input dari CSV, screenshot, manual input, atau Strava API bisa masuk ke template yang sama.

---

## 6.1 Activity Summary JSON

```json
{
  "distance_km": 8.0,
  "duration": "1:01:19",
  "avg_pace": "7:40",
  "avg_hr": 141,
  "max_hr": 181,
  "calories": 552
}
```

---

## 6.2 Segments JSON

```json
[
  {
    "type": "warmup",
    "label": "Warm Up",
    "distance_km": 1.03,
    "duration": "7:17.2",
    "avg_pace": "7:04"
  },
  {
    "type": "interval",
    "rep": 1,
    "distance_km": 0.5,
    "duration": "2:39.2",
    "avg_pace": "5:18"
  },
  {
    "type": "rest",
    "duration": "2:30",
    "avg_pace": "11:36"
  },
  {
    "type": "cooldown",
    "label": "Cool Down",
    "distance_km": 3.66,
    "duration": "30:35.0",
    "avg_pace": "8:21"
  }
]
```

---

## 7. Technical Plan

---

## 7.1 Frontend

Rekomendasi stack:

- Next.js atau React + Vite.
- Tailwind CSS.
- File upload.
- Preview transparent card.
- Copy text button.
- Export PNG.

Library yang bisa dipakai:

- `papaparse` untuk parse CSV di frontend.
- `html-to-image` untuk export PNG transparent.
- `react-dropzone` untuk upload file.
- `zod` untuk validasi data.
- `lucide-react` untuk icon.

Untuk MVP cepat, parsing CSV bisa dilakukan di frontend.

---

## 7.2 Backend

Rekomendasi stack:

- FastAPI.
- PostgreSQL.
- Object storage untuk hasil export jika perlu.
- Playwright untuk render image dari HTML jika ingin hasil export konsisten.

Endpoint awal:

```text
POST /activities/import/csv
POST /activities/import/screenshot
POST /activities/parse/manual
POST /share/render
GET  /activities/{id}
GET  /activities/{id}/copy-text
```

---

## 7.3 OCR / AI Screenshot Parser

Pipeline:

```text
Upload screenshot
→ Vision AI / OCR
→ Extract table
→ Normalize data
→ User review
→ Generate share output
```

Target JSON hasil OCR:

```json
{
  "activity_type": "interval_run",
  "summary": {
    "distance_km": 8.0,
    "time": "1:01:19",
    "avg_pace": "7:40",
    "avg_hr": 141,
    "max_hr": 181
  },
  "segments": [
    {
      "type": "warmup",
      "distance_km": 1.03,
      "time": "7:17.2",
      "avg_pace": "7:04"
    },
    {
      "type": "run",
      "rep": 1,
      "distance_km": 0.5,
      "time": "2:39.2",
      "avg_pace": "5:18"
    }
  ]
}
```

---

## 8. Suggested Database Schema

---

## 8.1 activities

```text
id
user_id
source
source_activity_id
sport_type
title
start_time
distance_m
moving_time_s
elapsed_time_s
avg_pace
avg_hr
max_hr
elevation_gain
raw_file_path
created_at
```

---

## 8.2 activity_segments

```text
id
activity_id
segment_type
rep_number
label
start_distance_m
end_distance_m
duration_s
distance_m
avg_pace
avg_hr
max_hr
avg_power
avg_cadence
created_at
```

---

## 8.3 share_exports

```text
id
activity_id
template_type
format
image_url
copy_text
config_json
created_at
```

---

## 9. MVP Scope

---

## Version 0.1

Fokus: CSV upload + transparent export + copy text.

Fitur:

- Upload CSV.
- Auto parse activity summary.
- Detect warm up, interval, rest, cool down.
- Generate normalized activity JSON.
- Generate copyable text.
- Preview transparent card.
- Export PNG transparent.
- 3 template awal:
  - Minimal overlay.
  - Interval breakdown.
  - Clean summary.
- Tanpa login.

---

## Version 0.2

Fokus: screenshot Strava.

Fitur:

- Upload screenshot split.
- AI/OCR parser.
- Preview parsed result.
- Manual correction.
- Generate transparent card dan copy text dari screenshot.

---

## Version 0.3

Fokus: history dan user account.

Fitur:

- Login.
- Save activities.
- Save template preferences.
- Regenerate previous activity.
- Upload custom background.
- Save export history.

---

## Version 0.4

Fokus: Strava integration.

Fitur:

- Connect Strava OAuth.
- Import recent activity.
- Convert activity stream/lap data.
- Generate share output.

---

## 10. Build Priority

Urutan paling masuk akal:

1. CSV parser.
2. Normalized activity JSON.
3. Copy text generator.
4. Transparent card renderer.
5. PNG export.
6. Manual editor.
7. Screenshot OCR.
8. Template presets.
9. Account/history.
10. Strava integration.

Jangan mulai dari Strava API dulu.

MVP paling cepat dan paling berguna adalah:

> Upload CSV → generate copy text → generate transparent PNG.

---

## 11. Key Differentiator

Yang membuat aplikasi ini beda:

1. Bukan sekadar activity card.
2. Bisa format interval run dengan benar.
3. Bisa export transparent PNG.
4. Bisa copy summary dalam bentuk teks.
5. Bisa input dari CSV, screenshot, atau manual.
6. Bisa dipakai tanpa subscription Strava.
7. Tidak bergantung penuh pada Strava API.

---

## 12. Final MVP Statement

MVP aplikasi:

> Aplikasi web untuk upload CSV activity lari, membaca split interval, lalu menghasilkan transparent PNG dan copyable text summary yang siap dipakai untuk Instagram Story, WhatsApp, atau caption sosial media.

Fitur utama MVP:

```text
CSV Upload
→ Parse Activity
→ Detect Interval
→ Generate Copy Text
→ Preview Transparent Card
→ Export PNG Transparent
```
