# Test checklist (tick as you verify)
1. `python-service`: `python -m unittest discover -s tests -v` → 9 pass
2. `backend`: `npm test` → 20 pass
3. Postman: Register → Login → Me → Upload (image of a licence/passport) → GET /documents/:id until `completed`
4. Check MongoDB: document has `extractedText`, `expiryDate`, `category`
5. Postman: Search `q=passport`; Stats; Expiring; Expired
6. Edit expiry date on the phone → Home counts change
7. Register a 2nd account → cannot see 1st account's documents; GET /documents/<id of other user> → 404
8. Delete document → file removed from Cloudinary
9. Stop Python service → upload still saves, document shows "failed" + Retry works after restart

## Second-half checklist (renewal, notifications, versions, sharing)
10. Upload a document whose expiry is within 30 days (or edit one) → **Renewal** tab shows it with a checklist; tick items → status becomes *In Progress*, progress bar moves
11. Open the renewal guide → *Open official website* works for Passport / Driving Licence; edit the link + notes → Save
12. Bell on Home/Renewal → tap → **Check now** → one reminder per document; press again → *No new reminders* (de-duplication)
13. Set `SMTP_*` → run **Check now** → email arrives; switch *Email alerts* off in Profile → no email, in-app still appears
14. Document detail → **Versions** → upload a new file with a later expiry date → alert shows the new date; renewal turns *Completed*; old version still listed; **Restore** brings back old file and dates
15. Document detail → **Share** → create 1-hour link → open it in a desktop browser (landing page) → *Open document* shows the file; **Revoke** → refresh → "Link unavailable"
16. Second account cannot list/revoke/restore the first account's links or versions (404)
17. `npm run make-admin -- <email>` → Postman *Admin → System overview* works for admin, returns 403 for normal users
18. With `FORCE_HTTPS=true` and `TRUST_PROXY=true` behind a proxy, `http://` redirects to `https://`
