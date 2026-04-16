const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const BASE_URL = 'https://writerity.com';
const OUTPUT_DIR = path.join(__dirname, 'public');
const VISITED_URLS = new Set();
const QUEUE = [BASE_URL + '/'];

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function normalizeUrl(urlString) {
  try {
    const url = new URL(urlString, BASE_URL);
    if (!url.href.startsWith(BASE_URL)) {
      return null;
    }
    let normalized = url.href.split('#')[0];
    return normalized;
  } catch (e) {
    return null;
  }
}

function getFilePathFromUrl(urlString) {
  const url = new URL(urlString);
  let pathname = url.pathname;
  
  if (pathname.endsWith('/')) {
    pathname = pathname + 'index.html';
  } else if (!path.extname(pathname)) {
    pathname = pathname + '/index.html';
  }

  const filePath = path.join(OUTPUT_DIR, pathname);
  return filePath;
}

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function rewriteUrls(html, pageUrl) {
  const $ = cheerio.load(html);

  $('a[href]').each((i, el) => {
    let href = $(el).attr('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
      return;
    }

    try {
      if (href.startsWith(BASE_URL)) {
        href = href.substring(BASE_URL.length);
      } else if (href.startsWith('http://') || href.startsWith('https://')) {
        return;
      }

      const absoluteUrl = new URL(href, pageUrl).href;
      if (!absoluteUrl.startsWith(BASE_URL)) {
        return;
      }

      const fromFile = getFilePathFromUrl(pageUrl);
      const toFile = getFilePathFromUrl(absoluteUrl);
      const relativePath = path.relative(path.dirname(fromFile), toFile)
        .replace(/\\/g, '/');
      
      $(el).attr('href', relativePath);
    } catch (e) {
      // Keep original
    }
  });

  return $.html();
}

async function crawlPage(urlString) {
  const normalized = normalizeUrl(urlString);
  if (!normalized || VISITED_URLS.has(normalized)) {
    return;
  }

  VISITED_URLS.add(normalized);
  console.log(`Crawling: ${normalized}`);

  try {
    const response = await axios.get(normalized, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (response.status !== 200) {
      console.log(`  Status ${response.status}`);
      return;
    }

    if (!response.headers['content-type'] || !response.headers['content-type'].includes('text/html')) {
      console.log(`  Not HTML`);
      return;
    }

    let html = response.data;
    
    // Extract links BEFORE rewriting URLs
    const $ = cheerio.load(html);
    let newCount = 0;
    
    $('a[href]').each((i, el) => {
      let href = $(el).attr('href');
      if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
        try {
          const fullUrl = new URL(href, normalized).href;
          const normalizedUrl = normalizeUrl(fullUrl);
          
          if (normalizedUrl && !VISITED_URLS.has(normalizedUrl) && !QUEUE.includes(normalizedUrl)) {
            QUEUE.push(normalizedUrl);
            newCount++;
          }
        } catch (e) {
          // Skip
        }
      }
    });
    
    // NOW rewrite URLs for offline use
    html = await rewriteUrls(html, normalized);

    const filePath = getFilePathFromUrl(normalized);
    ensureDirectoryExists(filePath);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`  Saved to: ${path.relative(OUTPUT_DIR, filePath)}`);

    if (newCount > 0) {
      console.log(`  Found ${newCount} new links`);
    }

  } catch (error) {
    console.error(`  Error: ${error.message}`);
  }
}

async function main() {
  console.log(`\nCrawling: ${BASE_URL}\nSaving to: ${OUTPUT_DIR}\n`);
  
  let count = 0;
  const MAX = 300;

  while (QUEUE.length > 0 && count < MAX) {
    const url = QUEUE.shift();
    await crawlPage(url);
    count++;
    
    if (count % 30 === 0) {
      console.log(`\n[${count}/${MAX}] Pages: ${VISITED_URLS.size}, Queue: ${QUEUE.length}\n`);
    }
    
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`COMPLETE: ${VISITED_URLS.size} pages saved`);
  console.log(`Serve with: npx http-server public`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch(console.error);
