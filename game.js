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

const game = new Phaser.Game(config);

function preload() {
    this.load.image('background', 'bgpixel.jpg');
    this.load.image('noah', 'nkhb.png');
    this.load.image('stick1', 'stick1pixel.png');
    this.load.image('stick2', 'stick2pixel.png');
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
        .setSize(this.noah.width * 0.25, 10); // Adjust the size to a narrow band

    // Enable arrow key input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Create a group for the falling sticks
    this.sticks = this.physics.add.group();

    // Display the score
    scoreText = this.add.text(this.sys.game.config.width - 195, 20, 'Score: 0', { 
        fontSize: '40px', 
        fill: '#F3F2E0', 
        fontFamily: 'WindsorProRg', 
        align: 'right' 
    });

    // Add collider between the basket and the sticks
    this.physics.add.overlap(this.basket, this.sticks, catchStick, null, this);

    // Define spawnStick as a method of the scene
    this.spawnStick = () => {
        let x = Phaser.Math.Between(50, this.sys.game.config.width - 50);
        let stickType = Phaser.Math.RND.pick(['stick1', 'stick2']); // Randomly pick stick1 or stick2
        let stick = this.sticks.create(x, 0, stickType);
        stick.setVelocityY(200); // Make the stick fall down

        // Enlarge only stick2
        if (stickType === 'stick2') {
            stick.setScale(1.5); // Make stick2 larger
        }
    };

    // Ensure the gameOver function is properly bound to the scene
    this.gameOver = () => {
        this.physics.pause(); // Stop all physics operations
        this.spawnEvent.remove(); // Stop spawning new sticks

        // Display Game Over message
        const gameOverText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 
            `Game Over\nFinal Score: ${score}`, {
            fontSize: '64px', 
            fill: '#F3F2E0', 
            fontFamily: 'WindsorProRg', 
            align: 'center'
        }).setOrigin(0.5);

        // Add Play Again button
        const playAgainButton = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2 + 100, 
            'Play Again', {
            fontSize: '32px', 
            fill: '#ffffff', 
            fontFamily: 'Arial', 
            align: 'center',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.scene.restart(); // Restart the game when the button is clicked
            score = 0; // Reset score
        });

        // Ensure the sticks currently on screen freeze in place
        this.sticks.setVelocityY(0); // Set velocity of all sticks to 0, freezing them in place
    };

    // Spawn sticks at intervals
    this.spawnEvent = this.time.addEvent({
        delay: 1000, // Spawn a stick every 1000ms (1 second)
        callback: this.spawnStick,
        callbackScope: this,
        loop: true
    });
}

function catchStick(basket, stick) {
    stick.destroy(); // Remove the stick from the game
    score += 1; // Increase score by 1
    scoreText.setText('Score: ' + score); // Update the score display
}

function update() {
    // Move Noah with arrow keys
    if (this.cursors.left.isDown) {
        this.noah.x -= 5; // Move left
    } else if (this.cursors.right.isDown) {
        this.noah.x += 5; // Move right
    }

    // Ensure Noah doesn't go off-screen
    this.noah.x = Phaser.Math.Clamp(this.noah.x, 0, this.sys.game.config.width);

    // Move the basket with Noah
    this.basket.x = this.noah.x - 18;

    // Check if any sticks have reached the bottom of the screen
    this.sticks.children.iterate((stick) => {
        if (stick && stick.y > this.sys.game.config.height) {  // Check if stick exists before accessing properties
            this.gameOver(); // Trigger game over if a stick reaches the bottom
        }
    });
}
