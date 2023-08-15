import { Actor, log } from 'apify';
import { CheerioCrawler, Dictionary, RequestOptions } from 'crawlee';
import { router } from './routes.js';

// 1. Initialize Apify SDK
await Actor.init();
// 2. Get input
const input: Dictionary | null = await Actor.getInput();

// 3. Initializing of request queue
const requestQueue = await Actor.openRequestQueue();

// 4. Сheck correctness of input
if (!!input) {
    const projectsToCrawl: RequestOptions[] = input['projectsToCrawl'];

    if (!!projectsToCrawl) {
        const maxRequestRetries: number = input['maxRequestRetries'] ?? 10;

        requestQueue.addRequests(projectsToCrawl);
        // 5. Initialize crawler
        const crawler = new CheerioCrawler({
            additionalMimeTypes: ['application/atom+xml'],
            requestQueue: requestQueue,
            requestHandler: router,
            maxRequestRetries: maxRequestRetries,
            maxConcurrency: 1,
            useSessionPool: true,
            sessionPoolOptions: {
                maxPoolSize: 1,
            },
            preNavigationHooks: [
                async (crawlingContext) => {
                    if (!!crawlingContext.session) {
                        const { request } = crawlingContext;
                        request.headers = { 'x-csrf-token': crawlingContext.session.userData.csrf };
                    }
                },
            ],
        });
        // 6. Start crawl
        await crawler.run();
    } else {
        log.info('Incorrect input format. Actor will be stopped.');
    }
} else {
    log.info('There are no links in the input. Actor will be stopped.');
}

// 8. Exit successfully
await Actor.exit();
