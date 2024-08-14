const config = {
    type: Phaser.AUTO,
    width: 607.5,
    height: 1080,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let score = 0;
let scoreText;
let fallSpeed = 100; // Initial fall speed

const game = new Phaser.Game(config);

function preload() {
    this.load.image('background', 'bgpixel.jpg');
    this.load.image('noah', 'nkhb.png');
    this.load.image('stick1', 'stick1pixel.png');
    this.load.image('stick2', 'stick2pixel.png');
    this.load.image('leaf1', 'leaf1.png');
    this.load.image('leaf2', 'leaf2.png');
    this.load.image('leaf3', 'leaf3.png');
}

function create() {
    this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);

    // Add Noah's sprite with physics enabled
    this.noah = this.physics.add.image(this.sys.game.config.width / 2, this.sys.game.config.height - 150, 'noah')
        .setOrigin(0.5, 0.5)
        .setScale(0.25);

    // Create an invisible basket hitbox, positioned halfway down Noah's body
    this.basket = this.physics.add.image(this.noah.x, this.noah.y + this.noah.displayHeight * 0.07, 'nkhb.png')
        .setVisible(false)
        .setScale(0.25)
        .setSize(this.noah.width * 0.25, 10);

    // Enable arrow key input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Create a group for the falling sticks and leaves
    this.sticks = this.physics.add.group();

    // Display the score
    scoreText = this.add.text(this.sys.game.config.width - 195, 20, 'Score: 0', { 
        fontSize: '40px', 
        fill: '#F3F2E0', 
        fontFamily: 'WindsorProRg', 
        align: 'right' 
    });

    // Add collider between the basket and the sticks/leaves
    this.physics.add.overlap(this.basket, this.sticks, catchStick, null, this);

    // Define spawnStick as a method of the scene
    this.spawnStick = () => {
        let x = Phaser.Math.Between(50, this.sys.game.config.width - 50);
        let types = [
            'stick1', 'stick1', 'stick1', 'stick1', // More sticks
            'stick2', 'stick2', 'stick2', 'stick2', 
            'leaf1', 'leaf2', 'leaf3' // Fewer leaves
        ]; 
        let itemType = Phaser.Math.RND.pick(types);
        let item = this.sticks.create(x, 0, itemType);
        item.setVelocityY(fallSpeed); // Use the fallSpeed variable

        if (itemType === 'stick2') {
            item.setScale(1.5);
        }
    };

    // Spawn sticks and leaves at intervals
    this.spawnEvent = this.time.addEvent({
        delay: 1000,
        callback: this.spawnStick,
        callbackScope: this,
        loop: true
    });

    // Bind gameOver function to the scene
    this.gameOver = () => {
        this.physics.pause();
        this.spawnEvent.remove();

        // Display Game Over message
        const gameOverText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 
            `Game Over\nFinal Score: ${score}`, {
            fontSize: '64px', 
            fill: '#F3F2E0', 
            fontFamily: 'WindsorProRg', 
            align: 'center'
        }).setOrigin(0.5);

        // Create a rounded rectangle behind the text
        const playAgainBackground = this.add.graphics();
        playAgainBackground.fillStyle(0x48403c, 1); // Black background color
        playAgainBackground.fillRoundedRect(
            this.sys.game.config.width / 2 - 100, 
            this.sys.game.config.height / 2 + 75, 
            200, 
            50, 
            20 // Corner radius
        );

        // Add Play Again button text
        const playAgainButton = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 100, 
            'Play Again', {
            fontSize: '32px', 
            fill: '#F3F2E0', 
            fontFamily: 'Arial', 
            align: 'center',
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.scene.restart();
            score = 0;
            fallSpeed = 100; // Reset speed
        });

        // Freeze the items in place
        this.sticks.setVelocityY(0);
    };
}

function catchStick(basket, item) {
    if (item.texture.key.includes('leaf')) {
        this.gameOver(); 
    } else {
        item.destroy(); 
        score += 1; 
        scoreText.setText('Score: ' + score);

        // Increase speed every 10 points
        if (score % 10 === 0) {
            fallSpeed += 50; // Increase speed by 50 units
            
            // Update the speed of all currently falling items
            this.sticks.children.iterate((item) => {
                item.setVelocityY(fallSpeed);
            });
        }
    }
}

function update() {
    if (this.cursors.left.isDown && !this.physics.world.isPaused) {
        this.noah.x -= 5;
    } else if (this.cursors.right.isDown && !this.physics.world.isPaused) {
        this.noah.x += 5;
    }

    this.noah.x = Phaser.Math.Clamp(this.noah.x, 0, this.sys.game.config.width);
    this.basket.x = this.noah.x - 18;

    this.sticks.children.iterate((item) => {
        if (item && item.y > this.sys.game.config.height) {
            if (!item.texture.key.includes('leaf')) {
                this.gameOver(); 
            }
        }
    });
}
