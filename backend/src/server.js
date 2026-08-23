// Entry point. Boots the HTTP server.
import { createApp } from './app.js';
import { env, isSupabaseConfigured } from './config/index.js';

const app = createApp();

app.listen(env.PORT, () => {
  const mode = isSupabaseConfigured() ? 'supabase' : 'seed mode';
  console.log(
    `destiny-backend listening on :${env.PORT} (${mode}, cors: ${env.ALLOWED_ORIGIN})`,
  );
});
