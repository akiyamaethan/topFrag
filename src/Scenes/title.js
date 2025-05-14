class TitleScene extends Phaser.Scene {
    constructor() {
        super("TitleScene");
    }

    create() {
        this.cameras.main.setBackgroundColor('#87CEEB');
        this.add.text(400, 200, "Top FRAG", {
            fontSize: "48px",
            color: "#000000"
        }).setOrigin(0.5);

        this.add.text(400, 300, "Press SPACE to Start", {
            fontSize: "24px",
            color: "#000000"
        }).setOrigin(0.5);

        this.input.keyboard.once("keydown-SPACE", () => {
            this.scene.start("GameScene");
        });
    }
}