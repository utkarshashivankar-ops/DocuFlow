# DocuFlow – Progress report (≈100% build)

The first milestone (≈50%) delivered upload, real OCR, classification, expiry tracking, search and the mobile app.
This build completes the remaining items from the plan.

## Done in this build (second 50%)
| Area | Status | Where |
|---|---|---|
| **Renewal Center** – checklist, step-by-step guide, status (Not Started / In Progress / Completed), notes, configurable official link | Done | `backend/src/controllers/renewalController.js`, `utils/renewalGuide.js`, mobile `RenewalScreen`, `RenewalDetailScreen` |
| Expiry → actionable task (renewal created automatically for every expired / expiring document; completes itself when a later expiry date is detected; starts a new cycle next time) | Done | `services/renewalService.js` |
| **Notification engine** – scheduled scan (90/30/7/1 days, per-user schedule), de-duplication, expired alert | Done | `services/notificationEngine.js`, `utils/reminders.js`, `services/scheduler.js` |
| In-app notifications (bell + unread badge, read / delete / mark-all) | Done | `notificationController.js`, mobile `NotificationsScreen`, `NotificationBell` |
| Email alerts (NodeMailer) | Done (needs SMTP in `.env`) | `services/mailService.js` |
| Push notifications (Expo push service, stale-token cleanup, tap opens the renewal guide) | Done (needs a development/production build – see below) | `services/pushService.js`, mobile `pushService.js` |
| **Version history** – upload a new version, list, open, restore (dates restored too); OCR re-reads the new file and replaces number/dates | Done | `versionController.js`, mobile `VersionHistoryScreen` |
| **Secure sharing** – random 256-bit token (only its SHA-256 hash is stored), 1 h – 7 days, revoke, access counter, file streamed through the API so revoking works instantly, human landing page `/s/:token` | Done | `shareController.js`, `share.routes.js`, mobile `ShareScreen` |
| **Role-based access control** – `admin` role, `requireRole`, admin overview + manual scan, `npm run make-admin` | Done | `adminController.js`, `scripts/makeAdmin.js` |
| **HTTPS** – HSTS, `TRUST_PROXY`, `FORCE_HTTPS` redirect, `PUBLIC_URL` for links; deployment guide | Done (certificate comes from the host) | `app.js`, `docs/DEPLOYMENT.md` |
| Automated tests | 20 backend tests + 9 python tests | `backend/tests/` |
| Postman collection extended | Done | `docs/DocuFlow.postman_collection.json` |

## Honest notes
* **Not run end-to-end here.** MongoDB, Cloudinary, SMTP and an Android device were not available while building. Verified: all
  modules load, the Express app boots, auth guards and public-link validation answer correctly over HTTP, pure logic
  (reminder thresholds, de-duplication, templates, validation) is unit-tested, and all mobile files compile with Babel.
  Please run the checklist in `docs/TESTING.md` on your machine.
* **Push on Android:** Expo Go (SDK 53+) no longer supports remote push. In-app and email alerts work in Expo Go; for push, make a
  development build (`npx expo install expo-notifications expo-device`, then `eas build --profile development --platform android`).
  The app silently skips push when this is not available.
* **Classification is still rule-based**, not a trained model (stated in the README).
* Renewal links are filled only for Passport, Driving Licence, Aadhaar and PAN (single national portals); all other types are empty and
  editable by the user – nothing is invented.
* The old `web-prototype/` is still mock-data only and not wired to the API (scope of the project is the React Native app).

## Optional future work
Trained ML classifier · multi-language OCR · biometric lock · admin web dashboard · wiring `web-prototype/` to the API.
