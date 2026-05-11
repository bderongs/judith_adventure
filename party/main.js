export default {
  onConnect(conn, room) {
    console.log(`[PK] Player ${conn.id} connected to room ${room.id}`);
  },
  onMessage(message, sender, room) {
    console.log(`[PK] Received message from ${sender.id}`);
    // Relay to everyone else
    room.broadcast(message, [sender.id]);
  },
  onClose(conn, room) {
    console.log(`[PK] Player ${conn.id} disconnected`);
    room.broadcast(JSON.stringify({ type: "remove", id: conn.id }));
  }
};
