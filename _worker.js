// Cloudflare Pages Functions entry point
import Worker from './src/index.js';

export default {
    fetch: Worker.fetch,
    scheduled: Worker.scheduled
};
