export const extractVoiceGuess = (text: string): string | null => {
  const normalized = text.toLowerCase().trim();
  const trigger = 'i guess';

  const index = normalized.lastIndexOf(trigger);
  if (index === -1) return null;

  // Get everything after "i guess"
  const afterTrigger = normalized.substring(index + trigger.length).trim();

  // Return the entire phrase, lowercased, and stripped of punctuation
  return afterTrigger.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').toLowerCase();
};

export const cleanText = (text: string): string => {
  const commonWords = [
    'a',
    'the',
    'an',
    'is',
    'are',
    'was',
    'were',
    'to',
    'of',
    'in',
    'and',
    'it',
    'its',
    "it's",
    'that',
    'this',
    'those',
    'these',
    'am',
  ];
  const prefixes = [
    'it is',
    'it was',
    'that is',
    'this is',
    "it's",
    'i think it is',
    "i think it's",
    'maybe it is',
  ];

  let cleaned = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .trim();

  // Remove common verbal filler prefixes
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length).trim();
    }
  }

  return cleaned
    .split(/\s+/)
    .filter((word) => !commonWords.includes(word))
    .join(' ');
};
