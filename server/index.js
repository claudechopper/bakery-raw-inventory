const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const API_SECRET = process.env.API_SECRET || '3zzJMvS72_sjN2oYRGeJhA';

// --- Persistence ---------------------------------------------------------
// Railway: mount a volume at /data so this survives restarts.
// Local dev: writes go to ./data/bakery-raw-state.json
const DATA_DIR   = process.env.DATA_DIR || path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'bakery-raw-state.json');

function loadBakeryRaw() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      console.log('[bakeryRaw] Loaded state from', STATE_FILE);
      return parsed;
    }
  } catch (err) {
    console.error('[bakeryRaw] Load failed, starting fresh:', err.message);
  }
  return { data: null, lastUpdatedBy: null, lastUpdatedAt: null };
}

function saveBakeryRaw() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(bakeryRawStore, null, 2));
  } catch (err) {
    console.error('[bakeryRaw] Save failed:', err.message);
  }
}

let bakeryRawStore = loadBakeryRaw();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve the frontend HTML app from the parent directory
// (index.html lives one level up from server/)
const FRONTEND_HTML = path.join(__dirname, '..', 'index.html');

app.get('/', (req, res) => {
  if (fs.existsSync(FRONTEND_HTML)) {
    return res.sendFile(FRONTEND_HTML);
  }
  // Fallback health check if HTML not found (local dev without frontend)
  res.json({
    status: 'ok',
    service: 'bakery-raw-inventory-api',
    endpoints: ['/bakeryRaw/state'],
    bakeryRaw: {
      hasData: !!bakeryRawStore.data,
      lastUpdatedBy: bakeryRawStore.lastUpdatedBy,
      lastUpdatedAt: bakeryRawStore.lastUpdatedAt,
    },
  });
});

// Health check (explicit, for Railway uptime checks)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'bakery-raw-inventory-api' });
});

app.get('/bakeryRaw/state', (req, res) => {
  if (req.query.secret !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(bakeryRawStore);
});

app.put('/bakeryRaw/state', (req, res) => {
  if (req.query.secret !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid body' });
  }
  const { data, deviceNickname } = req.body;
  if (typeof data === 'undefined') {
    return res.status(400).json({ error: 'Missing "data" field' });
  }
  bakeryRawStore = {
    data,
    lastUpdatedBy: deviceNickname || 'Unknown device',
    lastUpdatedAt: new Date().toISOString(),
  };
  saveBakeryRaw();
  res.json({ ok: true, ...bakeryRawStore });
});

app.listen(PORT, () => {
  console.log(`Bakery Raw Inventory API running on port ${PORT}`);
  console.log(`  /bakeryRaw/state — persisted to ${STATE_FILE}`);
});
