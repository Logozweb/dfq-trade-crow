const path = require('path');
const fs = require('fs');
const express = require('express');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Determine if Vite dist directory exists
const distDir = path.join(__dirname, '..', 'dist');
const rootDir = path.join(__dirname, '..');

if (fs.existsSync(distDir)) {
  console.log('[Server] Serving production Vite build from dist/');
  app.use(express.static(distDir));
  app.use('/assets', express.static(path.join(rootDir, 'assets')));
} else {
  console.log('[Server] Serving static files from workspace root');
  app.use(express.static(rootDir));
}

// Rewrites for legacy PHP URLs to modern HTML endpoints
app.get('/trader.php', (req, res) => {
  res.redirect(`/trader.html?id=${req.query.id || ''}`);
});

app.get('/ticket.php', (req, res) => {
  res.redirect(`/ticket.html?id=${req.query.id || ''}`);
});

app.get('/admin.php', (req, res) => {
  res.redirect('/admin.html');
});

// Fallback for direct HTML navigation
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/assets')) {
    return next();
  }
  const requestedFile = path.join(fs.existsSync(distDir) ? distDir : rootDir, req.path);
  if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
    return res.sendFile(requestedFile);
  }
  res.sendFile(path.join(fs.existsSync(distDir) ? distDir : rootDir, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 DFQ Trade Crow Standalone Server is running!`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/items`);
  console.log(`====================================================`);
});

module.exports = server;
