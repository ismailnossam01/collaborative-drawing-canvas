# Architecture Documentation

## How the System Works

This document explains how I built the collaborative drawing app. I'll try to explain the flow of data and the decisions I made while building this.

## Basic Flow

When you open the app, here's what happens:

```
User Opens Browser --> Connects to Server --> Gets Drawing History --> Can Start Drawing
                                    |
                            Other Users See It Live
```

The main idea is simple - when one person draws something, it should show up on everyone else's screen immediately.

## Data Flow

### When User Joins:
1. Browser connects to server using websocket
2. Server gives them a unique ID and color
3. Server sends all the previous drawings (history)
4. User can see what others already drew

### When Someone Draws:
1. User moves mouse on canvas
2. Canvas catches the coordinates (x, y positions)
3. Sends these points to server
4. Server broadcasts to everyone else
5. Other users draw the same line on their canvas

### When Someone Leaves:
- Server removes them from users list
- Their cursor dissapears from other screens
- But their drawings stay on the canvas

## File Structure & What Each Does

### Client Side (Browser)

**canvas.js** - This handles all the drawing stuff
- Setting up the canvas
- Drawing lines when user moves mouse
- Converting mouse position to canvas coordinates (this was tricky because of different screen sizes)
- Eraser tool using `globalCompositeOperation`

**websocket.js** - Handles connection to server
- Connects using socket.io
- Sends drawing data to server
- Receives drawings from other users
- Updates user list

**main.js** - Just sets up the UI buttons and connects everything

### Server Side (Node.js)

**server.js** - Main server file
- Uses Express for serving files
- Socket.io for real-time connections
- Manages all connected users
- Broadcasts drawing events

**drawing-state.js** - Keeps track of all drawings
- Stores history of all strokes
- Handles undo/redo
- This was the hardest part!

**rooms.js** - Room management
- Right now everyone joins "default" room
- Made this so we can add multiple rooms later
- Helps organize users

## WebSocket Messages

I use these events to communicate:

### Client sends to Server:
- `drawing` - when user is drawing (sends x, y, color, width)
- `draw_end` - when user stops drawing
- `cursor_move` - cursor position
- `undo` - undo request
- `redo` - redo request
- `clear_canvas` - clear everything

### Server sends to Clients:
- `init` - initial data when joining
- `drawing` - broadcast someone's drawing
- `user_joined` - new user notification
- `user_left` - user disconnect notification
- `undo/redo` - updated history

## The Undo/Redo Problem

This was the hardest part. The requirement said undo should work globally - meaning anyone can undo anyone's drawing.

### My Solution:

The server keeps an array of all strokes in order. Each stroke looks like:
```javascript
{
    userId: 'abc123',
    color: '#FF0000',
    width: 3,
    tool: 'brush',
    points: [{x: 10, y: 20}, {x: 11, y: 21}, ...]
}
```

When someone clicks undo:
1. Server removes last stroke from history array
2. Saves it in "undone" array
3. Sends entire new history to all users
4. Everyone redraws their canvas from scratch

I know redrawing entire canvas is not most efficient but it guarantees everyone sees same thing. With more time I would optimize this.

When someone draws new stroke, the undone array gets cleared. Otherwise redo wouldn't make sense.

## Performance Decisions

### Why I send individual points instead of batching?
- Tried batching first but it felt laggy
- Individual points give smoother real-time feel
- Network can handle it for small number of users

### Why full canvas redraw on undo?
- Simpler to implement
- Guarantees consistency
- For assignment demo size, performance is fine
- In production would need better approach

### Coordinate Scaling
Had to handle different screen sizes. If user A has 1920x1080 and user B has 1366x768, same drawing should look same.

Solution: I normalize coordinates based on canvas size, not screen size.

```javascript
const scaleX = canvas.width / rect.width;
const scaleY = canvas.height / rect.height;
```

This took me some time to figure out!

## Handling Multiple Users Drawing Together

### What if two people draw at same spot?
I use "last-write-wins" approach. Whatever reaches server last, that's what shows up on top. The canvas composite operations handle the overlapping naturally.

### Cursor tracking
Each user has colored cursor so you can see where others are drawing. Helps avoid drawing over each other by mistake.

## Room System

I added rooms.js even though right now everyone is in same room. The architecture supports multiple rooms:
- Each room has its own drawing state
- Users in room A can't see room B's drawings
- Room gets deleted when last person leaves (except default room)

Didn't implement the UI for multiple rooms due to time, but the backend structure is ready.

## Problems I Faced

1. **Coordinate mapping** - Took time to understand difference between screen coordinates and canvas coordinates
2. **Smooth lines** - First version had jagged lines. Fixed by using `lineCap: 'round'` and `lineJoin: 'round'`
3. **Global undo** - Had to think hard about this. Tried few approaches before settling on full history redraw
4. **WebSocket events** - Sometimes events arrive out of order. Had to handle that properly
5. **Eraser tool** - Learned about `globalCompositeOperation = 'destination-out'` for eraser

## What Could Be Better

With more time I would improve:
- Add Redis for storing state (right now it's in memory, resets on restart)
- Optimize the redraw mechanism for undo/redo
- Add throttling to reduce network traffic
- Better error handling
- Add user authentication
- Make it work better on mobile/touch devices
- Add more tools like shapes, text etc

## Testing Approach

I tested by opening multiple browser windows and tabs:
- Drawing in one, checking if appears in others
- Testing undo/redo extensively
- Testing what happens when someone disconnects
- Checking cursor movements
- Testing with 3-4 windows open simultaneously

Found and fixed several bugs during testing like cursor not updating properly, undo not working sometimes etc.

## Security Note

This is a demo/assignment version so there's no authentication or security. In real production app would need:
- User login
- Rate limiting on events
- Input validation
- Proper error handling
- HTTPS/WSS

## Conclusion

Overall the assignment helped me learn alot about:
- Real-time systems
- WebSocket programming
- Canvas API
- State management across multiple clients
- Handling race conditions

The hardest part was definately the global undo/redo. Spent most time on that. Rest of the features were more straightforward.

Total time spent: Around 8-10 hours including debugging and testing.
