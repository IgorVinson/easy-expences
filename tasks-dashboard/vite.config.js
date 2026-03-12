import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'db.json');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'json-db-plugin',
      configureServer(server) {
        server.middlewares.use('/api/db', (req, res, next) => {
          if (req.method === 'GET') {
            fs.readFile(dbPath, 'utf-8', (err, data) => {
              res.setHeader('Content-Type', 'application/json');
              if (err) {
                res.end(JSON.stringify({ checked: {}, collapsed: {} }));
              } else {
                res.end(data || JSON.stringify({ checked: {}, collapsed: {} }));
              }
            });
            return;
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              fs.writeFile(dbPath, body, (err) => {
                res.setHeader('Content-Type', 'application/json');
                if (err) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Failed to write to db.json' }));
                } else {
                  res.end(JSON.stringify({ success: true }));
                }
              });
            });
            return;
          }
          next();
        });
      }
    }
  ],
});
