// Python version here:
//   https://colab.research.google.com/drive/1Tv5MlRq3l7CqIM9hpt9OpD1KnjslAyy6
type Value = string;
type Guess = Value[];
export class Result {
  readonly exact: number;
  readonly partial: number;
  constructor(exact: number, partial: number) {
    this.exact = exact;
    this.partial = partial;
  }
  equals(other: Result) {
    return this.exact == other.exact && this.partial == other.partial;
  }
  str() {
    return "" + this.exact + ", " + this.partial;
  }
}
type History = Array<[Guess, Result]>;

export function output(msg) {
  alert(msg);
  // console.log(msg);
}

export function input(msg) {
  prompt(msg);
  // return "auto";
}

// -------------------------------------------------------------- //

export class Player {
  readonly game: Game;
  constructor(game: Game) {
    this.game = game;
  }

  get_input(message: string, history: History) {
    return input(message).split("");
  }

  print_guess_instructions() {}

  get_guess(num_tries = 4, history: History) {
    for (var ii = 0; ii < num_tries; ii++) {
      let guess = this.get_input("Enter a guess: ", history);
      if (this.game.is_valid_guess(guess)) {
        return guess;
      }
      output("Invalid guess");
      this.print_guess_instructions();
    }
    output("Too many invalid guesses");
  }
}

// -------------------------------------------------------------- //

export class Game {
  readonly width: number;
  readonly valid_values: Value[];
  constructor(width=4, valid_values=["1", "2", "3", "4", "5", "6"]) {
    this.width = width;
    this.valid_values = valid_values;
  }
  random_int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  random_choice(lst) {
    return lst[this.random_int(0, lst.length - 1)];
  }
  get_random_guess() {
    let guess = [];
    for (let ii = 0; ii < this.width; ii++) {
      guess.push(this.random_choice(this.valid_values));
    }
    return guess;
  }
  is_valid_guess(guess: Guess) {
    if (guess.length != this.width) {
      return false;
    }
    for (let value of guess) {
      if (this.valid_values.indexOf(value) < 0) {
        return false;
      }
    }
    return true;
  }
  get_all_valid_guesses(width?: number) {
    if (!width) {
      width = this.width;
    }
    let sub_guesses: Guess[];
    if (width < 2) {
      sub_guesses = [[]];
    } else {
      sub_guesses = this.get_all_valid_guesses(width - 1);
    }
    let all_guesses = [];
    for (let guess of sub_guesses) {
      for (let value of this.valid_values) {
        all_guesses.push([value].concat(guess));
      }
    }
    return all_guesses;
  }
  sum(lst) {
    return lst.reduce((a, b) => a + b, 0);
  }
  count(lst, value) {
    return lst.reduce((a, b) => a + (b == value ? 1 : 0), 0);
  }
  // https://gist.github.com/renaudtertrais/25fc5a2e64fe5d0e86894094c6989e10
  zip(arr, ...arrs) {
    return arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]));
  }
  // 
  // https://stackoverflow.com/questions/22015684/how-do-i-zip-two-arrays-in-javascript
  //zip(arr1, arr2) {
  //  return arr1.map((elt, i) => [elt, arr2[i]]);
  //}
  // https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
  uniq(value, index, arr) { 
    return arr.indexOf(value) === index;
  }
  check_guess(secret: Guess, guess: Guess) {
    let exact = this.zip(secret, guess).reduce((sum, elt) => sum + (elt[0] == elt[1] ? 1 : 0), 0);
    let partial = guess.filter(this.uniq).reduce(
      (sum, val) => sum + Math.min(this.count(secret, val), this.count(guess, val)), 0);
    return new Result(exact, partial - exact);
  }
  is_correct(result: Result) {
    return result.exact == this.width;
  }
  guess_string(guess: Guess) {
    return guess.join("");
  }
  play(player_class, max_guesses = 10, max_tries_per_guess = 4) {
    let player = new player_class(this);
    let secret = this.get_random_guess();
    let history = [];
    for (let num_guess = 0; num_guess < max_guesses; num_guess++) {
      let guess = player.get_guess(max_tries_per_guess, history);
      let result = this.check_guess(secret, guess);
      history.push([guess, result]);
      if (this.is_correct(result)) {
        output("You got it!");
        return [true, history, secret];
      } else {
        output(result.exact + " exact, " + result.partial + " partial.");
      }
    }
    output("You didn't get it: " + this.guess_string(secret));
    return [false, history, secret];
  }
}

