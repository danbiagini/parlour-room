import { GameObjects, Scene } from 'phaser'
import GameScene from '../scenes/GameScene';

export enum Suit {
    CLUBS = "clubs",
    DIAMONDS = "diamonds",
    SPADES = "spades",
    HEARTS = "hearts"
}

export enum Rank {
    ACE = "ace",
    TWO = "2",
    THREE = "3",
    FOUR = "4",
    FIVE = "5",
    SIX = "6",
    SEVEN = "7",
    EIGHT = "8",
    NINE = "9",
    TEN = "10",
    JACK = "jack",
    QUEEN = "queen",
    KING = "king"
}

export interface CardFace {
    suit: Suit;
    rank: Rank;
}

export class Card {

    private imagePath: string;
    private texture_key: string = undefined;
    private image: GameObjects.Image = undefined;
    private myScene: Scene = undefined;

    render(x: number, y: number) {
        this.image = this.scene.add.image(x, y, this.texture_key).setScale(0.3).setInteractive();
        this.myScene.input.setDraggable(this.image);
    }

    constructor(readonly face: CardFace, private scene: Scene, x?: number, y?: number) {

        this.texture_key = String(this.face.rank).toLowerCase() + '-' + String(this.face.suit).toLowerCase();
        this.myScene = scene;

        if (x && y) {
            this.render(x, y);
            console.log("created card:" + this.texture_key + " and rendering:" + JSON.stringify(face));
        }

    }
}
