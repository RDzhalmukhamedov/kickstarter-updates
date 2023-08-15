import { Actor } from 'apify';
import { CheerioCrawlingContext, createCheerioRouter } from 'crawlee';
import * as xml2js from 'xml2js';
import { CrawlSelectors } from './utils/crawl-selectors.const.js';
import { Helpers } from './utils/helpers.class.js';
import { ProjectInfo } from './utils/project-info.interface.js';
import { ProjectStatus } from './utils/project-status.enum.js';

export const router = createCheerioRouter();

router.addDefaultHandler(kickstarterHandler);
router.addHandler('ks', kickstarterHandler);
router.addHandler('atom', kickstarterAtomHandler);

async function kickstarterHandler({
    $,
    request,
    log,
    crawler,
    response,
    session,
}: CheerioCrawlingContext): Promise<void> {
    log.info('Started crawl for kickstarter link', { url: request.loadedUrl });

    // 1. Set cookies and csrf token to prevent blocking
    if (!!session) {
        session.setCookiesFromResponse(response);
        session.userData = {
            csrf: $(CrawlSelectors.Ks.CsrfToken.Selector).attr(CrawlSelectors.Ks.CsrfToken.Attr),
        };
    }

    const crawledUpdate: ProjectInfo = request.userData.project;
    const updatesCount = Number.parseInt(
        $(CrawlSelectors.Ks.UpdatesCount.Element).attr(CrawlSelectors.Ks.UpdatesCount.Attr) ?? '0',
    );

    // 2. Check if project not tracked yet or has new posts/updates
    if (crawledUpdate.Status == ProjectStatus.NotTracked || crawledUpdate.UpdatesCount < updatesCount) {
        // 3. Updating previous values to current and getting new values from project page
        crawledUpdate.PrevUpdatesCount = crawledUpdate.UpdatesCount;
        crawledUpdate.UpdatesCount = updatesCount;
        crawledUpdate.ProjectName =
            $(CrawlSelectors.Ks.ProjectName.Element).attr(CrawlSelectors.Ks.ProjectName.Attr) ?? 'Unknown';
        crawledUpdate.PrevStatus = crawledUpdate.Status;
        crawledUpdate.Status = Helpers.parseStatusFromKs(
            $(CrawlSelectors.Ks.Status.Element).attr(CrawlSelectors.Ks.Status.Attr),
        );

        // 4. If there are no updates in the project, we can't get a link to the latest update, so leave it as-is
        if (updatesCount == 0) {
            await Actor.pushData(crawledUpdate);
            return;
        }

        // 5. Trying to crawl last update link and title from atom feed
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
        crawledUpdate.Link = updateLink;
        crawledUpdate.LastUpdateId = Number.parseInt(updateLink.split('/').pop()!);
        crawledUpdate.LastUpdateTitle = lastUpdateTitle;
    } else {
        log.info('There are no available links in feed', { url: request.loadedUrl });
    }
    await Actor.pushData(crawledUpdate);
}
