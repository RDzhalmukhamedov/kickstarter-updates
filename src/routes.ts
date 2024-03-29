import { Actor } from 'apify';
import { CheerioCrawlingContext, createCheerioRouter } from 'crawlee';
import * as xml2js from 'xml2js';
import { CrawlSelectors } from './utils/crawl-selectors.const.js';
import { Helpers } from './utils/helpers.class.js';
import { ProjectInfo } from './utils/project-info.interface.js';
import { ProjectStatus } from './utils/project-status.enum.js';

export const router = createCheerioRouter();

router.addDefaultHandler(proxyHandler);
router.addHandler('ks', kickstarterHandler);
router.addHandler('atom', kickstarterAtomHandler);

async function proxyHandler({ log, sendRequest }: CheerioCrawlingContext): Promise<void> {
    log.info('Started crawl for list of proxies link');
    const res = await sendRequest();
    const ips = res.body.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\:\d{1,4}\b/g);
    if (!!ips) {
        for (const ip of ips) {
            await Actor.pushData({ url: `http://${ip}` });
        }
    } else {
        log.info('No proxy links found');
    }
}

async function kickstarterHandler({ $, request, log, crawler }: CheerioCrawlingContext): Promise<void> {
    log.info('Started crawl for kickstarter link', { url: request.loadedUrl });

    const crawledUpdate: ProjectInfo = request.userData.project;
    const updatesCount = Number.parseInt(
        $(CrawlSelectors.Ks.UpdatesCount.Element).attr(CrawlSelectors.Ks.UpdatesCount.Attr) ?? '0',
    );

    // 1. Check if project not tracked yet or has new posts/updates
    if (crawledUpdate.status == ProjectStatus.NotTracked || crawledUpdate.updatesCount < updatesCount) {
        // 2. Updating previous values to current and getting new values from project page
        crawledUpdate.prevUpdatesCount = crawledUpdate.updatesCount;
        crawledUpdate.updatesCount = updatesCount;
        crawledUpdate.projectName =
            $(CrawlSelectors.Ks.ProjectName.Element).attr(CrawlSelectors.Ks.ProjectName.Attr) ?? 'Unknown';
        crawledUpdate.prevStatus = crawledUpdate.status;
        crawledUpdate.status = Helpers.parseStatusFromKs(
            $(CrawlSelectors.Ks.Status.Element).attr(CrawlSelectors.Ks.Status.Attr),
        );

        // 3. If there are no updates in the project, we can't get a link to the latest update, so leave it as-is
        if (updatesCount == 0) {
            await Actor.pushData(crawledUpdate);
            return;
        }

        // 4. Trying to crawl last update link and title from atom feed
        const atomLink = $(CrawlSelectors.Ks.AtomLink.Element).attr(CrawlSelectors.Ks.AtomLink.Attr);
        if (!!atomLink) {
            await crawler.addRequests([
                {
                    url: atomLink,
                    label: 'atom',
                    userData: { project: crawledUpdate },
                },
            ]);
        }
    }
}

async function kickstarterAtomHandler({ request, log, body }: CheerioCrawlingContext): Promise<void> {
    log.info('Started crawl atom feed for kickstarter link', { url: request.loadedUrl });

    // 1. Get object with already known project info
    const crawledUpdate: ProjectInfo = request.userData.project;
    // 2. Parsing xml feed
    const feed = body.toString('utf8');
    const parser = new xml2js.Parser();
    const xmlData = await parser.parseStringPromise(feed);
    // 3. Getting link to last update
    const updateLink: string = xmlData.feed.entry[0].link[0].$.href;
    if (!!updateLink) {
        // 4. Getting last update title and fill project info
        const lastUpdateTitle: string = xmlData.feed.entry[0].title[0];
        crawledUpdate.link = updateLink;
        crawledUpdate.lastUpdateId = Number.parseInt(updateLink.split('/').pop()!);
        crawledUpdate.lastUpdateTitle = lastUpdateTitle;
    } else {
        log.info('There are no available links in feed', { url: request.loadedUrl });
    }
    await Actor.pushData(crawledUpdate);
}
