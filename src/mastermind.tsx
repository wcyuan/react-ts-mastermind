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

export class AutoPlayer extends Player {
  readonly all_guesses: Guess[];
  constructor(game: Game) {
    super(game);
    this.all_guesses = this.game.get_all_valid_guesses();
  }
  get_possible_guesses(history: History) {
    let possible_guesses = [];
    for (let guess of this.all_guesses) {
      let match = true;
      for (let hist of history) {
        let result = this.game.check_guess(hist[0], guess);
        /*
        console.log("guess: " + guess + ", hist: " + hist[0] + ", res: " + result.str() + ", hist[1]:" + hist[1].str());
        */
        if (!result.equals(hist[1])) {
            match = false;
            break;
        }
      }
      if (match) {
        possible_guesses.push(guess);
      }
    }
    return possible_guesses;
    /*
    // https://stackoverflow.com/questions/44808882/create-a-clone-of-an-array-in-typescript
    let possible_guesses = [...this.all_guesses];
    return possible_guesses.filter(
      (value) =>
        console.log("" + value + this.game.check_guess(history[0][0], value))
        history.reduce(
          (acc, guess) =>
          acc && this.game.check_guess(guess[0], value) == guess[1],
          true)
    );
    */
  }
  get_num_possible_guesses(history: History) {
    return this.get_possible_guesses(history).length
  }
  make_guess(history: History) {
    return this.get_possible_guesses(history)[0];
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
