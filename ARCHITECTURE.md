# Architecture Documentation

## System Overview

This application implements a real-time collaborative drawing system using WebSocket connections to synchronize canvas state across multiple users. The architecture is designed with a room-based isolation system to support future scalability.

## Data Flow Diagram

```
User A Browser                Server                 User B Browser
     |                          |                          |
     |--[1] Connect------------>|                          |
     |<--[2] Join Room----------|                          |
     |<--[3] Init + History-----|                          |
     |                          |<--[1] Connect------------|
     |                          |---[2] Join Room--------->|
     |                          |---[3] Init + History---->|
     |                          |                          |
     |--[4] Drawing Event------>|                          |
     |                          |---[5] Broadcast--------->|
     |                          |                          |--[6] Render
     |                          |<--[7] Drawing Event------|
     |<--[8] Broadcast----------|                          |
[9] Render                      |                          |
     |                          |                          |
     |--[10] Cursor Move------->|                          |
     |                          |---[11] Broadcast-------->|
```

### Flow Steps:

1. User connects to server via WebSocket
2. Server assigns user to default room
3. Server sends initial canvas state and user list
4. User starts drawing, emits drawing events
5. Server broadcasts to all other users in the same room
6. Other users render the drawing in real-time
7. Process repeats for all users simultaneously
8. Server broadcasts to requesting user's room
9. Canvas updates locally
10. Cursor position updates sent to server
11. Cursor positions broadcast to room members

## Component Architecture

### Client-Side Components

#### CanvasManager (canvas.js)
Responsibilities:
- Canvas initialization and setup
- Drawing line segments with smooth paths
- Handling mouse/touch events
- Coordinate scaling and normalization
- Local and remote rendering
- Canvas clearing and redrawing from history

Key Methods:
- `getCanvasCoordinates()`: Converts screen coordinates to canvas coordinates
- `drawLine()`: Renders line segments on canvas
- `redrawFromHistory()`: Reconstructs canvas from stroke history

#### WebSocketManager (websocket.js)
Responsibilities:
- Socket.io connection management
- Event emission and listening
- Stroke history management
- User list updates
- Cursor position tracking

Key Methods:
- `connect()`: Establishes WebSocket connection
- `updateUsersList()`: Updates online users display
- `emitDrawEnd()`: Finalizes stroke and updates history

#### CursorManager (canvas.js)
Responsibilities:
- Remote cursor visualization
- Cursor position updates
- Cursor lifecycle management

Key Methods:
- `updateCursor()`: Updates cursor position and appearance
- `removeCursor()`: Cleans up disconnected user cursors

### Server-Side Components

#### Server (server.js)
Responsibilities:
- Express server initialization
- Socket.io connection handling
- Event broadcasting
- User management
- Color assignment

Key Features:
- Handles all WebSocket events
- Broadcasts to specific rooms
- Manages user lifecycle
- Integrates RoomManager and DrawingState

#### RoomManager (rooms.js)
Responsibilities:
- Room creation and deletion
- User room assignment
- Room-based user tracking
- Drawing state association per room

Key Methods:
- `joinRoom()`: Adds user to specified room
- `leaveRoom()`: Removes user from room
- `getRoomUsers()`: Returns all users in a room
- `setDrawingState()`: Associates drawing state with room
- `getDrawingState()`: Retrieves room's drawing state

Architecture Benefits:
- Isolation between different drawing sessions
- Foundation for multi-room functionality
- Clean separation of concerns
- Scalable design for future enhancements

#### DrawingState (drawing-state.js)
Responsibilities:
- Stroke history management
- Undo/redo stack handling
- Current stroke tracking
- State queries

Key Methods:
- `addDrawingPoint()`: Adds point to current stroke
- `endStroke()`: Finalizes stroke and adds to history
- `undo()`: Removes last stroke from history
- `redo()`: Restores previously undone stroke
- `getHistory()`: Returns complete stroke history

## WebSocket Protocol

### Client to Server Events

#### `drawing`
Sent continuously while user is drawing
```javascript
{
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: string,
    width: number,
    tool: 'brush' | 'eraser'
}
```

#### `draw_end`
Sent when user completes a stroke
```javascript
{}
```

#### `cursor_move`
Sent when user moves cursor on canvas
```javascript
{
    x: number,
    y: number
}
```

#### `undo`
Request to undo last stroke
```javascript
{}
```

