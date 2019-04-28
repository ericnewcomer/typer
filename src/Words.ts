import { ScoreSort } from 'components/sandbox/helpers';
import { HIGH_FREQ_BIAS, HIGH_FREQ_CUTTOFF, HISTORY_BIAS, HISTORY_SPREAD } from 'config';
import { getRandomItem, getWordsForNGram, wordsLength } from 'helpers';
import { Nullable, Word } from 'interfaces';

interface Frequencies {
  map: { [gram: string]: number };
  ngrams: string[];
}

const readInWords = (): Promise<Word[]> => {
  return fetch("./words/words.csv")
    .then(r => r.text())
    .then(lines => {
      const words = [];
      for (const line of lines.split("\n")) {
        const [rank, text, pos, dispersion] = line.split(",");
        words.push({
          rank: parseInt(rank, 10),
          text,
          pos,
          dispersion: parseFloat(dispersion)
        });
      }
      return words;
    });
};

const readInFrequencies = (
  filename: string,
  min: number = 1
): Promise<Frequencies> => {
  return fetch(filename)
    .then(r => r.text())
    .then(lines => {
      const frequencies: Frequencies = { map: {}, ngrams: [] };
      let topFrequency = 0;
      for (const line of lines.split("\n")) {
        const [ngram, freq] = line.split(" ");

        if (ngram.length >= min) {
          const gramFreq = parseInt(freq, 10);
          if (topFrequency === 0) {
            topFrequency = gramFreq;
          }

          const lowered = ngram.toLowerCase();

          frequencies.map[lowered] = gramFreq / topFrequency;
          frequencies.ngrams.push(lowered);
        }
      }
      return frequencies;
    });
};

const getNextWord = (words: Word[], ngram?: string): Nullable<Word> => {
  let wordList = words;
  if (ngram) {
    wordList = words.filter((word: Word) => word.text.indexOf(ngram) > -1);
  }

  let length = wordList.length;
  if (Math.random() < HIGH_FREQ_BIAS) {
    length *= HIGH_FREQ_CUTTOFF;
  }

  const idx = Math.floor(Math.random() * length);
  if (idx >= wordList.length) {
    return null;
  }
  return { ...wordList[idx], ngram };
};

export default class Words {
  private unigrams!: Frequencies;
  private bigrams!: Frequencies;
  private trigrams!: Frequencies;
  private quadrigrams!: Frequencies;
  private words!: Word[];

  constructor(callback: () => void) {
    const promises = [];

    promises.push(
      readInFrequencies("./words/unigrams.txt").then(freqs => {
        this.unigrams = freqs;
      })
    );

    promises.push(
      readInFrequencies("./words/bigrams.txt").then(freqs => {
        this.bigrams = freqs;
      })
    );

    promises.push(
      readInFrequencies("./words/trigrams.txt").then(freqs => {
        this.trigrams = freqs;
      })
    );

    promises.push(
      readInFrequencies("./words/quadrigrams.txt").then(freqs => {
        this.quadrigrams = freqs;
      })
    );

    promises.push(
      readInWords().then(words => {
        this.words = words;
      })
    );

    Promise.all(promises).then(callback);
  }

  public getBigrams() {
    return this.bigrams;
  }

  public getTrigrams() {
    return this.trigrams;
  }

  public getQuadrigrams() {
    return this.quadrigrams;
  }

  public getNGramFrequency(ngram: string): number {
    if (ngram.length === 1) {
      return this.unigrams.map[ngram] || 0;
    } else if (ngram.length === 2) {
      return this.bigrams.map[ngram] || 0;
    } else if (ngram.length === 3) {
      return this.trigrams.map[ngram] || 0;
    } else if (ngram.length === 4) {
      return this.quadrigrams.map[ngram] || 0;
    }
    return 0;
  }

  public getWordsForNGrams(
    ngrams: string[],
    maxLength: number,
    startPct: number
  ): Word[] {
    const selectedWords: Word[] = [];

    let attempts = 0;

    while (true && ngrams.length > 0 && attempts < 100) {
      const remaining = maxLength - wordsLength(selectedWords);
      const ngram = getRandomItem(ngrams) as string;

      let wordList: Word[] = [];

      // get a filtered list by that gram
      let compAttempts = 0;
      let ngramComp = startPct;

      while (compAttempts < 40) {
        wordList = getWordsForNGram(
          this.words,
          selectedWords,
          ngram,
          ngramComp,
          remaining
        );
        // no words left that fit for our ngram, give up
        if (wordList.length === 0) {
          ngramComp -= 0.05;
          compAttempts++;
        } else {
          break;
        }
      }

      // remove us from te list
      if (wordList.length === 0) {
        ngrams = ngrams.filter((g: string) => g !== ngram);
        continue;
      }

      const newWord = { ...getRandomItem(wordList) };
      newWord.text = newWord.text.toLowerCase();

      selectedWords.push({ ...newWord, ngram });
      attempts++;
    }

    return selectedWords;
  }

  public getNextSprint(scores?: ScoreSort[]): Word[] {
    const words: Word[] = [];
    for (let i = 0; i < 10; i++) {
      let gram: string = "";
      if (scores && scores.length > 0 && Math.random() < HISTORY_BIAS) {
        gram =
          scores[
            Math.floor(Math.random() * Math.min(scores.length, HISTORY_SPREAD))
          ].gram;
      }

      if (wordsLength(words) < 30) {
        const nextWord = getNextWord(this.words, gram);
        if (nextWord !== null) {
          words.push(nextWord);
        }
      }
    }

    return words;
  }
}
