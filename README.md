# DocuFlow – Smart Document Management App

> Bajaj Institute of Technology, Wardha · Project Phase I (BTCOS708) · *Web-Based Smart Document Management System Using OCR*

DocuFlow turns passive document storage into an intelligent assistant: you scan or upload a document,
it is stored securely, read with **Tesseract OCR**, **classified**, its **expiry date is extracted and tracked**,
and you can find it again with real search.

**Implemented flow:** Upload/Scan → OCR → Data extraction → Categorisation → Secure storage → Search/Manage → Expiry tracking

> **Build status: ~100% (final build).** Second half added: renewal workflow, notification engine (in-app + email + push),
> version history, secure share links, admin role, HTTPS support. See [`docs/PROGRESS.md`](docs/PROGRESS.md) for details and honest limitations.

---

## 1. Architecture

```
React Native (Expo) app
        │  REST + JWT
        ▼
Node.js + Express API ───► MongoDB (Mongoose)
        │      │
        │      └──────────► Cloudinary (private/authenticated storage)
        ▼
Python service (Flask) ───► Tesseract OCR (pytesseract) + rule-based classifier / field extractor

NodeMailer (SMTP) – password-reset codes + expiry alerts   ·   Expo push service – push alerts
Scheduler (inside the API) scans every hour for due reminders
```
The mobile app never talks to MongoDB, Cloudinary or the Python service directly – only to the Express API.

## 2. Technology stack
React Native + Expo + React Navigation · Node.js + Express · MongoDB + Mongoose · Cloudinary · Tesseract OCR ·
Python (Flask, pytesseract, PyMuPDF) · JWT + bcrypt(js) · NodeMailer · Git/GitHub · VS Code · Postman

> `bcryptjs` is used (same bcrypt algorithm, cost 12) because it installs on Windows without a C++ compiler.

**Honest note on "AI":** classification is a **rule-based keyword/pattern scoring system**, not a trained ML model.
It is isolated behind `classify()` in `python-service/services/classifier.py` so a real model can be added later
(see `python-service/models/README.md`).

## 3. Folder structure
```
DocuFlow/
├── backend/            Express API (controllers, routes, models, middleware, services, utils)
├── python-service/     Flask: Tesseract OCR + classifier + field extractor (+ unit tests)
├── mobile/             Expo React Native app (screens, components, navigation, services, context)
├── web-prototype/      Your original Vite/React web UI (mock data only – kept for reference)
├── docs/               Postman collection, progress report, test checklist
└── README.md
```

## 4. Requirements
| Tool | Version | Notes |
|---|---|---|
| Node.js | 18+ (20/22 recommended) | https://nodejs.org |
| Python | 3.10+ | https://python.org (tick "Add to PATH") |
| Tesseract OCR | 5.x | see §9 |
| MongoDB | Community 6/7/8 **or** a free Atlas cluster | see §7 |
| Cloudinary account | free tier | see §8 |
| Android phone with **Expo Go**, or Android Studio emulator | | |
| Postman | | for API testing |

## 5. Installation (first time)
```bash
# 1. Backend
cd backend
npm install
cp .env.example .env          # Windows PowerShell: copy .env.example .env   -> then edit .env

# 2. Python service
cd ../python-service
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # optional

# 3. Mobile
cd ../mobile
npm install
npx expo install expo-notifications expo-device   # optional: push alerts (needs a dev build, not Expo Go)
npx expo install --fix        # aligns package versions with your installed Expo SDK
cp .env.example .env          # then set EXPO_PUBLIC_API_URL (see §14)
```

## 6. Environment variables
Backend `backend/.env` (full list with comments in `backend/.env.example`):

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | **yes** | MongoDB connection string |
| `JWT_SECRET` | **yes** | ≥16 chars. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | for uploads | from the Cloudinary dashboard |
| `PYTHON_SERVICE_URL` | yes | default `http://localhost:8000` |
| `PYTHON_SERVICE_KEY` | optional | shared secret – same value in `python-service/.env` |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASSWORD` `MAIL_FROM` | for email | without SMTP, reset codes are printed in the backend console (dev only) |
| `EXPIRY_WARNING_DAYS` | no | default "Expiring Soon" window (30) |
| `NOTIFICATION_SCHEDULE_DAYS` | no | `90,30,7,1` default reminder days (each user can choose their own in Profile) |
| `NOTIFICATION_SCAN_MINUTES` | no | how often the engine looks for due reminders (default 60) |
| `PUBLIC_URL` | for sharing | public address of the API; share links are `PUBLIC_URL/s/<token>` |
| `TRUST_PROXY` / `FORCE_HTTPS` | production | set `true` behind an HTTPS proxy (see `docs/DEPLOYMENT.md`) |
| `APP_TIMEZONE` | no | default `Asia/Kolkata` – used to decide what "today" is |

Mobile `mobile/.env`: `EXPO_PUBLIC_API_URL` only. **Never commit real `.env` files** (they are git-ignored).

## 7. MongoDB setup
**Local:** install MongoDB Community, make sure the service is running, use `MONGO_URI=mongodb://127.0.0.1:27017/docuflow`.
**Atlas (no install):** create a free cluster → *Database Access* add a user → *Network Access* allow your IP →
*Connect → Drivers* copy the string, replace `<password>`, and append `/docuflow`.

## 8. Cloudinary setup
Sign up at cloudinary.com → Dashboard → copy **Cloud name, API Key, API Secret** into `backend/.env`.
Files are uploaded as **private (`authenticated`)** assets under `docuflow/<userId>/`. The API returns *signed* URLs
only to the document's owner, so documents are not publicly guessable.

