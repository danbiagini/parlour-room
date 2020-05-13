import { GameObjects, Scene } from "phaser";

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
    NONE,
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

    render(x: number, y: number) {
        this.image = this.scene.add.image(x, y, this.key).setScale(0.3).setInteractive();
        this.scene.input.setDraggable(this.image);
        // tslint:disable-next-line: no-console
        console.log("rendering " + this.key + " at " + x + "," + y);
    }


    constructor(readonly suit: Suit, readonly rank: Rank,
                private scene: Scene, private key: string,
                private imagePath: string, x?: number, y?: number) {

        this.scene.load.image(this.key, imagePath);
        // tslint:disable-next-line: no-console
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

    const d: Deck = {};

    // The typescript string enum is tricky.  TS allows you to define finite sets of discrete
    // items using enum, but doesn't support iteration across the type.
    // tslint:disable-next-line: forin
    for (const s in Suit) {
        const sn = Number(s);
        if (!isNaN(sn)) {
            if (sn === Suit.NONE) {
                continue;
            }
            // tslint:disable-next-line: forin
            for (const r in Rank) {
                const rn = Number(r);
                if (!isNaN(rn)) {
                    let rankName: string;
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
                        case Rank.NONE:
                            continue;
                        default:
                            rankName = rn.toString();
                    }
                    const suitName = Suit[s].toLowerCase();
                    const image = imagePath + "/" + rankName + "_of_" + suitName + ".png";
                    const key = rankName + "-" + suitName;
                    // tslint:disable-next-line: no-console
                    console.log("adding " + key + " to deck.");
                    d[key] = new Card(sn, rn, scene, key, image);
                }
            }
        }
    }

    // Any jokers in this deck?
    for (let j = 0; j < jokers; j++) {
        const jokerVariant = Jokers[j].toLowerCase();
        const image = imagePath + "/" + jokerVariant + "_joker.png";
        const key = jokerVariant + "-joker";
        // tslint:disable-next-line: no-console
        console.log("adding " + key + " to deck.");
        d[key] = new Card(Suit.NONE, Rank.JOKER, scene, key, image);
    }
    return d;
}