// -------------------------------------------------------------- //

function* AllValuesIterator(valid_values: Value[], width: number) {
  if (width <= 0 || valid_values.length <= 0) {
    return;
  }
  let indexes = [];
  let values = [];
  for (let ii = 0; ii < width; ii++) {
    indexes.push(0);
    values.push(valid_values[0]);
  }
  while(true) {
    yield values.slice();
    indexes[0] += 1;
    for (let place = 0; place < indexes.length; place++) {
      if (indexes[place] >= valid_values.length) {
        indexes[place] = 0;
        if (place + 1 < indexes.length) {
          indexes[place + 1] += 1;
        } else {
          return;
        }
      }
      values[place] = valid_values[indexes[place]];
    }
  }
}

function* PossibleValuesIterator(game: Game, history: History) {
  let itr = AllValuesIterator(game.valid_values, game.width);
  let next = itr.next();
  while(!next.done) {
    let guess = next.value;
    let match = true;
    for (let hist of history) {
      let result = game.check_guess(hist[0], guess);
      if (!result.equals(hist[1])) {
          match = false;
          break;
      }
    }
    if (match) {
      yield guess;
    }
    next = itr.next();
  }
  return;
}

export class AutoPlayer extends Player {
  _cached_possible_guesses: Guess[];
  _history_for_cached_possible_guesses: History;
  constructor(game: Game) {
    super(game);
    this._history_for_cached_possible_guesses = null;
  }
  history_matches(hist1: History, hist2: History) {
    if (hist1 == null && hist2 == null) {
      return true;
    }
    if (hist1 == null || hist2 == null) {
      return false;
    }
    if (hist1.length != hist2.length) {
      return false;
    }
    for (let ii = 0; ii < hist1.length; ii++) {
      if (hist1[ii] != hist2[ii]) {
        return false;
      }
    }
    return true;
  }
  is_possible_guesses_computed(history: History) {
    return this.history_matches(
      history, this._history_for_cached_possible_guesses);
  }
  get_possible_guesses(history: History) {
    if (!this.is_possible_guesses_computed(history)) {
        this._cached_possible_guesses = [];
        // TODO: This always recomputes possible values from
        // scratch, but if the _cached_possible_guesses already
        // satisfy all the history except the last element,
        // then we only need to throw out the ones that don't
        // match the last element of history.
        let itr = PossibleValuesIterator(this.game, history);
        let next = itr.next();
        while(!next.done) {
          this._cached_possible_guesses.push(next.value);
          next = itr.next();
        }
        this._history_for_cached_possible_guesses = history.slice();
    }
    return this._cached_possible_guesses;
  }
  get_num_possible_guesses(history: History) {
    return this.get_possible_guesses(history).length;
  }
  make_guess(history: History) {
    if (this.is_possible_guesses_computed(history)) {
      return this.get_possible_guesses(history)[0];
    } else {
      return PossibleValuesIterator(this.game, history).next().value;
    }
  }
  make_random_guess(history: History) {
    return this.game.random_choice(this.get_possible_guesses(history));
  }
  get_guess(num_tries=4, history: History) {
    let guess = this.make_guess(history);
    output("Guessed: " + this.game.guess_string(guess));
    return guess;
  }
}

// -------------------------------------------------------------- //

export class RandomPlayer extends AutoPlayer {
  make_guess(history: History) {
    return this.make_random_guess(history);
  }
}

// -------------------------------------------------------------- //

export class MaybeAutoPlayer extends AutoPlayer {
  get_guess(num_tries=4, history: History) {
    return Player.prototype.get_guess.call(this, num_tries, history);
  }
  get_input(msg: string, history: History) {
    let guess = Player.prototype.get_input.call(this, msg, history)
    if (this.game.is_correct(this.game.check_guess(guess, "auto".split("")))) {
      return AutoPlayer.prototype.get_guess.call(this, 0, history);
    } else {
      return guess;
    }
  }
}

// -------------------------------------------------------------- //
