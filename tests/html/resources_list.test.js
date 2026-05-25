/**
 * @jest-environment jsdom
 *
 * HTML Structure Tests for list.html
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Load the student's HTML file once before all tests
// ---------------------------------------------------------------------------
beforeAll(() => {
  const htmlPath = path.resolve(__dirname, "../../src/resources/list.html");
  const html     = fs.readFileSync(htmlPath, "utf8");
  document.documentElement.innerHTML = html;
});

// ---------------------------------------------------------------------------
// <head> meta / title / script tests
// ---------------------------------------------------------------------------

test("[HTML-01] <meta charset='UTF-8'> exists", () => {
  const meta = document.querySelector("meta[charset]");
  expect(meta).not.toBeNull();
  expect(meta.getAttribute("charset").toUpperCase()).toBe("UTF-8");
});

test("[HTML-02] <meta name='viewport'> exists with correct content", () => {
  const meta    = document.querySelector("meta[name='viewport']");
  expect(meta).not.toBeNull();
  const content = meta.getAttribute("content") || "";
  expect(content).toMatch(/width=device-width/i);
  expect(content).toMatch(/initial-scale=1/i);
});

test("[HTML-03] <title> exists and is not empty", () => {
  const title = document.querySelector("title");
  expect(title).not.toBeNull();
  expect(title.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-04] <script src='list.js'> with defer attribute exists", () => {
  const htmlPath = path.resolve(__dirname, "../../src/resources/list.html");
  const raw      = fs.readFileSync(htmlPath, "utf8");

  const srcFirst   = /<script[^>]+src=["']list\.js["'][^>]*defer[^>]*>/i;
  const deferFirst = /<script[^>]+defer[^>]+src=["']list\.js["'][^>]*>/i;

  expect(srcFirst.test(raw) || deferFirst.test(raw)).toBe(true);
});

// ---------------------------------------------------------------------------
// Page structure — header and main
// ---------------------------------------------------------------------------

test("[HTML-05] <header> element exists", () => {
  expect(document.querySelector("header")).not.toBeNull();
});

test("[HTML-06] <header> contains an <h1> with non-empty text", () => {
  const h1 = document.querySelector("header h1");
  expect(h1).not.toBeNull();
  expect(h1.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-07] <main> element exists", () => {
  expect(document.querySelector("main")).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Resource list section
// ---------------------------------------------------------------------------

test("[HTML-08] <section id='resource-list-section'> exists inside <main>", () => {
  const section = document.querySelector("main section#resource-list-section");
  expect(section).not.toBeNull();
});
