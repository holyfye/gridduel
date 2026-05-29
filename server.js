/* =====================================================================
   Grid Duel — Web App Server (game + connection signaling in one)
   - Serves the game at  /            (the link you share with friends)
   - Runs PeerJS signaling at /peerjs  (two-device sync, no public broker)
   One deploy, one URL. Players just open the link; nothing to configure.
   ===================================================================== */

const express = require('express');
const path = require('path');
const { ExpressPeerServer } = require('peer');

const app = express();
const PORT = process.env.PORT || 8080;

// --- Serve the game (static files from /public) ---
app.use(express.static(path.join(__dirname, 'public'), {
  // images/assets can cache; index stays fresh so updates show up
  setHeaders: (res, p) => { if (p.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache'); }
}));

app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

const server = app.listen(PORT, () => {
  console.log('Grid Duel web app listening on port ' + PORT);
});

// --- Connection signaling at /peerjs ---
const peerServer = ExpressPeerServer(server, {
  path: '/',
  proxied: true,
  allow_discovery: false,
});
app.use('/peerjs', peerServer);

peerServer.on('connection', (c) => console.log('peer connected:', c.getId()));
peerServer.on('disconnect', (c) => console.log('peer left:', c.getId()));

// SPA-ish fallback: anything else returns the game
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
