export function extractCity(location) {
  if (!location) return null;
  const plzMatch = location.match(/\b\d{5}\b/);
  if (!plzMatch) return location.split(/\s+/)[0] || null;

  const afterPlz = location.substring(plzMatch.index + plzMatch[0].length).trim();
  const streetMatch = afterPlz.match(
    /\s+(?:straße|str\.|Straße|Str\.|platz|Platz|weg|Weg|allee|Allee|gasse|Gasse|ring|Ring|damm|Damm)\s+\d+/i
  );
  if (streetMatch) {
    return afterPlz.substring(0, streetMatch.index).trim();
  }
  return afterPlz || null;
}
