export const CrawlSelectors = {
    Ks: {
        CsrfToken: {
            Selector: 'meta[name="csrf-token"]',
            Attr: 'content',
        },
        UpdatesCount: {
            Element: '#updates-emoji',
            Attr: 'emoji-data',
        },
        ProjectName: {
            Element: 'meta[property="og:title"]',
            Attr: 'content',
        },
        Status: {
            Element: 'section.js-project-description-content',
            Attr: 'data-project-state',
        },
        LastUpdateLink: {
            Element: 'a#last-updated-post-link',
            Attr: 'href',
        },
        AtomLink: {
            Element: 'link[type="application/atom+xml"]',
            Attr: 'href',
        },
    },
} as const;
