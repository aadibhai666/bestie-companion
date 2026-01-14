export default {
  async fetch(request, env, ctx) {
    return new Response("Bestie Companion Worker is live ✅", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};