# Deploying DocuFlow (HTTPS)

TLS certificates are issued by your hosting platform; the API is already prepared to run behind it.

## Backend on Render / Railway (free tiers work)
1. Push the repo to GitHub. Create a **Web Service** from `backend/` – build `npm install`, start `npm start`.
2. Add environment variables (see `backend/.env.example`). Production values:
   ```
   NODE_ENV=production
   PUBLIC_URL=https://<your-service>.onrender.com
   TRUST_PROXY=true
   FORCE_HTTPS=true
   MONGO_URI=<Atlas string>      JWT_SECRET=<48+ random hex>
   CLOUDINARY_*   SMTP_*   MAIL_FROM
   PYTHON_SERVICE_URL=https://<your-python-service>   PYTHON_SERVICE_KEY=<shared secret>
   ```
3. Deploy the **python-service** as a second service (needs Tesseract: use a Dockerfile with `apt-get install tesseract-ocr`).
4. Check `https://<your-service>/api/health`. Plain `http://` requests are redirected to https and browsers receive HSTS.

## Mobile app
Set `EXPO_PUBLIC_API_URL=https://<your-service>` in `mobile/.env`, restart with `npx expo start -c`.
Share links are built from `PUBLIC_URL`, so they will be `https://…/s/<token>`.

## First administrator
```bash
cd backend && npm run make-admin -- you@example.com
```
