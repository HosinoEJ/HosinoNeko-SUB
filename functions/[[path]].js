// Cloudflare Pages Functions entry point
import Worker from '../src/index.js';

export async function onRequest(context) {
  return Worker.fetch(context.request, context.env, context);
}

export async function onSchedule(event, env, ctx) {
  return Worker.scheduled(event, env, ctx);
}
