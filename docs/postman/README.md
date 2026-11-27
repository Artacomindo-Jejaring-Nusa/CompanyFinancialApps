# Dokumentasi Postman Collection & Environment - FSPMS Integration API

Dokumentasi ini menjelaskan langkah-langkah mengimpor dan menggunakan Postman Collection untuk mengintegrasikan laporan pembayaran dan tagihan vendor dari **Finance FSPMS (finance.ajnusa.com)** ke platform **SaaS HRMS**.

---

## 1. File yang Disediakan

1. **Postman Collection:** `docs/postman/FSPMS_SaaS_HRMS_Integration.postman_collection.json`
2. **Postman Environment:** `docs/postman/FSPMS_Production.postman_environment.json`

---

## 2. Parameter Environment & Konfigurasi

| Variable | Nilai Default | Keterangan |
| :--- | :--- | :--- |
| `baseUrl` | `https://finance.ajnusa.com/api/v1` | URL basis endpoint integrasi FSPMS |
| `apiKey` | `fspms_live_YOUR_API_KEY_HERE` | API Key yang di-generate dari menu **Settings & Administration > API Integration** |
| `period` | `2026-11` | Periode tagihan (format: `YYYY-MM`) |

---

## 3. Cara Import ke Aplikasi Postman

1. Buka aplikasi **Postman**.
2. Klik tombol **Import** di pojok kiri atas.
3. Drag & drop kedua file berikut:
   - `FSPMS_SaaS_HRMS_Integration.postman_collection.json`
   - `FSPMS_Production.postman_environment.json`
4. Pilih environment **FSPMS - Production (finance.ajnusa.com)** di dropdown kanan atas Postman.
5. Edit variabel `apiKey` di tab Environment, lalu masukkan API Key aktif yang telah di-generate.
6. Klik **Save**.

---

## 4. Daftar Endpoint Integrasi

### A. Health & Koneksi
- **GET** `{{baseUrl}}/integration/health`
  - Memverifikasi status API Key dan scope perizinan.

### B. Laporan Pembayaran (SaaS HRMS Expense Sync)
- **GET** `{{baseUrl}}/integration/payment-reports?period=2026-11`
  - Mengambil total pengeluaran tagihan, status lunas, dan rincian per vendor untuk periode tertentu.
- **GET** `{{baseUrl}}/integration/payment-reports?start_date=2026-11-01&end_date=2026-11-30`
  - Mengambil agregasi berdasarkan rentang tanggal.

### C. Daftar Pembayaran & Tagihan (Payments List)
- **GET** `{{baseUrl}}/integration/payments?page=1&limit=25`
  - Mengambil seluruh tagihan dengan pagination.
- **GET** `{{baseUrl}}/integration/payments?status=PAID&page=1&limit=50`
  - Filter tagihan yang sudah dibayar (*PAID*).
- **GET** `{{baseUrl}}/integration/payments?status=UPCOMING&page=1&limit=50`
  - Filter tagihan jatuh tempo mendatang (*UPCOMING*).
- **GET** `{{baseUrl}}/integration/payments?search=MyRepublic&page=1&limit=25`
  - Mencari tagihan berdasarkan nama vendor atau CID.

---

## 5. Header Autentikasi
Setiap request secara otomatis menyertakan header:
```http
X-API-Key: {{apiKey}}
Accept: application/json
```
Atau dapat juga menggunakan:
```http
Authorization: Bearer {{apiKey}}
```
