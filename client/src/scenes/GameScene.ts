import { Scene, GameObjects } from "phaser"
import { Card, Rank, Suit, CardFace } from '../helpers/Card'

export default class GameScene extends Scene {
    private dealText: GameObjects.Text;
    private deck: Card[];

    constructor() {
        super('Game');
    }

    preload() {
        let imageDir = "PNG-cards-1.3";

        for (let suite in Suit) {
            for (let rank in Rank) {
                this.deck.push(new )
            }
        }
        this.load.image('ace-hearts', 'PNG-cards-1.3/ace_of_hearts.png')
        this.load.image('ace-spades', 'PNG-cards-1.3/ace_of_spades.png')
        this.load.image('ace-diamonds', 'PNG-cards-1.3/ace_of_diamonds.png')
        this.load.image('ace-clubs', 'PNG-cards-1.3/ace_of_clubs.png')
    }

    dealCards() {

    }

    create() {
        this.dealText = this.add.text(75, 350, ['DEAL CARDS'])
            .setFontSize(18)
            .setFontFamily('Trebuchet MS')
            .setColor('#00ffff')
            .setInteractive();
        

        let self = this;
        let cards: Array<Card> = []
        cards.push(
            new Card({
                suit: Suit.HEARTS,
                rank: Rank.ACE
            }, self, 300, 300),
            new Card({
                suit: Suit.CLUBS,
                rank: Rank.ACE
            }, self, 340, 300),
            new Card({
                suit: Suit.SPADES,
                rank: Rank.ACE
            }, self, 380, 300),
            new Card({
                suit: Suit.DIAMONDS,
                rank: Rank.ACE
            }, self, 420, 300));
        

        this.dealText.on('pointerdown', function () {
            self.dealCards();
        })

        this.dealText.on('pointerover', function () {
            self.dealText.setColor('#ff69b4');
        })

        this.dealText.on('pointerout', function () {
            self.dealText.setColor('#00ffff');
        })

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX;
            gameObject.y = dragY;
        })

    }

    update() {

    }

}