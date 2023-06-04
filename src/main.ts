import { Actor, ProxyConfiguration, log } from 'apify';
import { CheerioCrawler, Dictionary, RequestOptions } from 'crawlee';
import { router } from './routes.js';

// 1. Initialize Apify SDK
await Actor.init();
// 2. Get input
const input: Dictionary | null = await Actor.getInput();

// 3. Adding to queue main ks page to get cookies
const requestQueue = await Actor.openRequestQueue();

// 4. Сheck correctness of input
if (!!input) {
    const projectsToCrawl: RequestOptions[] = input['projectsToCrawl'];

    if (!!projectsToCrawl) {
        const maxRequestRetries: number = input['maxRequestRetries'] ?? 5;

        // 5. Getting proxy URLs and initialize proxy settings
        let proxyUrls: string[] = input['proxyUrls'];
        log.info(`Got ${proxyUrls?.length ?? 0} proxy URLs from input`);

        let proxyConfiguration: ProxyConfiguration | undefined;
        if (!proxyUrls || proxyUrls.length == 0) {
            const dataset = await Actor.openDataset();
            const proxyCrawler = new CheerioCrawler({
                requestHandler: router,
                maxRequestRetries: maxRequestRetries,
            });
            await proxyCrawler.run(['https://openproxy.space/list/http']);

            if ((await dataset.getData()).items.length > 0) {
                proxyUrls = await dataset.map<string>((value) => value.url);
                log.info(`Crawled ${proxyUrls.length} proxy URLs`);
            }
            await dataset.drop();
        }
        proxyConfiguration = await Actor.createProxyConfiguration({
            useApifyProxy: false,
            proxyUrls: proxyUrls,
        });

        requestQueue.addRequests(projectsToCrawl);
        // 6. Initialize crawler
        const crawler = new CheerioCrawler({
            additionalMimeTypes: ['application/atom+xml'],
            requestQueue: requestQueue,
            requestHandler: router,
            maxRequestRetries: maxRequestRetries,
            maxConcurrency: 1,
            useSessionPool: true,
            proxyConfiguration: proxyConfiguration,
        });
        // 7. Start crawl
        await crawler.run();
    } else {
        log.info('Incorrect input format. Actor will be stopped.');
    }
} else {
    log.info('There are no links in the input. Actor will be stopped.');
}

// 8. Exit successfully
await Actor.exit();
