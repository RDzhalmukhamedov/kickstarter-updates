export const CrawlSelectors = {
    Ks: {
        CsrfToken: {
            Selector: 'meta[name="csrf-token"]',
            Attr: 'content',
        },
        UpdatesCount: {
            Selector: '#updates-emoji',
            Attr: 'emoji-data',
        },
        ProjectName: {
            Selector: 'meta[property="og:title"]',
            Attr: 'content',
        },
        Status: {
            Selector: 'section.js-project-description-content',
            Attr: 'data-project-state',
        },
        LastUpdateLink: {
            Selector: 'a#last-updated-post-link',
            Attr: 'href',
        },
        AtomLink: {
            Selector: 'link[type="application/atom+xml"]',
            Attr: 'href',
        },
    },
} as const;
