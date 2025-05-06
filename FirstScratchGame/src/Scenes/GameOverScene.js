class GameOverScene extends Phaser.Scene {
    constructor() {
        super("GameOverScene");
    }

    init(data) {
        this.finalScore = data.score;
    }

    create() {
        this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, 'Game Over', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(this.scale.width / 2, this.scale.height / 2, `Score: ${this.finalScore}`, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(this.scale.width / 2, this.scale.height / 2 + 40, 'Press SPACE to Restart', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}
