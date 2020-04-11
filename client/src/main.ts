import { Game } from 'phaser'

import GameScene from './scenes/GameScene'
import OldMaid from './scenes/OldMaid'

const config = {
	type: Phaser.AUTO,
	parent: "phaser-example",
	width: 1280,
	height: 780,
	scene: [OldMaid]
}

export default new Game(config)
