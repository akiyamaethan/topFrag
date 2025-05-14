class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    preload() {
        this.load.image('player', 'assets/ship_0006.png');
        this.load.image('enemyLight', 'assets/ship_0016.png');
        this.load.image('enemyHeavy', 'assets/ship_0015.png');
        this.load.image('bullet', 'assets/tile_0000.png'); // used for both player and enemy bullets
    }

    create() {
        // Background
        this.cameras.main.setBackgroundColor('#87CEEB');

        // Player setup
        this.player = this.physics.add.sprite(50, this.scale.height / 2, 'player');
        this.player.angle = 90;
        this.player.scale = 2;
        this.player.setCollideWorldBounds(true);
        this.player.health = 10;
        this.player.setSize(this.player.width * 0.6, this.player.height * 0.6);
        this.player.speed = 200;

        // Inputs
        this.cursors = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            shoot: 'SPACE',
            nextWave: 'ENTER' // Added the enter key to skip upgrade phase
        });

        // Bullets
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.numShots = 1;

        // Score & health & waves
        this.score = 0;
        this.scoreText = this.add.text(this.scale.width - 150, 10, 'Score: 0', { fontSize: '20px', fill: '#000' });
        this.healthText = this.add.text(10, 10, 'Health: 10', { fontSize: '20px', fill: '#000' });
        this.waveText = this.add.text(350, 10, 'Wave: 1', { fontSize: '20px', fill: '#000' });

        // Waves
        this.enemies = this.physics.add.group();
        this.currentWave = 0;
        this.waveActive = false;
        this.addNextWavePrompt();

        // Collisions
        this.physics.add.overlap(this.playerBullets, this.enemies, this.damageEnemy, null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.enemyHitsPlayer, null, this);
    }

    update(time, delta) {
        if (this.waveActive) {
            this.handlePlayerInput();
            this.moveEnemiesZigZag(time);
            this.shootEnemyBullets(time);

            // Check if enemies went off screen
            this.enemies.children.iterate(enemy => {
                if (enemy && enemy.active && enemy.x + enemy.width < 0) {
                    enemy.destroy();
                    this.player.health--;
                    this.healthText.setText('Health: ' + this.player.health);

                    if (this.player.health <= 0) {
                        this.scene.start('GameOverScene', { score: this.score });
                    }

                    if (this.enemies.countActive(true) === 0) {
                        this.waveActive = false;
                        
                        this.addNextWavePrompt();
                        this.showUpgradeShop();
                    }
                }
            });

        } 
        if (Phaser.Input.Keyboard.JustDown(this.cursors.nextWave)) {
            this.nextWave(); // Skip upgrade phase and start next wave
        }
    }

    handlePlayerInput() {
        if (this.cursors.up.isDown) this.player.setVelocityY(-this.player.speed);
        else if (this.cursors.down.isDown) this.player.setVelocityY(this.player.speed);
        else this.player.setVelocityY(0);

        if (Phaser.Input.Keyboard.JustDown(this.cursors.shoot)) {
            const spacing = 10; // vertical spacing between bullets
            const totalHeight = (this.numShots - 1) * spacing;
        
            for (let i = 0; i < this.numShots; i++) {
                const offsetY = -totalHeight / 2 + i * spacing;
                const bullet = this.playerBullets.create(this.player.x + 20, this.player.y + offsetY, 'bullet');
                if (bullet) {
                    bullet.setSize(bullet.width * 0.5, bullet.height * 0.3);
                    bullet.angle = 270;
                    bullet.setVelocityX(400);
                }
            }
        }
        
    }

    damageEnemy(bullet, enemy) {
        bullet.destroy();
        enemy.health--;
        if (enemy.health <= 0) {
            enemy.destroy();
            this.score++;
            this.scoreText.setText('Score: ' + this.score);

            if (this.enemies.countActive(true) === 0) {
                this.waveActive = false;
                this.addNextWavePrompt();
                this.showUpgradeShop();
            }
        }
    }

    hitPlayer(player, bullet) {
        bullet.destroy();
        player.health--;
        this.healthText.setText('Health: ' + player.health);

        if (player.health <= 0) {
            this.scene.start('GameOverScene', { score: this.score });
        }
    }

    addNextWavePrompt() {
        this.nextWaveText = this.add.text(
            this.scale.width / 2,
            this.scale.height /5,
            'Press ENTER to Start Next Wave',
            { fontSize: '24px', fill: '#000' }
        ).setOrigin(0.5);
    }

    nextWave() {
        this.currentWave++;
        this.waveText.setText('Wave: ' + this.currentWave);
        this.nextWaveText.destroy();
        this.spawnEnemies();
        this.waveActive = true;
        if (this.upgradeText) {
            this.hideUpgradeShop();
        }
        
    }

    spawnEnemies() {
        const startY = 100;
        const spacing = 100;
        let enemyGroupCount = 0; // Track wave number

        const spawnNextWave = () => {
            if (enemyGroupCount < this.currentWave) {
                for (let i = 0; i < 5; i++) {
                    const heavy = this.enemies.create(this.scale.width + 50, startY + i * spacing, 'enemyHeavy');
                    heavy.scale = 2;
                    heavy.angle = 270;
                    heavy.health = 3;
                    heavy.speed = 35;
                    heavy.startY = heavy.y;
                    heavy.canShoot = false; // Heavy enemies don't shoot
                }

                for (let i = 0; i < 5; i++) {
                    const light = this.enemies.create(this.scale.width + 150, startY + i * spacing, 'enemyLight');
                    light.scale = 2;
                    light.angle = 270;
                    light.health = 1;
                    light.speed = 35;
                    light.canShoot = true;
                    light.lastShot = this.time.now - Phaser.Math.Between(0, 5000); // Randomize shoot delay
                    light.nextShotDelay = Phaser.Math.Between(2500, 5000); // Random shooting intervals
                    light.startY = light.y;
                }

                enemyGroupCount++;

                this.time.delayedCall(3000, spawnNextWave);
            }
        };

        spawnNextWave();
    }

    moveEnemiesZigZag(time) {
        this.enemies.children.iterate(enemy => {
            if (!enemy) return;
            enemy.x -= enemy.speed * 0.016;
            enemy.y = enemy.startY + Math.sin(enemy.x / 30) * 20;
        });
    }

    shootEnemyBullets(time) {
        this.enemies.children.iterate(enemy => {
            if (
                enemy.texture.key === 'enemyLight' &&
                enemy.canShoot &&
                time - enemy.lastShot > enemy.nextShotDelay
            ) {
                const bullet = this.enemyBullets.create(enemy.x - 20, enemy.y, 'bullet');
                bullet.setSize(bullet.width * 0.5, bullet.height * 0.3);
                bullet.angle = 90;
                bullet.setVelocityX(-200);

                enemy.lastShot = time;
                enemy.nextShotDelay = Phaser.Math.Between(3000, 6000); // Reset with random delay
            }
        });
    }

    enemyHitsPlayer(player, enemy) {
        enemy.destroy();
        player.health--;
        this.healthText.setText('Health: ' + player.health);

        if (player.health <= 0) {
            this.scene.start('GameOverScene', { score: this.score });
        }

        if (this.enemies.countActive(true) === 0) {
            this.waveActive = false;
            this.addNextWavePrompt();
            this.showUpgradeShop();
        }
    }

    showUpgradeShop() {
        this.player.setVelocity(0);
        this.upgradeText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 50,
            'Upgrade Options',
            { fontSize: '24px', fill: '#000' }
        ).setOrigin(0.5);

        // Create the upgrade buttons
        // Health Upgrade
        this.healthButton = this.createUpgradeButton('Increase Health', this.buyHealthUpgrade, this.scale.height / 2);
        this.healthPrice = this.add.text(this.scale.width / 2 + 150, this.scale.height / 2, '10 pts', { fontSize: '16px', fill: '#000' }).setOrigin(0.5);

        // Dual Fire Upgrade
        let dualFireCost = Math.pow(10, this.numShots);
        this.dualFireButton = this.createUpgradeButton('Multi-Shot Upgrade', this.buyDualFireUpgrade, this.scale.height / 2 + 50);
        this.dualFirePrice = this.add.text(this.scale.width / 2 + 150, this.scale.height / 2 + 50, dualFireCost + ' pts', { fontSize: '16px', fill: '#000' }).setOrigin(0.5);

        // Speed Upgrade
        this.speedButton = this.createUpgradeButton('Increase Speed', this.buySpeedUpgrade, this.scale.height / 2 + 100);
        this.speedPrice = this.add.text(this.scale.width / 2 + 150, this.scale.height / 2 + 100, '10 pts', { fontSize: '16px', fill: '#000' }).setOrigin(0.5);

    }

    createUpgradeButton(text, callback, yPosition) {
        let button = this.add.text(this.scale.width / 2, yPosition, text, { fontSize: '18px', fill: '#000' });
        button.setOrigin(0.5);
        button.setInteractive();
        button.on('pointerdown', callback, this);
        return button;
    }

    buyHealthUpgrade() {
        const cost = 10;
        if (this.score >= cost) {
            this.player.health += 1;
            this.score -= cost;
            this.scoreText.setText('Score: ' + this.score);
            this.healthText.setText('Health: ' + this.player.health);
        }
    }
    
    buySpeedUpgrade() {
        const cost = 10;
        if (this.score >= cost) {
            this.player.speed += 20;
            this.score -= cost;
            this.scoreText.setText('Score: ' + this.score);
        }
    }
    
    buyDualFireUpgrade() {
        const cost = Math.pow(10, this.numShots);
        if (this.score >= cost) {
            this.numShots += 1;
            this.score -= cost;
            this.scoreText.setText('Score: ' + this.score);
    
            // Update cost label after purchase
            this.dualFirePrice.setText(Math.pow(10, this.numShots) + ' pts');
        }
    }
    

    hideUpgradeShop() {
        this.upgradeText.destroy();
        this.healthButton.destroy();
        this.dualFireButton.destroy();
        this.speedButton.destroy();
        this.healthPrice.destroy();
        this.dualFirePrice.destroy();
        this.speedPrice.destroy();

    }
}

