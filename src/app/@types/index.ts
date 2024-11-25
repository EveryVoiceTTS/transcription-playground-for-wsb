export type Word = {
  orthography: string;
  translation?: string[];
  id?: string;
  url?: string;
};
export type TranscribingActivityValidatorLevel =
  | 'exact'
  | 'case_insensitive'
  | 'phon_approx'
  | 'accent_insensitive';

export type TranscribingActivityConfigurationMeta = {
  title: string;
  description?: string;
  text_instructions?: string;
  oral_instructions?: string;
  limit?: number;
  randomize: boolean;
  speaker?: string;
  lang?: string;
  api?: string;
  validator_level: TranscribingActivityValidatorLevel;
  duration_control: number;
};
export type TranscribingActivityValidatorFeedback = {
  status?: TranscribingActivityValidatorLevel;
  char: string;
};
export type ActivityStatus =
  | 'loading'
  | 'loaded'
  | 'playing'
  | 'paused'
  | 'completed';
export const WriteActivityConfiguration = (data: string, filename: string) => {
  const textBlob = new Blob([data], {
    type: 'application/json',
  });
  const url = window.URL.createObjectURL(textBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filename.toLocaleLowerCase().replace(/\s/g, '-') + Date.now() + '.json';
  a.click();
  a.remove();
};
export const b64_to_utf8 = (str: string) => {
  // See https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
  return decodeURIComponent(
    Array.prototype.map
      .call(window.atob(str), function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
};
export const utf8_to_b64 = (str: string) => {
  // See https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
  return window.btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
};
/**
 * SENĆOŦEN phonetic approximation
 * @param str
 * @returns
 */
export const str_phone_approx = (str: string) => {
  let phon_approx = str;
  const STR_EQUIV_CHARACTERS = [
    ['A', 'Á', 'Ⱥ'],
    ['K', 'Ḱ', 'Ḵ', '₭', 'Ȼ'],
    ['X', 'X̱'],
    ['I', 'Í'],
    ['Ƚ', 'Ś'],
  ];
  for (const equiv_set of STR_EQUIV_CHARACTERS) {
    const re = new RegExp(`[${equiv_set.join('')}]`, 'g');
    phon_approx = phon_approx.replace(re, equiv_set[0]);
  }
  return phon_approx;
};

/**
 * SENĆOŦEN tokenizer
 * @param str
 * @returns
 */
export const str_tokenizer = (str: string): string[] => {
  const tokens = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'S',
    'T',
    'U',
    'W',
    'W̱',
    'X',
    'X̱',
    'Y',
    '¸',
    'Á',
    'Í',
    'Ć',
    'Ś',
    'Ŧ',
    'Ⱥ',
    'Ȼ',
    'Ƚ',
    'Ⱦ',
    'Ḱ',
    'Ḵ',
    'Ṉ',
    'Ṯ',
    '₭',
    'Z',
  ].map((char) => char.normalize('NFC'));
  const sortedTokens = [...tokens].sort((a, b) => b.length - a.length);
  const regex = new RegExp('(' + sortedTokens.join('|') + ')', 'g');
  return str.normalize('NFC').split(regex);
};
export const str_special_chars = [
  'Á',
  'Ⱥ',
  'Ć',
  'Ȼ',
  'Í',
  '₭',
  'Ḵ',
  'Ḱ',
  'Ƚ',
  'Ṉ',
  'Ś',
  'Ⱦ',
  'Ṯ',
  'Ŧ',
  'W̱',
  'X̱',
];

export const ReadFile = (
  $event: Event,
  updateValues: (text: string) => void
) => {
  const element = $event.target as HTMLInputElement;
  if (element.files) {
    const file = element.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        updateValues(reader.result.toString());
      }
    };
    reader.readAsDataURL(file);
  }
};
