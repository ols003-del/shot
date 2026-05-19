const networkState = {
    socket: null,
    playerId: null,
    username: null,
    currentRoom: 'plaza',
    coins: 0,
    inventory: [],
    avatar: {
        color: '#FF6B9D',
        hat: 'none'
    }
};

// Determine server URL
const SERVER_URL = window.location.hostname === 'localhost' 
    ? 'ws://localhost:3000' 
    : `wss://${window.location.host}`;

function connectWebSocket() {
    networkState.socket = new WebSocket(SERVER_URL);
    
    networkState.socket.onopen = () => {
        console.log('Connected to server');
    };
    
    networkState.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
    };
    
    networkState.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    networkState.socket.onclose = () => {
        console.log('Disconnected from server');
        setTimeout(connectWebSocket, 3000);
    };
}

function sendMessage(data) {
    if (networkState.socket && networkState.socket.readyState === WebSocket.OPEN) {
        networkState.socket.send(JSON.stringify(data));
    }
}

function handleServerMessage(message) {
    switch(message.type) {
        case 'login_success':
            handleLoginSuccess(message);
            break;
        case 'player_joined':
            handlePlayerJoined(message);
            break;
        case 'player_moved':
            handlePlayerMoved(message);
            break;
        case 'player_left':
            handlePlayerLeft(message);
            break;
        case 'chat_message':
            handleChatMessage(message);
            break;
        case 'room_data':
            handleRoomData(message);
            break;
        case 'inventory_update':
            handleInventoryUpdate(message);
            break;
        case 'room_switched':
            handleRoomSwitched(message);
            break;
        case 'friend_added':
            handleFriendAdded(message);
            break;
        case 'game_started':
            handleGameStarted(message);
            break;
    }
}

function handleLoginSuccess(message) {
    networkState.playerId = message.playerId;
    networkState.username = message.username;
    networkState.coins = message.coins;
    networkState.inventory = message.inventory || [];
    networkState.avatar = message.avatar || { color: '#FF6B9D', hat: 'none' };
    
    switchScreen('game-screen');
    loadRooms(message.rooms);
    switchRoom('plaza');
    updateUI();
}

function handlePlayerJoined(message) {
    const player = {
        id: message.playerId,
        name: message.username,
        x: message.x || 100,
        y: message.y || 100,
        color: message.avatar.color || '#FF6B9D',
        hat: message.avatar.hat || 'none',
        roomId: networkState.currentRoom
    };
    
    drawPlayer(window.gameScene, player);
    updatePlayerCount();
}

function handlePlayerMoved(message) {
    updatePlayerPosition(message.playerId, message.x, message.y, message.roomId);
}

function handlePlayerLeft(message) {
    removePlayer(message.playerId, message.roomId);
    updatePlayerCount();
}

function handleChatMessage(message) {
    const key = `${message.roomId}_${message.playerId}`;
    showChatBubble(key, message.text);
}

function handleRoomData(message) {
    // Clear current room
    Object.keys(players).forEach(key => {
        if (key.startsWith(networkState.currentRoom)) {
            removePlayer(key.split('_')[1], networkState.currentRoom);
        }
    });
    
    // Load new players
    message.players.forEach(player => {
        drawPlayer(window.gameScene, player);
    });
    
    updatePlayerCount();
}

function handleInventoryUpdate(message) {
    networkState.inventory = message.inventory;
    networkState.coins = message.coins;
    updateUI();
}

function handleRoomSwitched(message) {
    networkState.currentRoom = message.roomId;
    handleRoomData(message.roomData);
}

function handleFriendAdded(message) {
    updateFriendsList();
}

function handleGameStarted(message) {
    startMiniGame(message.gameId);
}

function updatePlayerPosition() {
    if (myPlayer && !networkState.socket) return;
    
    sendMessage({
        type: 'player_move',
        roomId: networkState.currentRoom,
        x: myPlayer.sprite.x,
        y: myPlayer.sprite.y
    });
}

// Periodically update position
setInterval(updatePlayerPosition, 100);

// Initialize connection when ready
function initializeNetwork() {
    connectWebSocket();
}
