const express = require('express');
const path    = require('path');
const app     = express();

const PORT = process.env.PORT || 3000;

// Serve assets estáticos em /public
app.use(express.static(path.join(__dirname, 'public')));

// Todas as rotas retornam index.html
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.listen(PORT, () =>
  console.log(`🚀 97player rodando em http://localhost:${PORT}`)
);
