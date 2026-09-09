export async function GET() {
  await fetch(
    `https://graph.facebook.com/v26.0/${process.env.FB_PAGE_ID}` +
    `?fields=id&access_token=${process.env.FB_PAGE_ACCESS_TOKEN}`
  );
  return new Response("ok", { status: 200 });
}