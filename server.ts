import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import yts from 'yt-search';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Routes
  app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    try {
      const r = await yts(query as string);
      const videos = r.videos.slice(0, 20);
      
      const items = videos.map(video => {
        return {
          id: video.videoId,
          url: video.url,
          title: video.title,
          thumbnail: video.thumbnail,
          duration: video.seconds
        };
      });

      res.json({ items });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to fetch search results' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
