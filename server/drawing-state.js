class DrawingState {
    constructor() {
        this.history = [];
        this.undoneHistory = [];
        this.currentStrokes = new Map();
    }

    addDrawingPoint(userId, data) {
        if (!this.currentStrokes.has(userId)) {
            this.currentStrokes.set(userId, {
                userId: userId,
                color: data.color,
                width: data.width,
                tool: data.tool,
                points: []
            });
        }

        const stroke = this.currentStrokes.get(userId);
        stroke.points.push({ x: data.startX, y: data.startY });
        stroke.points.push({ x: data.endX, y: data.endY });
    }

    endStroke(userId) {
        const stroke = this.currentStrokes.get(userId);
        if (stroke) {
            this.history.push(stroke);
            this.currentStrokes.delete(userId);
            this.undoneHistory = [];
        }
    }

    getHistory() {
        return this.history;
    }

    undo() {
        if (this.history.length > 0) {
            const lastStroke = this.history.pop();
            this.undoneHistory.push(lastStroke);
        }
        return this.history;
    }

    redo() {
        if (this.undoneHistory.length > 0) {
            const stroke = this.undoneHistory.pop();
            this.history.push(stroke);
        }
        return this.history;
    }

    clear() {
        this.history = [];
        this.undoneHistory = [];
        this.currentStrokes.clear();
    }
}

module.exports = DrawingState;