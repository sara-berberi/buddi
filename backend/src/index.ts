import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { errorMiddleware } from './lib/http.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { friendshipsRouter } from './routes/friendships.js';
import { dailyRouter } from './routes/daily.js';
import { questsRouter } from './routes/quests.js';
import { postsRouter } from './routes/posts.js';
import { dmRouter } from './routes/dm.js';
import { accountRouter } from './routes/account.js';
import { coinsRouter } from './routes/coins.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'buddi-backend', env: config.nodeEnv });
});

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/friendships', friendshipsRouter);
app.use('/daily', dailyRouter);
app.use('/quests', questsRouter);
app.use('/posts', postsRouter);
app.use('/dm', dmRouter);
app.use('/account', accountRouter);
app.use('/coins', coinsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorMiddleware);

// Bind 0.0.0.0 so Railway's proxy can reach the container (localhost-only won't work).
app.listen(config.port, '0.0.0.0', () => {
  console.log(`[buddi] backend listening on port ${config.port} (${config.nodeEnv})`);
});
