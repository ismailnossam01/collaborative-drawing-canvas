let canvasManager;
let cursorManager;
let wsManager;

document.addEventListener('DOMContentLoaded', () => {
    canvasManager = new CanvasManager('drawing-canvas');
    cursorManager = new CursorManager();
    wsManager = new WebSocketManager(canvasManager, cursorManager);

    setupToolbar();
});

function setupToolbar() {
    const brushBtn = document.getElementById('brush-btn');
    const eraserBtn = document.getElementById('eraser-btn');
    const colorInput = document.getElementById('color-input');
    const strokeWidth = document.getElementById('stroke-width');
    const widthDisplay = document.getElementById('width-display');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const clearBtn = document.getElementById('clear-btn');
    const colorBoxes = document.querySelectorAll('.color-box');

    brushBtn.addEventListener('click', () => {
        canvasManager.setTool('brush');
        brushBtn.classList.add('active');
        eraserBtn.classList.remove('active');
    });

    eraserBtn.addEventListener('click', () => {
        canvasManager.setTool('eraser');
        eraserBtn.classList.add('active');
        brushBtn.classList.remove('active');
    });

    colorInput.addEventListener('input', (e) => {
        canvasManager.setColor(e.target.value);
    });

    colorBoxes.forEach(box => {
        box.addEventListener('click', () => {
            const color = box.getAttribute('data-color');
            colorInput.value = color;
            canvasManager.setColor(color);
        });
    });

    strokeWidth.addEventListener('input', (e) => {
        const width = e.target.value;
        widthDisplay.textContent = width;
        canvasManager.setStrokeWidth(parseInt(width));
    });

    undoBtn.addEventListener('click', () => {
        wsManager.undo();
    });

    redoBtn.addEventListener('click', () => {
        wsManager.redo();
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the canvas? This will affect all users.')) {
            wsManager.clearCanvas();
        }
    });
}