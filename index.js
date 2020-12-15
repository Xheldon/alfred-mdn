"use strict";

const alfy = require("alfy");
const mdnBase = "https://wiki.developer.mozilla.org/api/v1/search/zh-CN";

alfy.fetch(`${mdnBase}?q=${alfy.input}`, { transform })
    .then(results => {
        const items = (results || []).map(result => {
            const {title, excerpt, url} = result;
            const subtitle = stripHtml(excerpt);

            return {
                title,
                subtitle,
                autoComplete: title,
                arg: url,
                quicklookurl: url
            }
        });

        // No results
        if (items.length === 0 && false) {
            const url = `${mdnBase}?q=${alfy.input}`;

            items.push({
                title: `Show all results for '${alfy.input}'`,
                arg: url,
                quicklookurl: url
            });
        }

        alfy.output(items);
    });

function transform(body) {
    return body.documents;
}

function stripHtml(text) {
    return text.replace(/<[^>]+>/g, '');
}
