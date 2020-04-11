import { GameObjects, Scene } from 'phaser'
import GameScene from '../scenes/GameScene';

export enum Suit {
    NONE,
    CLUBS,
    DIAMONDS,
    SPADES,
    HEARTS
}

export enum Jokers {
    RED,
    BLACK
}

export enum Rank {
    ACE,
    TWO,
    THREE,
    FOUR,
    FIVE,
    SIX,
    SEVEN,
    EIGHT,
    NINE,
    TEN,
    JACK,
    QUEEN,
    KING,
    JOKER
}

export interface CardFace {
    suit: Suit;
    rank: Rank;
}

export class Card {

    private image: GameObjects.Image = undefined;
    private myScene: Scene = undefined;

    render(x: number, y: number) {
        this.image = this.scene.add.image(x, y, this.key).setScale(0.3).setInteractive();
        this.myScene.input.setDraggable(this.image);
        console.log("rendering " + this.key + " at " + x + "," + y);
    }

    constructor(readonly suit: Suit, readonly rank: Rank,
                private scene: Scene, private key: string,
                private imagePath: string, x?: number, y?: number) {

        this.myScene = scene;
        this.myScene.load.image(this.key, imagePath);
        console.log("created card:" + this.key + " imagePath:" + imagePath +
                    ", S:" + suit + ", R:" + rank);
        if (x && y) {
            this.render(x, y);
        }

    }
}

export interface Deck {
    [key: string]: Card;
}

export function StandardDeckFactory(imagePath: string, scene: Scene, jokers = 0) {

    let d: Deck = {};

    // The typescript string enum is tricky.  TS allows you to define finite sets of discrete
    // items using enum, but doesn't support iteration across the type.
    for (let s in Suit) {
        const sn = Number(s);
        if (!isNaN(sn)) {
            if (sn == Suit.NONE) {
                continue;
            }
            for (let r in Rank) {
                const rn = Number(r);
                if (!isNaN(rn)) {
                    let rankName: string = undefined;
                    switch (rn) {
                        case Rank.ACE:
                            rankName = "ace";
                            break;
                        case Rank.JACK:
                            rankName = "jack";
                            break;
                        case Rank.QUEEN:
                            rankName = "queen";
                            break;
                        case Rank.KING:
                            rankName = "king";
                            break;
                        case Rank.JOKER:
                            continue;
                        default:
                            rankName = rn.toString();
                    }
                    let suitName = Suit[s].toLowerCase();
                    let image = imagePath + "/" + rankName + "_of_" + suitName + ".png";
                    let key = rankName + "-" + suitName;
                    console.log("adding " + key + " to deck.");
                    d[key] = new Card(sn, rn, scene, key, image);
                    //console.log("New card at " + key + ": " + JSON.stringify(d[key]));
                }
            }
        }
    }

    // Any jokers in this deck?
    for (let j = 0; j < jokers; j++) {
        let rankName = "joker";
        let jokerVariant = Jokers[j].toLowerCase();
        let image = imagePath + "/" + jokerVariant + "_joker.png";
        let key = jokerVariant + "-joker";
        console.log("adding " + key + " to deck.");
        d[key] = new Card(Suit.NONE, Rank.JOKER, scene, key, image);
    }
    return d;
}