## 9. Tesseract setup
* **Windows:** install from https://github.com/UB-Mannheim/tesseract/wiki (default path `C:\Program Files\Tesseract-OCR`).
  Either add that folder to PATH, or set `TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe` in `python-service/.env`
  (and load it, e.g. set the variable in the terminal before starting).
* **Ubuntu/Debian:** `sudo apt install tesseract-ocr` · **macOS:** `brew install tesseract`
* Check: `tesseract --version`

## 10. Run everything (4 terminals)
```bash
# Terminal 1 – MongoDB (if local; usually already running as a service)

# Terminal 2 – Python service  (http://localhost:8000)
cd python-service && .venv\Scripts\activate && python app.py

# Terminal 3 – Backend API     (http://localhost:5000)
cd backend && npm run dev

# Terminal 4 – Mobile app
cd mobile && npx expo start
```
Health checks: `http://localhost:8000/health` and `http://localhost:5000/api/health`.

## 11. Android testing
* **Physical phone (easiest):** install *Expo Go* → phone and PC on the **same Wi-Fi** → scan the QR code from `expo start`.
  Set `EXPO_PUBLIC_API_URL=http://<PC-LAN-IP>:5000` (get the IP with `ipconfig`), restart `expo start -c`.
  Allow Node through Windows Firewall when prompted.
* **Emulator:** Android Studio → Device Manager → start a device → press `a` in the Expo terminal.
  Use `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000`.
* If Expo Go says the SDK is incompatible: `npx expo install expo@latest && npx expo install --fix`.

## 12. API overview (implemented)
| Method | Path | |
|---|---|---|
| POST | `/api/auth/register` · `/login` · `/forgot-password` · `/reset-password` | public (rate-limited) |
| GET | `/api/auth/me` | JWT |
| GET/PUT | `/api/users/profile` | name, notification prefs, expiry-warning days |
| POST | `/api/documents/upload` | multipart `file` (+ optional `title`, `category`) → Cloudinary → async OCR pipeline |
| POST/GET | `/api/documents` | create (manual) / list (`category`, `status`, `sort`, `page`, `limit`) |
| GET | `/api/documents/search?q=` | title, type, category, holder, number, OCR text |
| GET | `/api/documents/stats` · `/expiring` · `/expired` | dashboard + expiry lists |
| GET/PUT/DELETE | `/api/documents/:id` | owner-only (others get 404) |
| POST | `/api/ocr/process` | `{documentId}` re-run OCR + classification |
| GET | `/api/renewals` · `/renewals/document/:documentId` | Renewal Center overview / one document's task (auto-created) |
| PUT | `/api/renewals/:id` | status, checklist, notes, official link |
| GET | `/api/notifications` · `/unread-count` | in-app notifications |
| POST/PATCH/DELETE | `/api/notifications/scan` · `/read-all` · `/:id/read` · `/:id` | check now, mark read, delete |
| GET/POST | `/api/documents/:id/versions` | list history / upload a new version (multipart `file`) |
| POST | `/api/documents/:id/versions/:n/restore` | roll back to version n |
| POST/GET/DELETE | `/api/documents/:id/share` · `/shares` · `/shares/:linkId` | create (1 h – 7 days) / list / revoke secure links |
| GET | `/api/shared/:token` · `/api/shared/:token/file` · `/s/:token` | **public** – metadata, file stream, landing page |
| GET/POST | `/api/admin/overview` · `/admin/notifications/scan` | **admin role only** |

Upload response is immediate; `processingStatus` then moves `processing → extracting → classifying → completed | failed`
and the app polls `GET /api/documents/:id` to show live progress.

## 13. Postman testing
Import `docs/DocuFlow.postman_collection.json`. Run **Register** (or **Login**) first – a test script stores the JWT in
the `token` variable automatically; **Upload** stores `docId`. Change `baseUrl` if needed. See `docs/TESTING.md`.

## 14. Automated tests that ship with this build
```bash
cd python-service && python -m unittest discover -s tests -v   # classifier, extractor, real Tesseract round-trip
cd backend && npm test                                          # expiry logic, reminders, renewal templates, validation, HTTP guards
```

## 15. Common errors and fixes
| Symptom | Fix |
|---|---|
| App: *"Cannot reach the server"* | Wrong API address → check `EXPO_PUBLIC_API_URL`, same Wi-Fi, firewall; restart with `npx expo start -c` |
| Backend: *Missing required environment variables* | create `backend/.env` from `.env.example` |
| Backend: `MongooseServerSelectionError` | MongoDB not running / wrong `MONGO_URI` / Atlas IP not allow-listed |
| Upload → *"File storage is not configured"* (503) | fill `CLOUDINARY_*` in `backend/.env`, restart backend |
| Document ends in *failed*: "service is not reachable" | start the Python service; check `PYTHON_SERVICE_URL` / matching `PYTHON_SERVICE_KEY` |
| *"Tesseract is not installed or not on PATH"* | install Tesseract (§9) or set `TESSERACT_CMD`; reopen the terminal |
| Upload → 415 *Unsupported file type* | only JPG/PNG/WEBP/PDF are accepted (HEIC photos are not) |
| OCR finds no expiry date | expected for blurry/cropped photos – open the document → *Edit details* and enter it; dashboard updates instantly |
| `expo install --fix` / version warnings | run `npx expo install --fix` inside `mobile/` |
