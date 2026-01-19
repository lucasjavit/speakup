const { PeerServer } = require('peer');

const peerServer = PeerServer({
  port: 9000,
  path: '/peerjs',
  allow_discovery: true,
  proxied: true,
});

peerServer.on('connection', (client) => {
  console.log(`Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`Client disconnected: ${client.getId()}`);
});

console.log('PeerJS server running on port 9000');
console.log('Clients should connect to: ws://localhost:9000/peerjs');
