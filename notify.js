/**
 * Sends a message to the configured Telegram chats.
 *
 * Reads the bot token and chat ids from telegram.json in this directory.
 * Can also be run directly to send a test message:
 *   node notify.js "Test message"
 */

const sendTelegram = async (text) => {
  // Loaded here so that a missing config only breaks alerts, not reader.js
  let config;
  try {
    config = require('./telegram.json');
  } catch (error) {
    console.error('Error reading telegram.json:', error.message);
    return false;
  }

  const results = await Promise.allSettled(config.chatIds.map(async (chatId) => {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      throw new Error(`chat ${chatId}: ${res.status} ${await res.text()}`);
    }
  }));

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('Error sending Telegram message:', result.reason.message);
    }
  }

  // Count as delivered if at least one recipient got the message
  return results.some((result) => result.status === 'fulfilled');
};

module.exports = { sendTelegram };

if (require.main === module) {
  sendTelegram(process.argv[2] || 'Test message from the temperature monitor')
    .then((ok) => process.exit(ok ? 0 : 1));
}
