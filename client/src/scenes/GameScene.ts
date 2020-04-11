import { Scene, GameObjects } from "phaser"
import { Card, Deck, StandardDeckFactory, Rank, Suit, CardFace } from '../helpers/Card'

export default class GameScene extends Scene {
    private dealText: GameObjects.Text;
    private deck: Deck;

    constructor() {
        super('Game');
    }

    preload() {
        let imageDir = "PNG-cards-1.3";
        this.deck = StandardDeckFactory(imageDir, this);
        console.log("Created deck with " + Object.keys(this.deck).length + " cards.")
    }

    dealCards() {
        // for (let i = 0; i < 5; i++) {
        //     let playerCard = new Card();
        //     playerCard.render(475 + (i * 100), 650, 'cyanCardFront');
        // }
    }

    create() {
        this.dealText = this.add.text(75, 350, ['DEAL CARDS'])
            .setFontSize(18)
            .setFontFamily('Trebuchet MS')
            .setColor('#00ffff')
            .setInteractive();
        

        let self = this;
        this.deck["ace-hearts"].render(300, 300);
        this.deck["ace-spades"].render(340, 300);
        this.deck["ace-diamonds"].render(380, 300);
        this.deck["ace-clubs"].render(420, 300);


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