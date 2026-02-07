export const DEV_STATUS = Number(process.env.VITE_DEV_STATUS) as 1 | 2 | 3;

const LOCAL_IP = process.env.VITE_LAN_IP;

export const HTTP_ENDPOINT = (() => {
	switch (DEV_STATUS) {
		case 1:
			return 'http://localhost:5173';
		case 2:
			return `http://${LOCAL_IP}:5173`;
		case 3:
			return 'https://yourdomain.com';
	}
})();

export const SOCKET_ENDPOINT = (() => {
	switch (DEV_STATUS) {
		case 1:
			return 'http://localhost:3001';
		case 2:
			return `http://${LOCAL_IP}:3001`;
		case 3:
			return 'https://socket.yourdomain.com';
	}
})();
