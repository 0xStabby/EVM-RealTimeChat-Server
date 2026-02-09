import 'dotenv/config';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

// Websocket Server Setup
const httpServer = createServer();

const io = new Server(httpServer, {
	cors: {
		origin: [
			'http://localhost:5173',
			'https://evm-realtimechat-server.onrender.com'
		],
		credentials: true
	}
});

/**
 * Presence
 * address -> active socket IDs
 * Source of truth for online/offline
 */
const addressToSockets = new Map<string, Set<string>>();

io.on('connection', (socket: Socket) => {
	const addressRaw = socket.handshake.auth.address;
	if (!addressRaw) return socket.disconnect(true);

	const address = addressRaw.toLowerCase();
	socket.data.address = address;

	// -------------------------
	// PRESENCE REGISTER
	// -------------------------
	let sockets = addressToSockets.get(address);
	const isFirstConnection = !sockets;

	if (!sockets) {
		sockets = new Set();
		addressToSockets.set(address, sockets);
	}

	sockets.add(socket.id);

	if (isFirstConnection) {
		console.log('USER ONLINE:', address);
		socket.broadcast.emit('presence:online', { address });
	}

	// snapshot to newly connected client
	socket.emit('presence:snapshot', {
		users: Array.from(addressToSockets.keys()).map((address) => ({
			address,
			online: true
		}))
	});

	socket.on('dm:send', ({ to, body }) => {
		const from = socket.data.address;
		if (!to || !body) return;

		const msg = {
			from,
			to,
			body,
			ts: Date.now()
		};

		// send to recipient sockets
		const recipientSockets = addressToSockets.get(to.toLowerCase());
		if (recipientSockets) {
			for (const id of recipientSockets) {
				io.to(id).emit('dm:message', msg);
			}
		}

		// echo back to sender
		socket.emit('dm:message', msg);
	});

	// -------------------------
	// DISCONNECT
	// -------------------------
	socket.on('disconnect', () => {
		const sockets = addressToSockets.get(address);
		if (!sockets) return;

		sockets.delete(socket.id);

		if (sockets.size === 0) {
			addressToSockets.delete(address);
			console.log('USER OFFLINE:', address);
			io.emit('presence:offline', { address });
		}
	});
});

httpServer.listen(10000, '0.0.0.0', () => {
	console.log(`evm-realtimechat-server started`);
});
