
"""Rule-based field extraction for DocuFlow.

Keeps the existing public API:
find_dates, extract_dates, extract_number, extract_name, extract_fields.
Dates returned to the backend are ISO strings: YYYY-MM-DD.
"""

import re
from datetime import date


MONTHS = {
    month: index
    for index, month in enumerate(
        ["jan", "feb", "mar", "apr", "may", "jun",
         "jul", "aug", "sep", "oct", "nov", "dec"],
        start=1,
    )
}

MON = (
    r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|"
    r"may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|"
    r"sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
)

DATE_RES = [
    ("iso", re.compile(
        r"\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b"
    )),
    ("dmy", re.compile(
        r"\b(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})\b"
    )),
    ("dMy", re.compile(
        r"\b(\d{1,2})(?:st|nd|rd|th)?[\s-]+" + MON
        + r"[\s,-]+(\d{4})\b", re.I
    )),
    ("Mdy", re.compile(
        r"\b" + MON + r"\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b",
        re.I,
    )),
]


def _mk(year, month, day):
    try:
        if 1900 <= year <= 2200:
            return date(year, month, day).isoformat()
    except (ValueError, TypeError):
        pass
    return None


def find_dates(text):
    """Return sorted (start, end, ISO date) tuples.

    Numeric dates use Indian day-first convention.
    Example: 04/05/2027 means 4 May 2027.
    """
    text = text or ""
    found = []

    for kind, pattern in DATE_RES:
        for match in pattern.finditer(text):
            groups = match.groups()

            try:
                if kind == "iso":
                    value = _mk(
                        int(groups[0]), int(groups[1]), int(groups[2])
                    )
                elif kind == "dmy":
                    value = _mk(
                        int(groups[2]), int(groups[1]), int(groups[0])
                    )
                elif kind == "dMy":
                    value = _mk(
                        int(groups[2]),
                        MONTHS[groups[1][:3].lower()],
                        int(groups[0]),
                    )
                else:
                    value = _mk(
                        int(groups[2]),
                        MONTHS[groups[0][:3].lower()],
                        int(groups[1]),
                    )
            except (ValueError, KeyError, IndexError):
                value = None

            if value:
                found.append((match.start(), match.end(), value))

    found.sort(key=lambda item: (item[0], -(item[1] - item[0])))

    result = []
    last_end = -1
    for start, end, value in found:
        if start >= last_end:
            result.append((start, end, value))
            last_end = end

    return result


# Label matching is deliberately conservative: "date" alone is not an
# expiry label, and DOB is never treated as expiry.
EXPIRY_LABELS = re.compile(
    r"\b(?:"
    r"date\s+of\s+expiry|expiry\s+date|expiration\s+date|"
    r"date\s+of\s+expiration|expires?\s*(?:on)?|"
    r"valid\s*(?:till|upto|up\s*to|until|through|thru)|"
    r"valid\s+to|validity\s*\(?\s*(?:nt|non[\s-]?transport)\s*\)?|"
    r"validity(?!\s*(?:start|from|begin|commenc))|"
    r"policy\s+(?:expiry|end)\s*date|end\s+date|"
    r"renewal\s+date|date\s+of\s+renewal|"
    r"expiry|maturity\s+date|valid\s+until"
    r")\b",
    re.I,
)

ISSUE_LABELS = re.compile(
    r"\b(?:"
    r"date\s+of\s+issue|issue\s+date|issued\s+on|"
    r"date\s+of\s+issuance|dt\.?\s*of\s*issue|"
    r"validity\s+(?:start|from|begin\w*)|valid\s+from|"
    r"policy\s+(?:start|commencement|inception)\s*date|"
    r"start\s+date|effective\s+(?:from|date)|"
    r"date\s+of\s+registration|registration\s+date|"
    r"date\s+of\s+printing|printed\s+on|"
    r"issue"
    r")\b",
    re.I,
)

DOB_LABELS = re.compile(
    r"\b(?:date\s+of\s+birth|birth\s+date|dob|d\.?\s*o\.?\s*b\.?)\b",
    re.I,
)

PERIOD_CTX = re.compile(
    r"\b(?:period|from|validity|policy|insurance|term|tenure|lease)\b",
    re.I,
)

