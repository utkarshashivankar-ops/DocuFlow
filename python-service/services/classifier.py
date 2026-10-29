"""Rule-based document classifier (keyword/pattern scoring).

NOT a machine-learning model. It is deliberately isolated behind classify() so a trained
model can be added later (see models/README.md) without changing the API contract.
"""
import re

CATEGORIES = ["Identity", "Insurance", "Education", "Financial", "Legal", "Other"]

# (documentType, category, strong keywords[w=3], weak keywords[w=1], regex patterns[w=4])
RULES = [
    ("Aadhaar", "Identity",
     ["aadhaar", "aadhar", "uidai", "unique identification authority", "\u0906\u0927\u093e\u0930"],
     ["government of india", "enrolment no", "vid"],
     [r"\b\d{4}\s\d{4}\s\d{4}\b"]),
    ("PAN", "Identity",
     ["permanent account number", "income tax department", "pan card"],
     ["govt. of india", "signature", "father's name"],
     [r"\b[A-Z]{5}\d{4}[A-Z]\b"]),
    ("Passport", "Identity",
     ["passport", "republic of india", "place of issue", "date of expiry", "nationality"],
     ["surname", "given name", "type", "country code"],
     [r"P<[A-Z]{3}"]),
    ("Driving Licence", "Identity",
     ["driving licence", "driving license", "licence to drive", "validity(nt)", "validity (nt)", "transport"],
     ["cov", "lmv", "mcwg", "rto", "blood group", "valid till", "dl no"],
     [r"\b[A-Z]{2}[\s-]?\d{2}[\s-]?\d{11}\b"]),
    ("Health Insurance", "Insurance",
     ["health insurance", "health cover", "coverage amount", "policy schedule", "mediclaim", "sum insured", "cashless", "hospitalisation", "hospitalization", "pre-existing"],
     ["insurance", "policy", "premium", "insured", "tpa", "health"],
     []),
    ("Vehicle Insurance", "Insurance",
     ["motor insurance", "vehicle insurance", "two wheeler", "private car", "own damage", "third party liability",
      "insured declared value", "idv", "registration no"],
     ["insurance", "policy", "premium", "insured", "vehicle", "engine no", "chassis"],
     []),
    ("Life Insurance", "Insurance",
     ["life insurance", "sum assured", "term plan", "maturity benefit", "nominee", "life assured", "lic of india"],
     ["insurance", "policy", "premium", "assured"],
     []),
    ("Degree", "Education",
     ["degree", "bachelor of", "master of", "hereby confers", "convocation", "conferred", "doctor of philosophy"],
     ["university", "awarded", "faculty", "chancellor", "registrar"],
     []),
    ("Marksheet", "Education",
     ["marksheet", "mark sheet", "statement of marks", "grade card", "marks obtained", "sgpa", "cgpa", "seat no"],
     ["result", "semester", "subject", "examination", "board", "percentage", "grade"],
     []),
    ("Certificate", "Education",
     ["certificate of", "certify that", "has successfully completed", "completion", "course", "certificate"],
     ["training", "awarded", "institute", "college", "school"],
     []),
    ("Bank Document", "Financial",
     ["statement of account", "account number", "ifsc", "passbook", "cheque", "bank statement", "savings account"],
     ["bank", "branch", "balance", "debit", "credit", "transaction"],
     [r"\b[A-Z]{4}0[A-Z0-9]{6}\b"]),
    ("Tax Document", "Financial",
     ["income tax return", "itr", "assessment year", "form 16", "form 26as", "tds", "gst", "gstin", "acknowledgement number"],
     ["tax", "deducted", "financial year", "taxable income", "pan"],
     []),
    ("Financial Certificate", "Financial",
     ["fixed deposit", "loan sanction", "emi", "demat", "mutual fund", "investment certificate", "loan account", "interest rate"],
     ["loan", "deposit", "maturity", "principal", "folio"],
     []),
    ("Agreement", "Legal",
     ["this agreement", "rent agreement", "rental agreement", "lease agreement", "leave and licence", "party of the first part",
      "party of the second part", "lessor", "lessee", "licensor", "licensee", "agreement"],
     ["whereas", "witness", "stamp paper", "notary", "hereinafter", "tenant", "landlord", "deposit"],
     []),
    ("Contract", "Legal",
     ["employment contract", "contract", "offer letter", "terms and conditions", "appointment letter", "non-disclosure"],
     ["hereinafter", "employer", "employee", "clause", "obligations", "termination", "salary"],
     []),
]
GENERIC_INSURANCE = ("Insurance Policy", "Insurance")


def _count(text, kw):
    return len(re.findall(r"(?<![a-z0-9])" + re.escape(kw) + r"(?![a-z0-9])", text))


def classify(text):
    low = (text or "").lower()
    scores = []
    for dtype, cat, strong, weak, patterns in RULES:
        s = 0
        for k in strong:
            if _count(low, k):
                s += 3
        for k in weak:
            if _count(low, k):
                s += 1
        for p in patterns:
            if re.search(p, text or ""):
                s += 4
        scores.append((s, dtype, cat))
    scores.sort(key=lambda x: -x[0])
    top, second = scores[0], scores[1]

    if top[0] < 3:
        return {"documentType": "Other Document", "category": "Other", "confidence": 0.0,
                "method": "rule-based", "scores": []}

    # several insurance types tied -> generic insurance policy
    if top[2] == "Insurance" and second[2] == "Insurance" and top[0] - second[0] <= 1:
        dtype, cat = GENERIC_INSURANCE
    else:
        dtype, cat = top[1], top[2]

    confidence = round(top[0] / (top[0] + second[0] + 3), 2)
    return {
        "documentType": dtype,
        "category": cat,
        "confidence": confidence,
        "method": "rule-based",
        "scores": [{"documentType": d, "score": s} for s, d, _ in scores[:3] if s > 0],
    }
