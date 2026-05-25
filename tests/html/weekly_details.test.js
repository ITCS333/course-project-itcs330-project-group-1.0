/**
 * @jest-environment jsdom
 *
 * HTML Structure Tests for src/weekly/details.html
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");

beforeAll(() => {
  const htmlPath = path.resolve(__dirname, "../../src/weekly/details.html");
  const html     = fs.readFileSync(htmlPath, "utf8");
  document.documentElement.innerHTML = html;
});

// ---------------------------------------------------------------------------
// <head>
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

test("[HTML-04] <script src='details.js'> with defer attribute exists", () => {
  const raw = fs.readFileSync(
    path.resolve(__dirname, "../../src/weekly/details.html"), "utf8"
  );
  const srcFirst   = /<script[^>]+src=["']details\.js["'][^>]*defer[^>]*>/i;
  const deferFirst = /<script[^>]+defer[^>]+src=["']details\.js["'][^>]*>/i;
  expect(srcFirst.test(raw) || deferFirst.test(raw)).toBe(true);
});

// ---------------------------------------------------------------------------
// Page structure
// ---------------------------------------------------------------------------

test("[HTML-05] <header> element exists", () => {
  expect(document.querySelector("header")).not.toBeNull();
});

test("[HTML-06] <h1 id='week-title'> exists", () => {
  expect(document.querySelector("h1#week-title")).not.toBeNull();
});

test("[HTML-07] <main> element exists", () => {
  expect(document.querySelector("main")).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Section 1 — Weekly Information
// ---------------------------------------------------------------------------

test("[HTML-08] <p id='week-start-date'> exists inside <main>", () => {
  expect(document.querySelector("main p#week-start-date")).not.toBeNull();
});

test("[HTML-09] <p id='week-description'> exists inside <main>", () => {
  expect(document.querySelector("main p#week-description")).not.toBeNull();
});

test("[HTML-10] <ul id='week-links-list'> exists inside <main>", () => {
  expect(document.querySelector("main ul#week-links-list")).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Section 2 — Discussion Forum
// ---------------------------------------------------------------------------

test("[HTML-11] <section id='discussion-forum'> exists inside <main>", () => {
  expect(document.querySelector("main section#discussion-forum")).not.toBeNull();
});

test("[HTML-12] discussion section contains an <h2> with non-empty text", () => {
  const h2 = document.querySelector("section#discussion-forum h2");
  expect(h2).not.toBeNull();
  expect(h2.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-13] <div id='comment-list'> exists inside discussion section", () => {
  expect(
    document.querySelector("section#discussion-forum div#comment-list")
  ).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Comment form
// ---------------------------------------------------------------------------

test("[HTML-14] <form id='comment-form'> exists inside discussion section", () => {
  expect(
    document.querySelector("section#discussion-forum form#comment-form")
  ).not.toBeNull();
});

test("[HTML-15] comment form contains a <fieldset> with a <legend>", () => {
  const legend = document.querySelector("form#comment-form fieldset legend");
  expect(legend).not.toBeNull();
  expect(legend.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-16] <textarea id='new-comment' required> exists inside comment form", () => {
  const ta = document.querySelector("form#comment-form textarea#new-comment");
  expect(ta).not.toBeNull();
  expect(ta.hasAttribute("required")).toBe(true);
});

test("[HTML-17] comment form has a <label> whose 'for' is 'new-comment'", () => {
  expect(
    document.querySelector("form#comment-form label[for='new-comment']")
  ).not.toBeNull();
});

test("[HTML-18] comment form has a <button type='submit'> with non-empty text", () => {
  const btn = document.querySelector("form#comment-form button[type='submit']");
  expect(btn).not.toBeNull();
  expect(btn.textContent.trim().length).toBeGreaterThan(0);
});