PERIOD_JOIN = re.compile(
    r"^\s*(?:(?:both\s+days\s+inclusive)\s*)?"
    r"(?:to|till|until|upto|up\s+to|-|–|—|and)\s*$",
    re.I,
)


def _label_hits(text):
    """Return non-overlapping (start, end, kind) label matches."""
    hits = []

    for kind, pattern in (
        ("Expiry", EXPIRY_LABELS),
        ("Issue", ISSUE_LABELS),
        ("DOB", DOB_LABELS),
    ):
        for match in pattern.finditer(text):
            hits.append((match.start(), match.end(), kind))

    hits.sort(key=lambda item: (item[0], -(item[1] - item[0])))

    clean = []
    last_end = -1
    for hit in hits:
        if hit[0] >= last_end:
            clean.append(hit)
            last_end = hit[1]

    return clean


def _assign_label_dates(text, dates):
    """Associate labels with nearby dates without reusing a date.

    Labels followed by dates are handled first. If several labels precede
    several dates, their order is used. A label without a nearby date remains
    unresolved instead of borrowing a distant date.
    """
    hits = _label_hits(text)
    result = {}
    labelled = []
    used_dates = set()

    for index, (label_start, label_end, kind) in enumerate(hits):
        if kind == "DOB":
            continue

        next_label_start = (
            hits[index + 1][0] if index + 1 < len(hits) else len(text)
        )

        # Only consider dates after this label and before the next label.
        candidates = [
            (date_index, item)
            for date_index, item in enumerate(dates)
            if date_index not in used_dates
            and label_end <= item[0] < next_label_start
            and item[0] - label_end <= 100
        ]

        if candidates:
            date_index, (_, _, iso) = candidates[0]
            used_dates.add(date_index)
            result.setdefault(kind, iso)
            labelled.append((kind, iso))

    # Handle two labels followed by two dates, where OCR often produces:
    # "Issue Date Expiry Date 01/01/2025 01/01/2027".
    unresolved = [
        (i, hit) for i, hit in enumerate(hits)
        if hit[2] in ("Issue", "Expiry")
        and not any(kind == hit[2] for kind, _ in labelled)
    ]

    if unresolved:
        for _, (_, _, kind) in unresolved:
            if kind in result:
                continue

            # A remaining date can only be assigned if its nearby text
            # contains this label and no conflicting date label.
            for date_index, (start, end, iso) in enumerate(dates):
                if date_index in used_dates:
                    continue

                context_start = max(0, start - 90)
                context = text[context_start:end]
                expiry_matches = list(EXPIRY_LABELS.finditer(context))
                issue_matches = list(ISSUE_LABELS.finditer(context))

                if kind == "Expiry" and expiry_matches:
                    result[kind] = iso
                    labelled.append((kind, iso))
                    used_dates.add(date_index)
                    break

                if kind == "Issue" and issue_matches and not expiry_matches:
                    result[kind] = iso
                    labelled.append((kind, iso))
                    used_dates.add(date_index)
                    break

    return result, labelled


def _date_after(text, position, window=40):
    for _, _, iso in find_dates(text[position:position + window]):
        return iso
    return None


def extract_dates(text):
    text = text or ""
    dates = find_dates(text)
    found, labelled = _assign_label_dates(text, dates)

    expiry = found.get("Expiry")
    issue = found.get("Issue")

    # Infer a date range only when its surrounding text explicitly suggests
    # a policy, insurance, lease, validity or term period.
    if not expiry:
        for index in range(len(dates) - 1):
            start1, end1, first_date = dates[index]
            start2, _, second_date = dates[index + 1]

            between = text[end1:start2]
            context = text[max(0, start1 - 100):start1]

            if (
                PERIOD_JOIN.fullmatch(between)
                and PERIOD_CTX.search(context)
                and second_date > first_date
            ):
                if not issue:
                    issue = first_date
                expiry = second_date
                break

    # Reject logically inconsistent issue/expiry pairs.
    if issue and expiry and issue >= expiry:
        issue = None

    # DOB is recorded as an important date only; it is not an expiry date.

    # Keep important dates unique while preserving their order.
    important = []
    seen_important = set()

    for kind, value in labelled:
        if kind == "Issue" and value == expiry:
            continue

        key = (kind, value)
        if key not in seen_important:
            important.append({"label": kind, "date": value})
            seen_important.add(key)


    for match in DOB_LABELS.finditer(text):
        dob = _date_after(text, match.end(), 40)
        if dob:
            important.append({"label": "Date of Birth", "date": dob})
            break

    return {
        "issueDate": issue,
        "expiryDate": expiry,
        "importantDates": important,
    }


