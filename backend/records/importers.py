"""Read names from Excel (.xls/.xlsx) or Access (.mdb/.accdb) files, in file order."""
import os
import re
import tempfile

import pandas as pd

ALLOWED = {".xls", ".xlsx", ".mdb", ".accdb"}


def norm(name):
    return re.sub(r"[^a-z]", "", str(name).lower())


def read_rows(upload):
    ext = os.path.splitext(upload.name)[1].lower()
    if ext not in ALLOWED:
        raise ValueError("Only Excel (.xls, .xlsx) and Access (.mdb, .accdb) files are allowed.")
    if ext in (".xls", ".xlsx"):
        df = pd.read_excel(upload, dtype=object)  # first sheet
    else:
        df = _read_access(upload)
    df = df.dropna(how="all")
    df.columns = [norm(c) for c in df.columns]
    df = df.astype(object).where(pd.notnull(df), None)
    return df.to_dict("records")


def _read_access(upload):
    from access_parser import AccessParser  # pip install access-parser

    with tempfile.NamedTemporaryFile(suffix=os.path.splitext(upload.name)[1], delete=False) as tmp:
        for chunk in upload.chunks():
            tmp.write(chunk)
    try:
        db = AccessParser(tmp.name)
        tables = [t for t in db.catalog if not str(t).startswith("MSys")]
        if not tables:
            raise ValueError("No tables were found in the Access file.")
        return pd.DataFrame(db.parse_table(tables[0]))  # first table
    finally:
        os.unlink(tmp.name)


def pick(row, *keys):
    for k in keys:
        v = row.get(k)
        if v not in (None, ""):
            return v
    return None


def text(v):
    return "" if v is None else str(v).strip()


def clean_date(v):
    if v in (None, ""):
        return None
    d = pd.to_datetime(v, errors="coerce")
    return None if pd.isnull(d) else d.date()


def name_from(row):
    name = text(pick(row, "name", "fullname", "names", "fullnames", "person", "baptismalname"))
    if not name:
        name = (text(pick(row, "firstname", "first", "givenname")) + " " +
                text(pick(row, "lastname", "surname", "last", "familyname"))).strip()
    if not name and row:
        name = text(next(iter(row.values())))  # fall back to the first column
    return name


def split_name(row):
    """Return (christian_name, surname) for a spreadsheet row."""
    first = text(pick(row, "christianname", "firstname", "first", "givenname", "baptismalname"))
    last = text(pick(row, "surname", "lastname", "last", "familyname"))
    if first and last:
        return first, last

    parts = name_from(row).split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], parts[0]
    return parts[0], " ".join(parts[1:])


def status_from(value):
    s = text(value).lower()
    if "not" in s or "need" in s:
        return "NONE"
    if "provided" in s or "yes" in s:
        return "PROOF"
    return "PENDING"