#!/usr/bin/env node
/**
 * Crawl and Generate Static Content from Target URL
 * Usage: node crawl-and-generate.js <target-url>
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const TARGET_URL = process.argv[2] || process.env.TARGET_URL;
const BASE_DIR = process.cwd();
const OUTPUT_DIR = path.join(BASE_DIR, 'public');
const VISITED_URLS = new Set();
const QUEUE = [];
const MAX_PAGES = 100;
const TIMEOUT = 10000;

if (!TARGET_URL) {
  console.error('❌ Error: Target URL is required');
  console.error('Usage: node crawl-and-generate.js <target-url>');
  process.exit(1);
}

// Initialize output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`🚀 Starting crawl for: ${TARGET_URL}`);
console.log(`📁 Output directory: ${OUTPUT_DIR}`);

function normalizeUrl(urlString) {
  try {
    const url = new URL(urlString, TARGET_URL);
    const target = new URL(TARGET_URL);
    
    // Only crawl same domain
    if (url.hostname !== target.hostname) {
      return null;
    }
    
    // Remove hash
    let normalized = url.href.split('#')[0];
    
    // Remove query params except for pagination
    if (!normalized.includes('page=')) {
      normalized = normalized.split('?')[0];
    }
    
    return normalized;
  } catch (e) {
    return null;
  }
}

function getFilePathFromUrl(urlString) {
  try {
    const url = new URL(urlString, TARGET_URL);
    let pathname = url.pathname;
    
    // Ensure trailing slash for directories
    if (!pathname.endsWith('/') && !path.extname(pathname)) {
      pathname = pathname + '/';
    }
    
    // Convert to index.html
    if (pathname.endsWith('/')) {
      pathname = pathname + 'index.html';
    }
    
    const filePath = path.join(OUTPUT_DIR, pathname);
    return filePath;
  } catch (e) {
    return null;
  }
}

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function rewriteUrls(html, pageUrl) {
  const $ = cheerio.load(html);
  const baseUrl = new URL(TARGET_URL);
  
  // Rewrite anchor links
  $('a[href]').each((i, el) => {
    let href = $(el).attr('href');
    if (!href) return;
    
    try {
      const absoluteUrl = new URL(href, pageUrl).href;
      const normalized = normalizeUrl(absoluteUrl);
      
      if (normalized && normalized.startsWith(baseUrl.origin)) {
        $(el).attr('href', normalized.replace(baseUrl.origin, '') || '/');
      }
    } catch (e) {
      // Keep original URL if resolution fails
    }
  });
  
  // Rewrite image sources
  $('img[src]').each((i, el) => {
    let src = $(el).attr('src');
    if (!src) return;
    
    try {
      const absoluteUrl = new URL(src, pageUrl).href;
      if (!absoluteUrl.startsWith(baseUrl.origin)) {
        return; // Keep external images
      }
      $(el).attr('src', absoluteUrl.replace(baseUrl.origin, '') || '/');
    } catch (e) {
      // Keep original URL
    }
  });
  
  // Rewrite script sources
  $('script[src]').each((i, el) => {
    let src = $(el).attr('src');
    if (!src) return;
    
    try {
      const absoluteUrl = new URL(src, pageUrl).href;
      if (absoluteUrl.startsWith(baseUrl.origin)) {
        $(el).attr('src', absoluteUrl.replace(baseUrl.origin, '') || '/');
      }
    } catch (e) {
      // Keep original URL
    }
  });
  
  // Rewrite stylesheet links
  $('link[rel="stylesheet"][href]').each((i, el) => {
    let href = $(el).attr('href');
    if (!href) return;
    
    try {
      const absoluteUrl = new URL(href, pageUrl).href;
      if (absoluteUrl.startsWith(baseUrl.origin)) {
        $(el).attr('href', absoluteUrl.replace(baseUrl.origin, '') || '/');
      }
    } catch (e) {
      // Keep original URL
    }
  });
  
  return $.html();
}

async function fetchPage(url) {
  try {
    console.log(`📥 Fetching: ${url}`);
    const response = await axios.get(url, {
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to fetch ${url}: ${error.message}`);
    return null;
  }
}

async function extractLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = new Set();
  
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    
    const normalized = normalizeUrl(href, baseUrl);
    if (normalized) {
      links.add(normalized);
    }
  });
  
  return Array.from(links);
}

async function crawl() {
  QUEUE.push(new URL(TARGET_URL).href);
  let pageCount = 0;
  
  while (QUEUE.length > 0 && pageCount < MAX_PAGES) {
    const url = QUEUE.shift();
    
    if (VISITED_URLS.has(url)) {
      continue;
    }
    
    VISITED_URLS.add(url);
    const html = await fetchPage(url);
    
    if (!html) {
      continue;
    }
    
    // Rewrite URLs
    const rewrittenHtml = await rewriteUrls(html, url);
    
    // Save file
    const filePath = getFilePathFromUrl(url);
    if (filePath) {
      ensureDirectoryExists(filePath);
      fs.writeFileSync(filePath, rewrittenHtml, 'utf-8');
      console.log(`✅ Saved: ${filePath}`);
      pageCount++;
    }
    
    // Extract and queue new links
    const links = await extractLinks(html, url);
    for (const link of links) {
      if (!VISITED_URLS.has(link)) {
        QUEUE.push(link);
      }
    }
  }
  
  console.log(`\n🎉 Crawl complete!`);
  console.log(`📊 Pages crawled: ${pageCount}`);
  console.log(`📁 Output saved to: ${OUTPUT_DIR}`);
  
  return {
    success: true,
    pagesCount: pageCount,
    outputDir: OUTPUT_DIR
  };
}

// Run crawler
crawl()
  .then(result => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Crawl failed:', error);
    process.exit(1);
  });
