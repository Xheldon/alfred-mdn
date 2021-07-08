"use strict";

const alfy = require("alfy");
const tunnel = require('tunnel');
const mdnApiBase = 'https://wiki.developer.mozilla.org/api/v1/search/zh-CN';
const mdnApiUSBase = 'https://wiki.developer.mozilla.org/api/v1/search/en-US';
const mdnDocsBase = 'https://developer.mozilla.org';

let input = alfy.input.trim();
let page = 1;
let query = '';


function setByPair(pair) {
    // Note: 不确定 当前版本的 node 是否支持数组解构，先保险写法
    let key = pair[0];
    let value = pair[1];
    if (value === 'dft') {
        alfy.config.delete(key);
        // Note: node 版本可能模板字符串不支持
        alfy.output([{
            title: `${key} 参数重置成功！`,
            subtitle: '请重新尝试搜索'
        }]);
        return;
    } else {
        alfy.config.set(key, value);
        alfy.output([{
            title: `${key} 参数设置成功！`,
            subtitle: '请重新尝试搜索'
        }]);
        return;
    }
}

let arr = input.split(' ').map(function(i){return i.trim();}).filter(Boolean);

// Note: for 里面 return 无效，这个 alfy 写的不咋地啊，有空改造下
if (input.includes('--')) {
    // Note: 存在设置项
    for (let k in arr) {
        let item = arr[k].trim();
        if (item.startsWith('--')) {
            let pair = item.slice(2).split('=');
            if (pair.length !== 2) {
                alfy.output([{
                    title: 'Error！',
                    subtitle: '部分或全部参数非法，请参照 README 设置',
                    quicklookurl: 'https://github.com/Xheldon/alfred-mdn-cn/blob/master/README.md'
                }]);
                return;
            } else {
                return setByPair(pair);
            }
        }
    }
    return;
} else {
    for (let k in arr) {
        let item = arr[k].trim();
        if (k === '0') {
            query = item;
        } else if (!Number.isNaN(item)){
            page = Number(item);
        }
    }
}



let queryUrl = `${mdnApiBase}?q=${query}&size=${alfy.config.get('s') || 10}&page=${page}`

alfy.fetch(queryUrl, Object.assign({
    transform: ({ documents }) => documents,
}, alfy.config.get('p') ? {
    agent: {
            https: tunnel.httpsOverHttp({
                proxy: {
                    host: '127.0.0.1',
                    port: alfy.config.get('p'),
                    headers: {
                        ':authority': 'developer.mozilla.org',
                        ':method': 'GET',
                        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                        'accept-encoding': 'gzip, deflate, br',
                        'cache-control': 'no-cache',
                        ':path': `/api/v1/search/zh-CN?q=${query}&size=${alfy.config.get('s') || 10}&page=${page}`,
                        ':scheme:': 'https',
                        'sec-ch-ua': ' Not;A Brand;v="99", "Google Chrome";v="91", "Chromium";v="91"',
                        'sec-fetch-dest': 'document',
                        'sec-fetch-mode': 'navigate',
                        'sec-fetch-site': 'none',
                        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
                    }
                }
            })
        }
} : {})).then(results => {
    // Note: 这里不能 console.log 任何内容否则报错
    const items = (results || []).sort((a, b) => {
        let c = Number(a.popularity);
        let d = Number(b.popularity);
        if (!Number.isNaN(c) && !Number.isNaN(d)) {
            return d - c;
        }
        return 0;
    }).map(result => {
        const {title, highlight, summary, mdn_url} = result;
        if (summary.startsWith('«')) {
            return false;
        }
        // Note: 不从 body 上找，从 summary 上即可了
        // const excerpt = highlight && highlight.body && highlight.body.length > 0 ? highlight.body[0] : "";
        // const subtitle = stripHtml(excerpt);
        let subtitle = summary;

        if (subtitle.startsWith(title)) {
            subtitle = '该' + subtitle.slice(title.length).trim();
        }

        const url = `${mdnDocsBase}${mdn_url}`;

        return {
            title,
            subtitle,
            autoComplete: title,
            arg: url,
            quicklookurl: url
        }
    }).filter(Boolean);

    // No results
    if (items.length === 0) {
        const url = `${mdnApiUSBase}?q=${query}`;

        items.push({
            title: `显示 '${query}' 的所有结果...`,
            arg: url,
            quicklookurl: url
        });
    }

    alfy.output(items);
});

