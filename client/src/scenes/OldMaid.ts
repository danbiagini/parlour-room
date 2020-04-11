import { Scene, GameObjects } from "phaser"
import { Card, Deck, StandardDeckFactory, Rank, Suit, CardFace } from '../helpers/Card'
import HandZone from '../helpers/Zones'


export default class OldMaid extends Scene {
    private dealText: GameObjects.Text;
    private deck: Deck;
    private cardKeys: Array<string>;
    private handZone: HandZone;

    constructor() {
        super('OldMaid');
    }

    preload() {
        let imageDir = "PNG-cards-1.3";
        this.deck = StandardDeckFactory(imageDir, this, 1);
        this.cardKeys = Object.keys(this.deck);
        console.log("Created deck with " + this.cardKeys.length + " cards.")
    }

    dealCards() {

        for (let i = 0; i < 5; i++) {
            let playerCard = this.deck[this.cardKeys[(Math.floor(Math.random() * this.cardKeys.length))]]
            playerCard.render(475 + (i * 100),650);
        }
    }

    create() {
        this.dealText = this.add.text(75, 350, ['DEAL CARDS'])
            .setFontSize(18)
            .setFontFamily('Trebuchet MS')
            .setColor('#00ffff')
            .setInteractive();
        
        this.handZone = new HandZone(this, 700, 375, 900, 250);
        this.handZone.renderZone(true);


        let self = this;
        // this.deck["ace-hearts"].render(300, 300);
        // this.deck["ace-spades"].render(340, 300);
        // this.deck["ace-diamonds"].render(380, 300);
        // this.deck["ace-clubs"].render(420, 300);
        // this.deck["red-joker"].render(460, 300);

        

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

        this.input.on('dragstart', function (pointer, gameObject) {
            gameObject.setTint(0xff69b4);
            self.children.bringToTop(gameObject);
        })

        this.input.on('dragend', function (pointer, gameObject, dropped) {
            gameObject.setTint();
            if (!dropped) {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        })

        this.input.on('drop', function (pointer, gameObject, dropZone) {
            dropZone.data.values.cards++;
            gameObject.x = (dropZone.x - 350) + (dropZone.data.values.cards * 70);
            gameObject.y = dropZone.y;
            gameObject.disableInteractive();
        })
    }

    update() {

    }

}