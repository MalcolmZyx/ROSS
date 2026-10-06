const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function createDemoRedactor(contactItems) {
  const identifiers = new Map();
  let personIndex = 0;
  let organizationIndex = 0;

  const add = (value, replacement) => {
    if (typeof value !== 'string') return;
    const normalized = value.trim();
    if (normalized.length >= 3 && !identifiers.has(normalized)) identifiers.set(normalized, replacement);
  };

  for (const { body = {} } of contactItems) {
    const first = body.first_name?.trim();
    const last = body.last_name?.trim();
    if (first || last) {
      const replacement = `[PERSON ${++personIndex}]`;
      if (first && last) add(`${first} ${last}`, replacement);
      add(last, replacement);
      if (first?.length >= 4) add(first, replacement);
    }

    if (body.company) add(body.company, `[ORGANIZATION ${++organizationIndex}]`);
    add(body.date_of_birth, '[DATE OF BIRTH]');

    for (const email of body.email_addresses || []) add(email.address, '[EMAIL]');
    for (const phone of body.phone_numbers || []) add(phone.number, '[PHONE]');
    for (const address of body.addresses || []) {
      add(address.street, '[ADDRESS]');
      add(address.postal_code, '[POSTAL CODE]');
    }
  }

  const exactPatterns = [...identifiers]
    .sort(([a], [b]) => b.length - a.length)
    .map(([value, replacement]) => ({
      replacement,
      pattern: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(value)}(?![\\p{L}\\p{N}])`, 'giu'),
    }));
  const patterns = [
    { category: 'email', replacement: '[EMAIL]', pattern: /[\w.+-]+@[\w.-]+\.[A-Z]{2,}/gi },
    { category: 'phone', replacement: '[PHONE]', pattern: /(?<!\d)(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g },
    { category: 'ssn', replacement: '[IDENTIFIER]', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
    { category: 'birthDate', replacement: '[DATE OF BIRTH]', pattern: /\b(?:DOB|D\.O\.B\.|date of birth|birth date)\s*[:\-]?\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi },
    { category: 'recordIdentifier', replacement: '[IDENTIFIER]', pattern: /\b(?:MRN|medical record(?:s)? (?:no\.?|number|#)|patient (?:ID|no\.?|number)|member (?:ID|no\.?|number)|policy (?:ID|no\.?|number)|account (?:ID|no\.?|number)|claim (?:ID|no\.?|number)|driver'?s license(?: no\.?| number)?|license (?:no\.?|number)|index (?:no\.?|number)|docket (?:no\.?|number))\s*[:#-]?\s*[A-Z0-9/-]{4,}\b/gi },
  ];

  return (text, totals) => {
    let result = text;
    for (const { category, pattern, replacement } of patterns) {
      pattern.lastIndex = 0;
      result = result.replace(pattern, () => {
        totals[category] += 1;
        return replacement;
      });
    }
    for (const { pattern, replacement } of exactPatterns) {
      pattern.lastIndex = 0;
      result = result.replace(pattern, () => {
        totals.contactIdentifiers += 1;
        return replacement;
      });
    }
    return result;
  };
}
