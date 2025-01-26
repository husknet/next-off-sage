import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = '7322193975:AAHuE-RMKOah6-b9LZYMJ8CFnS84xdc_KvM'; // Replace with your bot token
const TELEGRAM_CHAT_ID = '-1002370596410'; // Replace with your Telegram group chat ID

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow public assets and the denied page to load without bot detection
  if (pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname === '/denied') {
    return NextResponse.next();
  }

  // Get IP address and User-Agent from the request
  const ip = req.ip || req.headers.get('x-forwarded-for') || '0.0.0.0';
  const userAgent = req.headers.get('user-agent') || '';

  try {
    // Call the hosted Vercel API to detect bots
    const response = await fetch('https://rail-bot-production.up.railway.app/api/detect_bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, user_agent: userAgent }),
    });

    const data = await response.json();

    if (data.is_bot) {
      // If the API detects a bot, send a Telegram alert
      const isp = data.details.scraper_isp || 'Unknown ISP';
      const message = `
🚨 <b>Bot Blocked</b>
🕵️‍♂️ <b>Details:</b>
- IP: ${ip}
- ISP: ${isp}
- User-Agent: ${userAgent}
      `;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      // Redirect the bot to the denied page
      const deniedUrl = req.nextUrl.clone();
      deniedUrl.pathname = '/denied';
      return NextResponse.redirect(deniedUrl);
    }
  } catch (error) {
    console.error('Error in bot detection or Telegram alert:', error);
    // Allow requests to proceed in case of API or Telegram failure
  }

  // Allow legitimate requests to proceed
  return NextResponse.next();
}

// Configure middleware to run only on specific routes
export const config = {
  matcher: ['/'], // Apply middleware only to the root path (login page)
};
