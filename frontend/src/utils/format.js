export function truncateSkills(skills, max = 3) {
  const tags = String(skills || '').split(',').map(s => s.trim()).filter(Boolean);
  if (tags.length === 0) return { shown: '', hidden: 0 };
  return {
    shown: tags.slice(0, max).join(', '),
    hidden: Math.max(0, tags.length - max),
  };
}
