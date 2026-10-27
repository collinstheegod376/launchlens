import 'dotenv/config';
import http from 'http';
import { bot } from './bot';

const ASCII_BANNER = `
======================================================================
    __                               __    __                    
   / /   ____ ___  ______  _____/ /_  / /   ___  ____  _____
  / /   / __ \`/ / / / __ \\/ ___/ __ \\/ /   / _ \\/ __ \\/ ___/
 / /___/ /_/ / /_/ / / / / /__/ / / / /___/  __/ / / (__  ) 
/_____/\\__,_/\\__,_/_/ /_/\\___/_/ /_/_____/\\___/_/ /_/____/  
              SOLANA TOKEN RISK INTELLIGENCE
                  Telegram Bot Runner
======================================================================
`;

async function main() {
  console.log(ASCII_BANNER);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'placeholder' || token.trim() === '') {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN is not configured in environment!');
    console.warn('👉 Please set TELEGRAM_BOT_TOKEN to a valid token from @BotFather.');
    console.warn('Exiting runner...');
    process.exit(1);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://launchlens-delta.vercel.app';
  console.log(`🌐 Base App URL: ${appUrl}`);

  // Optional HTTP health-check server for Render Free Web Service deployment
  const port = process.env.PORT || 10000;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'LaunchLens Telegram Bot', time: new Date().toISOString() }));
  });

  server.listen(port, () => {
    console.log(`📡 Health-check server listening on port ${port} (Render ready)`);
  });

  // Ensure any previous webhooks are cleared so long-polling works smoothly
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: false });
    console.log('🔄 Telegram webhook cleared. Ready for polling.');
  } catch (e: any) {
    console.warn('Notice: Could not reset webhook (proceeding with poll):', e?.message || e);
  }

  console.log('⏳ Starting Telegram long-polling...');

  // Start polling updates from Telegram
  bot.start({
    onStart: (botInfo) => {
      console.log(`\n✅ Bot connected successfully!`);
      console.log(`🤖 Handle: @${botInfo.username} (ID: ${botInfo.id})`);
      console.log(`🚀 LaunchLens Telegram Bot is active and listening for messages & /scan commands!\n`);
    },
  });

  // Graceful shutdown handling
  const handleExit = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down LaunchLens Telegram Bot...`);
    try {
      server.close();
      await bot.stop();
      console.log('👋 Bot stopped cleanly.');
    } catch (err) {
      console.error('Error during shutdown:', err);
    }
    process.exit(0);
  };

  process.once('SIGINT', () => handleExit('SIGINT'));
  process.once('SIGTERM', () => handleExit('SIGTERM'));
}

main().catch((err) => {
  console.error('❌ Fatal error in bot runner:', err);
  process.exit(1);
});
