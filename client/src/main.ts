import { Game } from 'phaser'

import GameScene from './scenes/GameScene'

const config = {
	type: Phaser.AUTO,
	parent: "phaser-example",
	width: 1280,
	height: 780,
	scene: [GameScene]
}

export default new Game(config)
