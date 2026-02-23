const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/pages', require('./routes/pages'));

app.get('/', (req, res) => res.send('Notion CMS API running ✅'));
app.use('/api/workspaces', require('./routes/workspaces'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));