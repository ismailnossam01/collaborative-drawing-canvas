class WebSocketManager {
    constructor(canvasManager, cursorManager) {
        this.canvasManager = canvasManager;
        this.cursorManager = cursorManager;
        this.socket = null;
        this.userId = null;
        this.currentStroke = null;
        this.strokeHistory = [];
        this.undoneStrokes = [];
        
        this.connect();
    }

    connect() {
        this.socket = io();
        window.socket = this.socket;

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('init', (data) => {
            this.userId = data.userId;
            this.strokeHistory = data.history || [];
            this.canvasManager.redrawFromHistory(this.strokeHistory);
            this.updateUsersList(data.users);
        });

        this.socket.on('drawing', (data) => {
            if (data.userId !== this.userId) {
                this.canvasManager.drawRemoteLine(data);
                
                if (!this.currentStroke || this.currentStroke.userId !== data.userId) {
                    this.currentStroke = {
                        userId: data.userId,
                        color: data.color,
                        width: data.width,
                        tool: data.tool,
                        points: []
                    };
                }
                
                this.currentStroke.points.push({ x: data.startX, y: data.startY });
                this.currentStroke.points.push({ x: data.endX, y: data.endY });
            }
        });

        this.socket.on('draw_end', (data) => {
            if (this.currentStroke && this.currentStroke.userId === data.userId) {
                this.strokeHistory.push({...this.currentStroke});
                this.currentStroke = null;
                this.undoneStrokes = [];
            }
        });

        this.socket.on('cursor_move', (data) => {
            if (data.userId !== this.userId) {
                this.cursorManager.updateCursor(
                    data.userId, 
                    data.x, 
                    data.y, 
                    data.color,
                    data.name
                );
            }
        });

        this.socket.on('user_joined', (data) => {
            this.updateUsersList(data.users);
        });

        this.socket.on('user_left', (data) => {
            this.cursorManager.removeCursor(data.userId);
            this.updateUsersList(data.users);
        });

        this.socket.on('clear_canvas', () => {
            this.canvasManager.clear();
            this.strokeHistory = [];
            this.undoneStrokes = [];
        });

        this.socket.on('undo', (data) => {
            this.strokeHistory = data.history;
            this.canvasManager.redrawFromHistory(this.strokeHistory);
        });

        this.socket.on('redo', (data) => {
            this.strokeHistory = data.history;
            this.canvasManager.redrawFromHistory(this.strokeHistory);
        });

        this.setupCanvasMouseTracking();
    }

    setupCanvasMouseTracking() {
        const canvas = document.getElementById('drawing-canvas');
        
        canvas.addEventListener('mousemove', (e) => {
            const coords = this.canvasManager.getCanvasCoordinates(e);
            this.socket.emit('cursor_move', {
                x: coords.x,
                y: coords.y
            });
        });
    }

    updateUsersList(users) {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '';
        
        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <div class="user-color" style="background-color: ${user.color}"></div>
                <div class="user-name">${user.name}${user.id === this.userId ? ' (You)' : ''}</div>
            `;
            usersList.appendChild(userItem);
        });
    }

    emitDrawEnd() {
        if (this.currentStroke) {
            this.strokeHistory.push({...this.currentStroke});
            this.currentStroke = null;
            this.undoneStrokes = [];
        }
    }

    undo() {
        this.socket.emit('undo');
    }

    redo() {
        this.socket.emit('redo');
    }

    clearCanvas() {
        this.socket.emit('clear_canvas');
    }
}