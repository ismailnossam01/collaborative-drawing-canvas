class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#000000';
        this.strokeWidth = 3;
        this.lastX = 0;
        this.lastY = 0;
        
        this.setupCanvas();
        this.attachEventListeners();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth - 320;
        this.canvas.height = window.innerHeight - 40;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    attachEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.width = window.innerWidth - 320;
        this.canvas.height = window.innerHeight - 40;
        this.ctx.putImageData(imageData, 0, 0);
    }

    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    startDrawing(event) {
        this.isDrawing = true;
        const coords = this.getCanvasCoordinates(event);
        this.lastX = coords.x;
        this.lastY = coords.y;
    }

    draw(event) {
        if (!this.isDrawing) return;

        const coords = this.getCanvasCoordinates(event);
        
        this.drawLine(this.lastX, this.lastY, coords.x, coords.y, this.currentColor, this.strokeWidth, this.currentTool);

        if (window.socket) {
            window.socket.emit('drawing', {
                startX: this.lastX,
                startY: this.lastY,
                endX: coords.x,
                endY: coords.y,
                color: this.currentColor,
                width: this.strokeWidth,
                tool: this.currentTool
            });
        }

        this.lastX = coords.x;
        this.lastY = coords.y;
    }

    stopDrawing() {
        if (this.isDrawing && window.socket) {
            window.socket.emit('draw_end');
        }
        this.isDrawing = false;
    }

    drawLine(x1, y1, x2, y2, color, width, tool) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        
        if (tool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = color;
        }
        
        this.ctx.lineWidth = width;
        this.ctx.stroke();
        this.ctx.closePath();
    }

    drawRemoteLine(data) {
        this.drawLine(data.startX, data.startY, data.endX, data.endY, data.color, data.width, data.tool);
    }

    setTool(tool) {
        this.currentTool = tool;
    }

    setColor(color) {
        this.currentColor = color;
    }

    setStrokeWidth(width) {
        this.strokeWidth = width;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    redrawFromHistory(history) {
        this.clear();
        history.forEach(stroke => {
            stroke.points.forEach((point, index) => {
                if (index === 0) return;
                const prevPoint = stroke.points[index - 1];
                this.drawLine(
                    prevPoint.x, 
                    prevPoint.y, 
                    point.x, 
                    point.y, 
                    stroke.color, 
                    stroke.width, 
                    stroke.tool
                );
            });
        });
    }
}

class CursorManager {
    constructor() {
        this.container = document.getElementById('cursors-container');
        this.cursors = new Map();
    }

    updateCursor(userId, x, y, color, name) {
        let cursor = this.cursors.get(userId);
        
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.className = 'user-cursor';
            cursor.innerHTML = `<div class="cursor-label">${name}</div>`;
            this.container.appendChild(cursor);
            this.cursors.set(userId, cursor);
        }

        const canvas = document.getElementById('drawing-canvas');
        const rect = canvas.getBoundingClientRect();
        
        cursor.style.left = (rect.left + x * (rect.width / canvas.width)) + 'px';
        cursor.style.top = (rect.top + y * (rect.height / canvas.height)) + 'px';
        cursor.style.backgroundColor = color;
    }

    removeCursor(userId) {
        const cursor = this.cursors.get(userId);
        if (cursor) {
            cursor.remove();
            this.cursors.delete(userId);
        }
    }

    clearAll() {
        this.cursors.forEach(cursor => cursor.remove());
        this.cursors.clear();
    }
}