import { Scene, GameObjects } from "phaser"
import { Card, Deck, StandardDeckFactory, Rank, Suit, CardFace } from '../helpers/Card'
import HandZone from '../helpers/Zones'
import { OpenEvent } from "ws";


export default class OldMaid extends Scene {
    private dealText: GameObjects.Text;
    private deck: Deck;
    private cardKeys: string[];
    private handZone: HandZone;
    private ws: WebSocket;

    constructor() {
        super('OldMaid');
    }

    preload() {
        const imageDir = "PNG-cards-1.3";
        this.deck = StandardDeckFactory(imageDir, this, 1);
        this.cardKeys = Object.keys(this.deck);
        // tslint:disable-next-line: no-console
        console.log("Created deck with " + this.cardKeys.length + " cards.")
    }

    onOpen(event: Event) {
        alert("CONNECTED");
        this.ws.send("WebSocket rocks");
    }

    onClose(event: CloseEvent) {
        // tslint:disable-next-line: no-console
        console.log("socket closed.");
    }

    onMessage(event: MessageEvent) {
        // tslint:disable-next-line: no-console
        console.log("message received:" + event.data);
    }

    onError(event) {
        // tslint:disable-next-line: no-console
        console.log("socket closed.");
    }

    connectSocket() {
        const loc = window.location;
        let wsUri;
        if (loc.protocol === "https:") {
            wsUri = "wss:";
        } else {
            wsUri = "ws:";
        }

        wsUri += "//" + loc.host + "/socket";

        // const wsUri = "ws:/socket";
        this.ws = new WebSocket(wsUri);
        this.ws.onopen = (evt) => { this.onOpen(evt) };
        this.ws.onclose = (evt) => { this.onClose(evt) };
        this.ws.onmessage = (evt) => { this.onMessage(evt) };
        this.ws.onerror = (evt) => { this.onError(evt) };

    }
    dealCards() {
        this.connectSocket();
        for (let i = 0; i < 5; i++) {
            const playerCard = this.deck[this.cardKeys[(Math.floor(Math.random() * this.cardKeys.length))]]
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


        const self = this;
        // this.deck["ace-hearts"].render(300, 300);
        // this.deck["ace-spades"].render(340, 300);
        // this.deck["ace-diamonds"].render(380, 300);
        // this.deck["ace-clubs"].render(420, 300);
        // this.deck["red-joker"].render(460, 300);

        this.dealText.on('pointerdown', () => {
            self.dealCards();
        })

        this.dealText.on('pointerover', () => {
            self.dealText.setColor('#ff69b4');
        })

        this.dealText.on('pointerout', () => {
            self.dealText.setColor('#00ffff');
        })

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        })

        this.input.on('dragstart', (pointer, gameObject) => {
            gameObject.setTint(0xff69b4);
            self.children.bringToTop(gameObject);
        })

        this.input.on('dragend', (pointer, gameObject, dropped) => {
            gameObject.setTint();
            if (!dropped) {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        })

        this.input.on('drop', (pointer, gameObject, dropZone) => {
            dropZone.data.values.cards++;
            gameObject.x = (dropZone.x - 350) + (dropZone.data.values.cards * 70);
            gameObject.y = dropZone.y;
            gameObject.disableInteractive();
        })
    }

    // tslint:disable-next-line: no-empty
    update() {

    }

}