#### `redo`
Request to redo previously undone stroke
```javascript
{}
```

#### `clear_canvas`
Request to clear entire canvas
```javascript
{}
```

### Server to Client Events

#### `init`
Sent when user first connects
```javascript
{
    userId: string,
    history: Array<Stroke>,
    users: Array<User>
}
```

#### `drawing`
Broadcast drawing event from another user
```javascript
{
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: string,
    width: number,
    tool: string,
    userId: string
}
```

#### `draw_end`
Broadcast when remote user finishes stroke
```javascript
{
    userId: string
}
```

#### `cursor_move`
Broadcast cursor position from another user
```javascript
{
    userId: string,
    x: number,
    y: number,
    color: string,
    name: string
}
```

#### `user_joined`
Broadcast when new user connects
```javascript
{
    users: Array<User>
}
```

#### `user_left`
Broadcast when user disconnects
```javascript
{
    userId: string,
    users: Array<User>
}
```

#### `undo`
Broadcast after undo operation
```javascript
{
    history: Array<Stroke>
}
```

#### `redo`
Broadcast after redo operation
```javascript
{
    history: Array<Stroke>
}
```

#### `clear_canvas`
Broadcast when canvas is cleared
```javascript
{}
```

## Undo/Redo Strategy

### Problem
Global undo/redo means any user can undo any other user's drawing, which requires maintaining a shared history across all clients.

### Solution

1. **Server-Side History Stack**: The server maintains a single source of truth as an array of strokes in chronological order.

2. **Stroke Tracking**: Each drawing action is broken into strokes. A stroke is a complete drawing action from mousedown to mouseup.

3. **Undo Operation**:
   - Server removes the last stroke from history array
   - Moves it to an undone history array
   - Broadcasts updated history to all clients in the room
   - All clients redraw canvas from scratch using new history

4. **Redo Operation**:
   - Server takes last item from undone history
   - Pushes it back to main history
   - Broadcasts to all clients in the room
   - Clients redraw from updated history

5. **History Invalidation**: Any new drawing action clears the undone history to prevent inconsistent states.

### Data Structure
```javascript
{
    history: [
        {
            userId: 'socket-id-1',
            color: '#FF0000',
            width: 3,
            tool: 'brush',
            points: [
                { x: 100, y: 100 },
                { x: 101, y: 102 },
                { x: 103, y: 105 }
            ]
        }
    ],
    undoneHistory: [],
    currentStrokes: Map {
        'socket-id-2' => { userId, color, width, tool, points: [...] }
    }
}
```

### Why This Approach?

**Advantages**:
- Guaranteed consistency across all clients
- Simple to understand and debug
- No race conditions with undo/redo
- Works reliably with any number of users

**Trade-offs**:
- Full canvas redraw on undo/redo (higher CPU usage)
- Not optimal for very large canvases
- But ensures correctness over performance

## Room Management System

### Architecture

The room system provides logical isolation between different drawing sessions:

```javascript
RoomManager {
    rooms: Map {
        'default' => {
            id: 'default',
            users: Set ['user1', 'user2'],
            drawingState: DrawingState
        },
        'room-abc123' => {
            id: 'room-abc123',
            users: Set ['user3'],
            drawingState: DrawingState
        }
    }
}
```

### Current Implementation

- All users join a single "default" room
- Each room has its own DrawingState instance
- Room cleanup happens when last user leaves (except default room)
- Foundation for future multi-room expansion

### Future Multi-Room Support

The architecture supports adding:
- Unique room URLs (e.g., `/room/abc123`)
- Room creation API
- Private/public room options
- Room capacity limits
- Room-specific settings

## Performance Decisions

### 1. Event Batching
**Decision**: Send individual drawing events without batching

**Reasoning**: 
- Simpler implementation for first version
- Acceptable latency for small number of users
- Easier to debug and maintain
- Real-time feel is more important than bandwidth

**Trade-off**: Higher network traffic but better code clarity

### 2. Canvas Redrawing Strategy
**Decision**: Full canvas redraw on undo/redo

**Reasoning**:
- Ensures consistency across all clients
- Simpler state management
- Avoids complex layer management
- Correctness over performance

**Trade-off**: Higher CPU usage but guaranteed correctness

### 3. Coordinate Scaling
**Decision**: Send normalized canvas coordinates, not screen coordinates

**Reasoning**:
- Different users may have different screen sizes
- Canvas dimensions may vary
- Ensures drawings appear correctly for all users
- Resolution-independent drawing

