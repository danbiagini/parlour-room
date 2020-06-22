import Phaser from "phaser";
// import ExampleScene from "./scenes/exampleScene";
import OldMaid from "../../client/src/scenes/OldMaid";

import * as React from "react";

import { GAME_HEIGHT, GAME_WIDTH } from "./config";

export interface IGameProps {}

export default class IGame extends React.Component<IGameProps, any> {
  componentDidMount() {
    const config = {
      type: Phaser.AUTO,
      parent: "phaser-example",
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      scene: [OldMaid],
    };

    // export default new Game(config)

    // const config: GameConfig = {
    //     type: Phaser.AUTO,
    //     width: GAME_WIDTH,
    //     height: GAME_HEIGHT,
    //     parent: "phaser-game",
    //     scene: [ExampleScene]
    // };

    new Phaser.Game(config);
  }

  shouldComponentUpdate() {
    return false;
  }

  public render() {
    return <div id="phaser-game" />;
  }
}
