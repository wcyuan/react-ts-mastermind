import React, { Component } from 'react';
import { render } from 'react-dom';
import Hello from './Hello';
import './style.css';
import * as mastermind from "./mastermind";

interface AppProps { }
interface AppState {
  name: string;
}

function Peg(props) {
  const style = {backgroundColor: props.color};
  const className = [props.size, "peg"].join(' ');
  const  onclick = "";
  return (<button
           className={className}
           onClick={props.onClick}
           style={style} />);
}

function EvalPeg(props) {
  return Peg({color: props.color, size: "small"});
}

function GuessPeg(props) {
  return Peg({color: props.color, onClick: props.onClick, size: "big"});
}

function Row(props) {
  const items = [];
  for (let ii = 0; ii < props.guess.length; ii++) {
    items.push(
      <GuessPeg key={ii} color={Util.getColor(props.game, props.guess[ii])} />)
  }
  for (let ii = 0; ii < props.result.exact; ii++) {
    items.push(<EvalPeg color="red" key={"exact"+ii} />)
  }
  for (let ii = 0; ii < props.result.partial; ii++) {
    items.push(<EvalPeg color="white" key={"partial"+ii} />)
  }
  return (<div>{items}</div>);
}

class NextGuessRow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      guess: []
    }
    for (let ii = 0; ii < this.props.game.width; ii++) {
      this.state.guess.push(this.props.game.valid_values[ii]);
    }
  }
  handleClick(ii:number) {
    let guess = this.state.guess.slice();
    const value = guess[ii];
    let index = this.props.game.valid_values.indexOf(value);
    index = (index + 1) % this.props.game.valid_values.length;
    guess[ii] = this.props.game.valid_values[index];
    this.setState({guess: guess});
  }
  makeAutoGuess() {
    const guess = this.props.auto();
    this.setState({guess: guess});
    this.props.onSubmit(guess);
  }
  render() {
    const items = [];
    for (let ii = 0; ii < this.props.game.width; ii++) {
      items.push(
        <GuessPeg
         key={ii}
         color={
           Util.getColor(this.props.game, this.state.guess[ii])}
         onClick={() => this.handleClick(ii)} 
        />);
    }
    return (
      <div>
      {items}
      <button onClick={() => this.props.onSubmit(this.state.guess)}>
       Guess!
      </button>
      <button onClick={() => this.makeAutoGuess()}>
       Auto!
      </button>
      </div>
      );
  }
}

class Util {
  static getColor(game, value) {
    return Util.rainbow(
      game.valid_values.length, 
      game.valid_values.indexOf(value));
  }
  //  https://stackoverflow.com/a/7419630
  static rainbow(numOfSteps, step) {
      // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
      // Adam Cole, 2011-Sept-14
      // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
      var r, g, b;
      var h = step / numOfSteps;
      var i = ~~(h * 6);
      var f = h * 6 - i;
      var q = 1 - f;
      switch(i % 6){
          case 0: r = 1; g = f; b = 0; break;
          case 1: r = q; g = 1; b = 0; break;
          case 2: r = 0; g = 1; b = f; break;
          case 3: r = 0; g = q; b = 1; break;
          case 4: r = f; g = 0; b = 1; break;
          case 5: r = 1; g = 0; b = q; break;
      }
      var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
      return (c);
  }
}

class GameUI extends Component {
  constructor(props) {
    super(props);
    let valid_values = [];
    for (let ii = 0; ii < props.num_pegs; ii++) {
      valid_values.push("" + ii);
    }
    const game = new mastermind.Game(props.width, valid_values);
    this.state = {
      game: game,
      secret: game.get_random_guess(),
      history: [],
      auto: new mastermind.AutoPlayer(game),
    };
  }
  handleNewGuess(guess) {
    let history = this.state.history.slice();
    let result = this.state.game.check_guess(
      guess, this.state.secret);
    history.push([guess, result]);
    this.setState({history: history});
  }
  getAutoGuess() {
    return this.state.auto.make_guess(this.state.history);
  }
  render() {
    const past_guesses = [];
    for (let ii = 0; ii < this.state.history.length; ii++) {
      past_guesses.push(
        <Row
         key={ii}
         game={this.state.game}
         guess={this.state.history[ii][0]}
         result={this.state.history[ii][1]} />
      );
    }
    console.log(this.state.history);
    return (
      <div>
      {past_guesses}
      <NextGuessRow
       key="next"
       game={this.state.game}
       auto={this.getAutoGuess.bind(this)}
       onSubmit={this.handleNewGuess.bind(this)}
       />
      </div>
    );
  }
}

class App extends Component<AppProps, AppState> {
  constructor(props) {
    super(props);
    this.state = {
      name: 'React'
    };
  }

  render() {
    return (
      <div>
        <GameUI width={4} num_pegs={6} />
      </div>
    );
    /*

let g = new mastermind.Game();
let r = g.check_guess(['1', '1', '3', '4'], ['1', '1', '2', '2']);
console.log(g.zip(['1', '2', '3', '4'], ['1', '1', '2', '2']));
console.log("" + r.exact + ", " + r.partial);
g.play(mastermind.MaybeAutoPlayer);
//console.log(g.get_all_valid_guesses());
let p = new mastermind.AutoPlayer(g);
console.log(p.get_possible_guesses(
  [[['1', '1', '3', '3'], new mastermind.Result(3, 0)]]));

//console.log(p.get_possible_guesses([]));
    */
  }
}

render(<App />, document.getElementById('root'));
