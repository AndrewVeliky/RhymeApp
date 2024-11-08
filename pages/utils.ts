import localforage from 'localforage';

const cache = {
  data: {},
  phonetic: {},
  vowelPattern: {},
  consonantPattern: {},
  scores: new Map(),
};

const normalizeWord = word => (word ? word.toLowerCase() : '');

const precomputeData = async () => {
  await localforage.iterate((entry, key) => {
    const lowerWord = normalizeWord(entry.word);
    cache.data[lowerWord] = entry;
    cache.phonetic[lowerWord] = computePhoneticCode(lowerWord);
    cache.vowelPattern[lowerWord] = computeVowelPattern(lowerWord);
    cache.consonantPattern[lowerWord] = computeConsonantPattern(lowerWord);
  });
};

// Швидкий обчислювач фонетичного коду без регулярних виразів
const computePhoneticCode = word => {
  if (!word) return '';
  const lowerWord = normalizeWord(word);
  if (cache.phonetic[lowerWord]) return cache.phonetic[lowerWord];

  const phoneticCode = Array.from(lowerWord)
    .map(char => {
      switch (char) {
        case 'б':
        case 'п':
          return 'Б';
        case 'в':
        case 'ф':
          return 'В';
        case 'г':
        case 'ґ':
        case 'к':
        case 'х':
          return 'Г';
        case 'д':
        case 'т':
          return 'Д';
        case 'з':
        case 'с':
        case 'ц':
          return 'З';
        case 'ж':
        case 'ш':
        case 'ч':
        case 'щ':
          return 'Ж';
        case 'л':
        case 'р':
          return 'Л';
        case 'й':
          return 'Й';
        case 'м':
        case 'н':
          return 'М';
        case 'а':
        case 'о':
          return 'А';
        case 'е':
        case 'є':
        case 'и':
        case 'і':
          return 'Е';
        case 'ю':
        case 'я':
          return 'У';
        default:
          return char;
      }
    })
    .join('');

  cache.phonetic[lowerWord] = phoneticCode;
  return phoneticCode;
};

const getSoundWeight = char => {
  const weights = {
    А: 1,
    Б: 2,
    В: 2,
    Г: 2,
    Д: 2,
    З: 3,
    Ж: 3,
    Л: 1,
    Й: 1,
    М: 1,
  };
  return weights[char] || 1;
};

// Швидкий розрахунок ваги рим
const calculateRhymeScore = (word1, word2) => {
  if (!word1 || !word2) return 0;
  const key = `${word1}_${word2}`;
  if (cache.scores.has(key)) return cache.scores.get(key);

  const phoneticCode1 = computePhoneticCode(word1);
  const phoneticCode2 = computePhoneticCode(word2);
  const score = phoneticCode1
    .split('')
    .reduce(
      (acc, char, i) =>
        acc +
        (phoneticCode1[i] === phoneticCode2[i] ? getSoundWeight(char) : 0),
      0,
    );

  cache.scores.set(key, score);
  return score;
};

const getWordData = async word => {
  if (!word) return null;
  const lowerWord = normalizeWord(word);
  if (cache.data[lowerWord]) return cache.data[lowerWord];

  const data = await localforage.getItem(lowerWord);
  if (data) {
    cache.data[lowerWord] = data;
    cache.phonetic[lowerWord] = computePhoneticCode(data.word);
    cache.vowelPattern[lowerWord] = computeVowelPattern(data.word);
    cache.consonantPattern[lowerWord] = computeConsonantPattern(data.word);
  }
  return data;
};

// Швидкі функції для обчислення патернів голосних та приголосних
const computeVowelPattern = word => {
  if (!word) return '';
  const lowerWord = normalizeWord(word);
  if (cache.vowelPattern[lowerWord]) return cache.vowelPattern[lowerWord];
  const pattern = lowerWord.replace(/[^аеиіоуяєюї]/g, '');
  cache.vowelPattern[lowerWord] = pattern;
  return pattern;
};

const computeConsonantPattern = word => {
  if (!word) return '';
  const lowerWord = normalizeWord(word);
  if (cache.consonantPattern[lowerWord])
    return cache.consonantPattern[lowerWord];
  const pattern = lowerWord.replace(/[аеиіоуяєюї]/g, '');
  cache.consonantPattern[lowerWord] = pattern;
  return pattern;
};

// Генералізована функція пошуку з максимізацією точності та швидкості
const findRhymes = async (word, type) => {
  if (!word) return [];
  const stem = getStem(word);
  const phoneticCode = computePhoneticCode(stem).slice(-3);
  const rhymes = [];

  await localforage.iterate(entry => {
    const entryPhoneticCode =
      cache.phonetic[normalizeWord(entry.word)].slice(-3);
    const rhymeScore = calculateRhymeScore(word, entry.word);

    if (
      (type === 'dictionary' &&
        rhymeScore > 1 &&
        entry.word.startsWith(stem.slice(-2))) ||
      (type === 'phonetic' &&
        rhymeScore > 1 &&
        entryPhoneticCode === phoneticCode)
    ) {
      rhymes.push(entry);
    }
  });

  return rhymes.sort(
    (a, b) =>
      calculateRhymeScore(word, b.word) - calculateRhymeScore(word, a.word),
  );
};

const findDictionaryRhymes = async word => findRhymes(word, 'dictionary');
const findPhoneticRhymes = async word => findRhymes(word, 'phonetic');

// Оптимізовані непрямі рими з адаптивним сортуванням
const findIndirectRhymes = async word => {
  if (!word) return [];
  const vowelPattern = computeVowelPattern(getStem(word)).slice(-2);
  const consonantPattern = computeConsonantPattern(getStem(word)).slice(-2);
  const rhymes = [];

  await localforage.iterate(entry => {
    const entryStem = getStem(entry.word);
    const rhymeScore = calculateRhymeScore(word, entry.word);

    if (
      rhymeScore > 0 &&
      (computeVowelPattern(entryStem).slice(-2) === vowelPattern ||
        computeConsonantPattern(entryStem).slice(-2) === consonantPattern)
    ) {
      rhymes.push(entry);
    }
  });

  return rhymes.sort(
    (a, b) =>
      calculateRhymeScore(word, b.word) - calculateRhymeScore(word, a.word),
  );
};

const findCustomRhymes = async word => {
  if (!word) return [];
  const customRhymes = [];
  const lowerWord = normalizeWord(word);

  try {
    const data = await localforage.getItem(lowerWord);
    if (data && data.customRhymes) {
      data.customRhymes.forEach(rhyme => {
        const score = calculateRhymeScore(word, rhyme);
        if (score > 0) {
          customRhymes.push({
            type: 'custom',
            word: rhyme,
            partOfSpeech: data.partOfSpeech,
          });
        }
      });
    }
  } catch (error) {
    console.error('Error fetching custom rhymes:', error);
  }

  return customRhymes.sort(
    (a, b) =>
      calculateRhymeScore(word, b.word) - calculateRhymeScore(word, a.word),
  );
};

export {
  precomputeData,
  findDictionaryRhymes,
  findPhoneticRhymes,
  getWordData,
  findIndirectRhymes,
  findCustomRhymes,
  calculateRhymeScore,
};
