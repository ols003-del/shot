// Phaser Game Configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight - 120,
    backgroundColor: '#87CEEB',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    }
};

const game = new Phaser.Game(config);

let players = {};
let myPlayer = null;
let isMoving = false;
let moveDirection = { x: 0, y: 0 };

function preload() {
    // Load assets
}

function create() {
    // Create physics groups
    this.playersGroup = this.physics.add.staticGroup();
    this.itemsGroup = this.physics.add.staticGroup();
    
    // Input
    this.input.keyboard.on('keydown', handleKeyDown);
    this.input.keyboard.on('keyup', handleKeyUp);
    this.input.on('pointermove', handleMouseMove);
    this.input.on('pointerdown', handleClick);
    
    // Update game reference
    window.gameScene = this;
}

function update() {
    if (myPlayer && myPlayer.sprite) {
        // Movement
        if (isMoving) {
            myPlayer.sprite.setVelocity(
                moveDirection.x * 150,
                moveDirection.y * 150
            );
        } else {
            myPlayer.sprite.setVelocity(0, 0);
        }
    }
}

function handleKeyDown(event) {
    if (document.activeElement.id === 'chat-input') return;
    
    isMoving = true;
    switch(event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            moveDirection.y = -1;
            break;
        case 's':
        case 'arrowdown':
            moveDirection.y = 1;
            break;
        case 'a':
        case 'arrowleft':
            moveDirection.x = -1;
            break;
        case 'd':
        case 'arrowright':
            moveDirection.x = 1;
            break;
    }
}

function handleKeyUp(event) {
    switch(event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            moveDirection.y = 0;
            break;
        case 's':
        case 'arrowdown':
            moveDirection.y = 0;
            break;
        case 'a':
        case 'arrowleft':
            moveDirection.x = 0;
            break;
        case 'd':
        case 'arrowright':
            moveDirection.x = 0;
            break;
    }
    
    if (moveDirection.x === 0 && moveDirection.y === 0) {
        isMoving = false;
    }
}

function handleMouseMove(pointer) {
    // Optional: look at mouse
}

function handleClick(pointer) {
    // Handle interactions
}

// Draw Player
function drawPlayer(scene, player) {
    if (!scene) return;
    
    const key = `${player.roomId}_${player.id}`;
    
    // Remove old sprite if exists
    if (players[key] && players[key].sprite) {
        players[key].sprite.destroy();
    }
    
    // Create new sprite
    const sprite = scene.add.graphics();
    sprite.setPosition(player.x, player.y);
    
    // Draw penguin-like character
    drawCharacter(sprite, player.color, player.hat);
    
    // Name tag
    const nameText = scene.add.text(player.x, player.y - 35, player.name, {
        fontSize: '12px',
        fill: '#000',
        backgroundColor: '#fff',
        padding: { x: 4, y: 2 },
        align: 'center'
    });
    nameText.setOrigin(0.5);
    
    players[key] = {
        ...player,
        sprite: sprite,
        nameText: nameText,
        chatBubble: null
    };
    
    if (player.id === networkState.playerId) {
        myPlayer = players[key];
    }
}

function drawCharacter(graphics, color, hat) {
    // Body
    graphics.fillStyle(parseInt(color.replace('#', '0x')));
    graphics.fillCircle(0, 0, 15);
    
    // Head
    graphics.fillCircle(0, -12, 12);
    
    // Eyes
    graphics.fillStyle(0x000000);
    graphics.fillCircle(-5, -15, 2);
    graphics.fillCircle(5, -15, 2);
    
    // Beak
    graphics.fillStyle(0xFFA500);
    graphics.fillTriangleShape([
        {x: 0, y: -12},
        {x: -3, y: -10},
        {x: 3, y: -10}
    ]);
    
    // Hat if applicable
    if (hat) {
        graphics.fillStyle(0xFF0000);
        graphics.fillRect(-10, -30, 20, 8);
    }
}

function showChatBubble(key, message) {
    if (!players[key]) return;
    
    const player = players[key];
    
    // Remove old bubble
    if (player.chatBubble) {
        player.chatBubble.destroy();
    }
    
    // Create bubble
    const scene = window.gameScene;
    const bubble = scene.add.text(player.x, player.y - 50, message, {
        fontSize: '11px',
        fill: '#000',
        backgroundColor: '#fff',
        padding: { x: 6, y: 4 },
        align: 'center',
        wordWrap: { width: 120 }
    });
    bubble.setOrigin(0.5);
    
    player.chatBubble = bubble;
    
    // Fade out and destroy
    setTimeout(() => {
        scene.tweens.add({
            targets: bubble,
            alpha: 0,
            duration: 2000,
            onComplete: () => bubble.destroy()
        });
    }, 3000);
}

function updatePlayerPosition(playerId, x, y, roomId) {
    const key = `${roomId}_${playerId}`;
    if (players[key] && players[key].sprite) {
        players[key].sprite.setPosition(x, y);
        if (players[key].nameText) {
            players[key].nameText.setPosition(x, y - 35);
        }
    }
}

function removePlayer(playerId, roomId) {
    const key = `${roomId}_${playerId}`;
    if (players[key]) {
        if (players[key].sprite) players[key].sprite.destroy();
        if (players[key].nameText) players[key].nameText.destroy();
        if (players[key].chatBubble) players[key].chatBubble.destroy();
        delete players[key];
    }
}

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight - 120);
});
