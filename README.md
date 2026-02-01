# Real-Time Collaborative Drawing Canvas

A multi-user drawing application built with Node.js and Socket.io where multiple people can draw simultaneously on a shared canvas.

🔗 **Live Demo:** https://collaborative-drawing-canvas-production.up.railway.app/

## Features

- Real-time collaborative drawing
- Multiple drawing tools (brush, eraser)
- Color picker with preset colors
- Adjustable stroke width
- Global undo/redo functionality
- User cursor tracking
- Online user list with unique colors
- Clear canvas option
- Room-based architecture for scalability

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5 Canvas API, CSS3
- **Backend**: Node.js, Express.js, Socket.io
- **Real-time Communication**: WebSockets via Socket.io

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Steps

1. Clone or extract the project folder

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Testing with Multiple Users

To test the collaborative features:

1. Open the application in multiple browser windows or tabs
2. Or open it on different devices on the same network using your local IP address
3. Start drawing in one window and observe it appearing in real-time in other windows
4. Test undo/redo to see global state management
5. Move your cursor to see cursor tracking across users

## Project Structure

```
collaborative-canvas/
├── client/
│   ├── index.html          # Main UI structure
│   ├── style.css           # Styling and layout
│   ├── canvas.js           # Canvas drawing logic
│   ├── websocket.js        # WebSocket client
│   └── main.js             # App initialization
├── server/
│   ├── server.js           # Express + Socket.io server
│   ├── rooms.js            # Room management system
│   └── drawing-state.js    # Drawing state management
├── package.json
├── README.md
└── ARCHITECTURE.md
```

## How It Works

### Client Side
- **canvas.js**: Handles all canvas drawing operations, coordinate scaling, and rendering
- **websocket.js**: Manages WebSocket connections and event handling
- **main.js**: Initializes the application and sets up UI controls

### Server Side
- **server.js**: Main server handling Socket.io connections and broadcasting
- **rooms.js**: Manages user rooms and room-based isolation
- **drawing-state.js**: Maintains drawing history for undo/redo functionality

## Key Features Explained

### Real-Time Drawing
When a user draws, the application sends small line segments to the server, which broadcasts them to all other users in the same room. This creates a smooth real-time experience.

### Global Undo/Redo
The server maintains a complete history of all drawing strokes. When undo is triggered, the last stroke is removed from history and the canvas is redrawn for all users.

### User Cursors
Each user's cursor position is tracked and displayed to other users, helping avoid drawing conflicts and improving collaboration awareness.

### Room System
The application uses a room-based architecture where all users currently join a default room. This provides a foundation for future multi-room functionality.

## Known Limitations

- Canvas state is stored in memory, so it resets when server restarts
- No authentication system implemented
- Limited to single room (all users share same canvas)
- Performance may degrade with very large number of simultaneous users
- No persistent storage of drawings

## Time Spent

Total development time: Approximately 8-10 hours

Breakdown:
- UI design and canvas setup: 2 hours
- WebSocket implementation: 2 hours
- Drawing logic and synchronization: 3 hours
- Global undo/redo: 2 hours
- Room architecture: 1 hour
- Testing and bug fixes: 1-2 hours

## Future Enhancements

- Multiple rooms with unique URLs
- Persistent storage with database (MongoDB/PostgreSQL)
- User authentication and authorization
- More drawing tools (shapes, text, images)
- Drawing export to PNG/SVG
- Mobile touch support optimization
- Performance optimizations for high user count
- Canvas zoom and pan

