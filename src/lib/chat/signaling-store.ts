// In-memory signaling store for WebRTC video calls
// Works because the app runs as a single Node.js process in Docker

interface SignalEntry {
  type: 'offer' | 'answer' | 'ice';
  data: any;
  role: 'agent' | 'customer';
  timestamp: number;
}

interface RoomSignals {
  entries: SignalEntry[];
  createdAt: number;
}

// Use globalThis to survive hot reloads in dev
const globalStore = globalThis as any;
if (!globalStore.__signalingRooms) {
  globalStore.__signalingRooms = new Map<string, RoomSignals>();
}

const rooms: Map<string, RoomSignals> = globalStore.__signalingRooms;

// Clean up rooms older than 1 hour
function cleanup() {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    if (now - room.createdAt > 3600000) {
      rooms.delete(roomId);
    }
  }
}

export function addSignal(roomId: string, entry: Omit<SignalEntry, 'timestamp'>) {
  cleanup();
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { entries: [], createdAt: Date.now() });
  }
  const room = rooms.get(roomId)!;
  room.entries.push({ ...entry, timestamp: Date.now() });
}

// Get signals for the OTHER role (agent gets customer's signals, customer gets agent's signals)
export function getSignals(roomId: string, forRole: 'agent' | 'customer', afterTimestamp = 0): SignalEntry[] {
  const room = rooms.get(roomId);
  if (!room) return [];
  const fromRole = forRole === 'agent' ? 'customer' : 'agent';
  return room.entries.filter(e => e.role === fromRole && e.timestamp > afterTimestamp);
}

export function clearRoom(roomId: string) {
  rooms.delete(roomId);
}
