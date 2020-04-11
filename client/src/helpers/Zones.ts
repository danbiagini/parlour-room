import { Scene, GameObjects, Game } from "phaser";

export default class HandZone {
    private zone: GameObjects.Zone = undefined;
    private outline: GameObjects.Graphics = undefined;
    private cards: number = 0;

    constructor(private scene: Scene, private x: number, private y: number,
                private w: number, private h: number) {
        
    }

    renderOutline() {
        if (this.outline == undefined) {
            this.outline = this.scene.add.graphics();
        }
        this.outline.lineStyle(4, 0xff69b4);
        this.outline.strokeRect(this.zone.x - this.zone.input.hitArea.width / 2,
            this.zone.y - this.zone.input.hitArea.height / 2,
            this.zone.input.hitArea.width, this.zone.input.hitArea.height);
    }

    renderZone(outline: boolean = false) {
        this.zone = this.scene.add.zone(this.x, this.y, this.w, this.h);
        this.zone.setRectangleDropZone(this.w, this.h);
        this.zone.setData({ cards: this.cards });

        this.renderOutline();

        // this.scene.input.on('drop', function (pointer, gameObject, this.zone) => {
        //     console.log("someone dragged :" + gameObject);
        //     dropZone.data.values.cards++;
        //     gameObject.x = (dropZone.x - 350) + (dropZone.data.values.cards * 50);
        //     gameObject.y = dropZone.y;
        //     gameObject.disableInteractive();
        // })

    }


}