NUMBER_BY_TYPE = {
    "PAN": re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b", re.I),
    "Aadhaar": re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"),
    "Passport": re.compile(r"\b[A-Z]\d{7}\b", re.I),
    "Driving Licence": re.compile(
        r"\b[A-Z]{2}[\s-]?\d{2}[\s-]?\d{4,13}\b", re.I
    ),
}

NUMBER_LABELLED = re.compile(
   r"\b(?:policy|record|licen[cs]e|passport|certificate|registration|reg|"
    r"enrol(?:l)?ment|account|agreement|contract|serial|document|"
    r"dl|seat|roll|file|reference|ref)\s*"
    r"(?:no\.?|number|#)\s*[:\-]?\s*"
    r"([A-Z0-9][A-Z0-9/\- ]{2,24}[A-Z0-9])",
    re.I,
)


def extract_number(text, doc_type):
    text = text or ""

    pattern = NUMBER_BY_TYPE.get(doc_type)
    if pattern:
        match = pattern.search(text)
        if match:
            return re.sub(r"\s+", " ", match.group(0)).strip()

    match = NUMBER_LABELLED.search(text)
    if match:
        value = re.split(r"\s{2,}|\n", match.group(1))[0]
        return value.strip(" -/") or None

    return None


NAME_LABEL = re.compile(
    r"^\s*(?:"
    r"name(?:\s+of\s+(?:the\s+)?(?:insured|holder|policy\s*holder|"
    r"candidate|student|employee|account\s*holder))?"
    r"|holder'?s?\s+name|insured\s+name|candidate'?s?\s+name|"
    r"student'?s?\s+name|policy\s*holder|account\s+holder|"
    r"this\s+is\s+to\s+certify\s+that"
    r")\s*[:\-]?\s*(.*)$",
    re.I,
)

NAME_OK = re.compile(r"^[A-Za-z][A-Za-z .'\-]{1,58}$")
STOP = re.compile(
    r"\b(father|mother|husband|spouse|dob|date|address|"
    r"s/o|d/o|w/o|c/o|policy|number|no)\b",
    re.I,
)


def _clean_name(value):
    value = re.split(
        r"\s{2,}|\||\bS/O\b|\bD/O\b|\bW/O\b|\bC/O\b",
        value.strip(),
        flags=re.I,
    )[0]
    value = value.strip(" :-.,")
    if (
        not NAME_OK.fullmatch(value)
        or STOP.search(value)
        or not (1 <= len(value.split()) <= 5)
    ):
        return None

    return value.title() if value.isupper() else value


def extract_name(text, doc_type=None):
    lines = [line.strip() for line in (text or "").splitlines() if line.strip()]

    for index, line in enumerate(lines):
        match = NAME_LABEL.match(line)
        if not match:
            continue

        name = _clean_name(match.group(1)) if match.group(1) else None
        if not name and index + 1 < len(lines):
            name = _clean_name(lines[index + 1])
        if name:
            return name

    # Common layout: name appears immediately above DOB on identity cards.
    if doc_type in ("Aadhaar", "Driving Licence", "Passport"):
        for index, line in enumerate(lines):
            if DOB_LABELS.search(line) and index > 0:
                name = _clean_name(lines[index - 1])
                if name:
                    return name

    return None


def extract_fields(text, doc_type=None):
    text = text or ""
    dates = extract_dates(text)

    return {
        "holderName": extract_name(text, doc_type),
        "documentNumber": extract_number(text, doc_type),
        "issueDate": dates["issueDate"],
        "expiryDate": dates["expiryDate"],
        "importantDates": dates["importantDates"],
    }