### 4. Stroke Segmentation
**Decision**: Break drawings into small line segments

**Reasoning**:
- Smoother rendering on remote clients
- Better real-time visualization
- Handles network latency gracefully
- Progressive rendering

### 5. In-Memory State
**Decision**: Store all state in server memory

**Reasoning**:
- Fastest access for real-time operations
- Simple implementation
- No database complexity
- Suitable for MVP/demo

**Trade-off**: State lost on server restart, not production-ready

## Conflict Resolution

### Simultaneous Drawing
**Problem**: Multiple users drawing at the same time in overlapping areas

**Solution**: Last-write-wins approach
- All strokes are timestamped by order received at server
- No explicit locking mechanism
- Visual feedback through user cursors helps avoid conflicts
- Canvas composite operations handle overlapping naturally

### Race Conditions
**Problem**: Undo/redo requests arriving while drawing is in progress

**Solution**:
- Complete current strokes before processing undo/redo
- Server processes events sequentially
- History updates are atomic operations
- Drawing events and history operations are separate queues

### Network Latency
**Problem**: Delay between user action and remote rendering

**Solution**:
- Immediate local rendering (optimistic UI)
- No waiting for server confirmation
- Cursor tracking provides awareness of other users
- Smooth line interpolation compensates for packet loss
- High-frequency events maintain smooth appearance

### Concurrent Undo Operations
**Problem**: Multiple users pressing undo simultaneously

**Solution**:
- Server processes undo requests in order received
- Each undo removes exactly one stroke
- History state is broadcast after each operation
- Clients always sync to server's state

## State Synchronization

### New User Joining
1. User connects to WebSocket server
2. Server assigns user to default room
3. Server retrieves room's drawing state
4. Server sends complete history array to user
5. Client redraws entire canvas from history
6. User sees current state immediately
7. Other users notified of new user

### User Disconnecting
1. User closes browser or loses connection
2. Server detects disconnection
3. Server removes user from room
4. Server broadcasts updated user list
5. User's strokes remain in history
6. User's cursor removed from other clients
7. Room cleanup if last user (except default)

### Drawing Synchronization
1. User draws line segment locally
2. Segment rendered immediately (optimistic UI)
3. Segment data sent to server
4. Server broadcasts to room members
5. Remote clients render segment
6. On stroke end, server adds to history
7. New users get complete history

## Scalability Considerations

### Current Limitations
- Single server instance
- In-memory state storage
- No horizontal scaling
- Limited to ~50 concurrent users per room
- State lost on restart

### Potential Improvements

#### For Production Deployment:
1. **State Persistence**
   - Redis for distributed state
   - PostgreSQL for drawing history
   - S3 for canvas snapshots

2. **Horizontal Scaling**
   - WebSocket clustering with sticky sessions
   - Room-based sharding
   - Load balancer with Socket.io support

3. **Performance Optimization**
   - Event batching and throttling
   - Canvas state compression
   - Incremental updates instead of full redraws
   - Web Workers for heavy operations

4. **Resource Limits**
   - Maximum strokes per canvas
   - Canvas size restrictions
   - Rate limiting per user
   - Room capacity limits

## Security Considerations

### Current Implementation
- No authentication
- No authorization
- Public access to all canvases
- No input validation
- No rate limiting

### Production Requirements

1. **Authentication & Authorization**
   - User authentication system
   - Room access control
   - Permission-based actions

2. **Input Validation**
   - Coordinate range validation
   - Color format validation
   - Stroke width limits
   - Event rate limiting

3. **XSS Prevention**
   - Sanitize user names
   - Escape displayed content
   - Content Security Policy

4. **DoS Prevention**
   - Rate limiting on drawing events
   - Maximum canvas size
   - Maximum stroke count
   - Connection limits per IP

5. **Data Privacy**
   - HTTPS/WSS in production
   - Room isolation enforcement
   - No cross-room data leakage

## Testing Strategy

### Unit Tests (Recommended)
- DrawingState operations
- RoomManager logic
- Coordinate conversion functions

### Integration Tests (Recommended)
- WebSocket event flow
- Multi-user drawing scenarios
- Undo/redo across users

### Manual Testing
- Open multiple browser windows
- Test all drawing tools
- Verify cursor synchronization
- Test undo/redo extensively
- Monitor browser console for errors
- Check network tab for WebSocket traffic