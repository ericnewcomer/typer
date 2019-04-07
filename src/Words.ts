import { HIGH_FREQ_BIAS, HIGH_FREQ_CUTTOFF, HISTORY_BIAS, HISTORY_SPREAD } from 'src/config';
import { wordsLength } from 'src/helpers';

interface Frequencies {
  map: { [gram: string]: number };
  ngrams: string[];
}

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

          // tslint:disable-next-line: no-console
          // console.log("x ", line);
        }
      }
      return frequencies;
    });
};

export interface Word {
  text: string;
  ranking?: number;
  ngram?: string;
}

const getWords = (text: string): Word[] => {
  return text.split(" ").map((word: string) => {
    return { text: word };
  });
};

const getNextWord = (words: Frequencies, ngram?: string): Word => {
  let wordList = words.ngrams;
  if (ngram) {
    wordList = words.ngrams.filter((word: string) => word.indexOf(ngram) > -1);
  }

  let length = wordList.length;
  if (Math.random() < HIGH_FREQ_BIAS) {
    length *= HIGH_FREQ_CUTTOFF;
  }

  const idx = Math.floor(Math.random() * length);
  const text = wordList[idx];
  return {
    text,
    ranking: idx,
    ngram
  };
};

export interface ScoreSort {
  gram: string;
  score: number;
}

export default class Words {
  private unigrams: Frequencies;
  private bigrams: Frequencies;
  private trigrams: Frequencies;
  private quadrigrams: Frequencies;
  private words: Frequencies;

  constructor() {
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
      readInFrequencies("./words/words_10k.txt", 3).then(freqs => {
        this.words = freqs;
      })
    );
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

  public getNextSprint(scores?: ScoreSort[]): Word[] {
    if (!this.words) {
      return getWords("welcome, type this to get started");
    }

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
        words.push(getNextWord(this.words, gram));
      }
    }

    // tslint:disable-next-line: no-console
    // console.log(scores);

    // tslint:disable-next-line: no-console
    // console.log(words);
    return words;
  }
}
