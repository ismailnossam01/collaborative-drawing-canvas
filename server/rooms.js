class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.defaultRoom = 'default';
        this.initializeDefaultRoom();
    }

    initializeDefaultRoom() {
        this.rooms.set(this.defaultRoom, {
            id: this.defaultRoom,
            users: new Set(),
            drawingState: null
        });
    }

    joinRoom(userId, roomId = this.defaultRoom) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                id: roomId,
                users: new Set(),
                drawingState: null
            });
        }

        const room = this.rooms.get(roomId);
        room.users.add(userId);
        return room;
    }

    leaveRoom(userId, roomId = this.defaultRoom) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.users.delete(userId);
            
            if (room.users.size === 0 && roomId !== this.defaultRoom) {
                this.rooms.delete(roomId);
            }
        }
    }

    getRoom(roomId = this.defaultRoom) {
        return this.rooms.get(roomId);
    }

    getRoomUsers(roomId = this.defaultRoom) {
        const room = this.rooms.get(roomId);
        return room ? Array.from(room.users) : [];
    }

    setDrawingState(roomId, drawingState) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.drawingState = drawingState;
        }
    }

    getDrawingState(roomId = this.defaultRoom) {
        const room = this.rooms.get(roomId);
        return room ? room.drawingState : null;
    }
}

module.exports = RoomManager;