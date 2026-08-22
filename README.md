# CompanyFinancialApps - Finance & Payment Monitoring System (FSPMS)

CompanyFinancialApps adalah platform manajemen dan monitoring finansial terpadu yang dirancang untuk mengonsolidasikan seluruh kontrak sirkuit internet Fiber Optic (FO), cloud hosting, dan lisensi perangkat lunak ke dalam satu dasbor eksekutif. Sistem ini memfasilitasi visibilitas arus kas, pengawasan tanggal jatuh tempo pembayaran provider, serta kepatuhan aturan finansial perusahaan secara akurat.

---

## Fitur Utama

- **Single Inbox Payment Monitoring**: Pusat pemantauan tagihan bulanan dengan indikator status otomatis (UPCOMING, DUE_SOON, OVERDUE, PAID).
- **Executive Financial Dashboard**: Ringkasan performa finansial real-time, grafik tren biaya bulanan, distribusi provider, dan metriks aging tagihan.
- **Circuit & Service Registry**: Pengelolaan data sirkuit FO, CID, Site ID, lokasi/alamat outlet, provider, dan skema biaya bulanan.
- **Master Data Management**: Manajemen terpusat untuk data Pelanggan (Customers) dan Penyedia Layanan (Providers / Vendors).
- **Audit Trail System**: Pencatatan riwayat setiap aksi perubahan data (Create, Update, Archive, Mark as Paid) dalam log audit terstruktur (JSON payload viewer).
- **Interactive Notification Center**: Pusat pemberitahuan real-time untuk alert tagihan overdue, peringatan H-7 jatuh tempo, serta log aktivitas sistem.
- **Global Search & Filter**: Pencarian instan berdasarkan CID, Nama Toko/Outlet, Site ID, atau nama Provider di seluruh halaman aplikasi.
- **Skeleton Loading Animation**: Pengalaman pengguna (UX) yang halus dengan placeholder berdenyut sebelum data API dimuat penuh.

---

## Teknologi yang Digunakan

### Backend
- Bahasa Pemrograman: Golang (v1.22+)
- Web Framework: Gin Gonic
- Database ORM: GORM (PostgreSQL Driver)
- Caching & Data Store: Redis
- Autentikasi: JWT (JSON Web Token) dengan Role-Based Access Control (RBAC)
- Password Hashing: Bcrypt Cryptographic Hashing

### Frontend
- Framework: ReactJS (Vite)
- Styling: Tailwind CSS
- State Management: Zustand
- Visualisasi Data: Recharts
- Iconography: Lucide React & Material Symbols

### Infrastruktur & Deployment
- Containerization: Docker & Docker Compose
- Web Server Frontend: Nginx (Alpine-based)

---

## Struktur Proyek

```text
CompanyFinancialApps/
├── backend/
│   ├── cmd/
│   │   └── api/                  # Entrypoint aplikasi backend (main.go)
│   ├── config/                   # Konfigurasi environment & aplikasi
│   ├── internal/
│   │   ├── delivery/
│   │   │   └── http/             # HTTP Router, Handlers (API v1), & Middleware
│   │   ├── domain/               # Struct entitas data & kontrak interface
│   │   ├── repository/           # Query database PostgreSQL via GORM
│   │   └── usecase/              # Logika bisnis aplikasi
│   └── pkg/                      # Library pendukung (JWT, Hashing, Response, Utils)
├── frontend/
│   ├── src/
│   │   ├── components/           # Komponen UI global (Skeleton, Pagination, Logo, Modal)
│   │   ├── layouts/              # Layout pembungkus utama (Sidebar, Header, Search, Notification)
│   │   ├── pages/                # Halaman aplikasi (Dashboard, Services, Payments, MasterData, AuditLogs, Users)
│   │   ├── services/             # Integrasi Axios API Client
│   │   └── store/                # State management Zustand
│   ├── Dockerfile
│   └── nginx.conf
├── migrations/                   # Script migrasi DDL database PostgreSQL (.sql)
├── docker-compose.yml            # Konfigurasi penganggotan kontainer Docker
└── README.md                     # Dokumentasi teknis proyek
```

---

## Prasyarat Sistem

Sebelum menjalankan aplikasi, pastikan perangkat Anda telah terinstal:
- Docker Desktop (v20.10+) & Docker Compose (v2.0+)
- Git (v2.30+)

*(Opsional untuk pengembangan lokal tanpa Docker)*:
- Go (v1.22+)
- Node.js (v20+) & npm
- PostgreSQL Server (v15+)
- Redis Server (v7+)

---

## Cara Menjalankan Aplikasi

### Metode 1: Menggunakan Docker Compose (Sangat Direkomendasikan)

1. **Clone Repository**
   ```bash
   git clone https://github.com/Artacomindo-Jejaring-Nusa/CompanyFinancialApps.git
   cd CompanyFinancialApps
   ```

2. **Jalankan Seluruh Layanan dengan Docker Compose**
   Perintah ini akan secara otomatis membuat dan menjalankan kontainer PostgreSQL, Redis, Backend Golang API, dan Frontend Nginx.
   ```bash
   docker-compose up -d --build
   ```

3. **Akses Aplikasi**
   - **Frontend App**: `http://localhost:3000`
   - **Backend REST API**: `http://localhost:8080`
   - **Health Check API**: `http://localhost:8080/health`

4. **Menghentikan Layanan**
   ```bash
   docker-compose down
   ```

---

### Metode 2: Menjalankan Secara Manual (Development Mode)

#### 1. Persiapan Database PostgreSQL
Buat database bernama `fspms_db` di PostgreSQL lokal Anda dan eksekusi script migrasi SQL yang tersedia di folder `migrations/`.

#### 2. Menjalankan Backend Golang
```bash
cd backend
go mod download
go run cmd/api/main.go
```
*Backend API akan berjalan di `http://localhost:8080`.*

#### 3. Menjalankan Frontend ReactJS
```bash
cd frontend
npm install
npm run dev
```
*Frontend dev server akan berjalan di `http://localhost:3000`.*

---

## Akun & Kredensial Pengujian (Default Test Accounts)

Anda dapat menggunakan akun bawaan berikut untuk menguji berbagai tingkat hak akses (RBAC):

| Username | Password | Role | Hak Akses |
| :--- | :--- | :--- | :--- |
| `admin` | `password123` | Administrator | Full Access (CRUD Users, Services, Master Data, Audit Logs, Mark Paid) |
| `supervisor` | `password123` | Finance Supervisor | Read All, CRUD Services & Master Data, Audit Logs, Mark Paid |
| `staff` | `password123` | Finance Staff | Read All, Create/Update Services & Master Data, Mark Paid |

---

## Lisensi & Hak Cipta

Hak Cipta (c) 2026 PT Artacomindo Jejaring Nusa. Seluruh hak dilindungi undang-undang. Aplikasi ini dikembangkan untuk penggunaan internal perusahaan.
