export function truncateSkills(skills, max = 3) {
  const tags = String(skills || '').split(',').map(s => s.trim()).filter(Boolean);
  if (tags.length === 0) return { shown: '', hidden: 0 };
  return {
    shown: tags.slice(0, max).join(', '),
    hidden: Math.max(0, tags.length - max),
  };
}

const STREET_PATTERN = /(straße|str\.?|weg|platz|allee|gasse|ring|damm|ufer|street|st\.?|road|avenue|boulevard)$/i;

export function parseStartDate(value) {
  const s = String(value || '').trim();
  if (!s) return null;
  let m = s.match(/^(\d{1,2})[.\/\-](\d{2,4})$/);
  if (m) {
    let month = parseInt(m[1], 10);
    let year = parseInt(m[2], 10);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    if (month < 1 || month > 12) return null;
    return { y: year, m: month };
  }
  m = s.match(/^(\d{4})[.\/\-](\d{1,2})$/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    if (month < 1 || month > 12) return null;
    return { y: year, m: month };
  }
  m = s.match(/^(\d{4})$/);
  if (m) return { y: parseInt(m[1], 10), m: 0 };
  m = s.match(/^(\d{4})[.\/\-](\d{1,2})[.\/\-](\d{1,2})$/);
  if (m) return { y: parseInt(m[1], 10), m: parseInt(m[2], 10) };
  return null;
}

export function sortWorkExperience(entries) {
  return [...(entries || [])].sort((a, b) => {
    const da = parseStartDate(a.startDate);
    const db = parseStartDate(b.startDate);
    if (da && db) {
      if (da.y !== db.y) return db.y - da.y;
      return db.m - da.m;
    }
    if (da && !db) return -1;
    if (!da && db) return 1;
    return 0;
  });
}

export function parseAddress(location) {
  const result = { plz: '', city: '', street: '', streetNumber: '' };
  let rest = String(location || '').trim();
  if (!rest) return result;

  const plzMatch = rest.match(/^(\d{5})(?:\s+|$)(.*)$/);
  if (plzMatch) {
    result.plz = plzMatch[1];
    rest = plzMatch[2].trim();
  }

  const numberMatch = rest.match(/^(.*?)\s*(\d{1,4}[a-zA-Z]?)$/);
  if (numberMatch) {
    result.streetNumber = numberMatch[2];
    rest = numberMatch[1].trim();
  }

  const parts = rest.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return result;
  }
  if (parts.length === 1) {
    result.city = parts[0];
    return result;
  }

  const lastWord = parts[parts.length - 1];
  if (STREET_PATTERN.test(lastWord)) {
    let streetStart = parts.findIndex(p => STREET_PATTERN.test(p));
    if (streetStart === -1) streetStart = parts.length - 1;
    result.street = parts.slice(streetStart).join(' ');
    result.city = parts.slice(0, streetStart).join(' ');
  } else {
    result.street = lastWord;
    result.city = parts.slice(0, -1).join(' ');
  }
  return result;
}
