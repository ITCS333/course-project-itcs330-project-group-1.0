/**
 * @jest-environment jsdom
 *
 * HTML Structure Tests for details.html
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Load the student's HTML file once before all tests
// ---------------------------------------------------------------------------
beforeAll(() => {
  const htmlPath = path.resolve(__dirname, "../../src/resources/details.html");
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

test("[HTML-04] <script src='details.js'> with defer attribute exists", () => {
  const htmlPath = path.resolve(__dirname, "../../src/resources/details.html");
  const raw      = fs.readFileSync(htmlPath, "utf8");

  const srcFirst   = /<script[^>]+src=["']details\.js["'][^>]*defer[^>]*>/i;
  const deferFirst = /<script[^>]+defer[^>]+src=["']details\.js["'][^>]*>/i;

  expect(srcFirst.test(raw) || deferFirst.test(raw)).toBe(true);
});

// ---------------------------------------------------------------------------
// Page structure — header and main
// ---------------------------------------------------------------------------

test("[HTML-05] <header> element exists", () => {
  expect(document.querySelector("header")).not.toBeNull();
});

test("[HTML-06] <h1 id='resource-title'> exists", () => {
  const h1 = document.querySelector("h1#resource-title");
  expect(h1).not.toBeNull();
});

test("[HTML-07] <main> element exists", () => {
  expect(document.querySelector("main")).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Section 1 — Resource Information
// ---------------------------------------------------------------------------

test("[HTML-08] <p id='resource-description'> exists inside <main>", () => {
  const p = document.querySelector("main p#resource-description");
  expect(p).not.toBeNull();
});

test("[HTML-09] <a id='resource-link'> exists with target='_blank'", () => {
  const a = document.querySelector("a#resource-link");
  expect(a).not.toBeNull();
  expect(a.getAttribute("target")).toBe("_blank");
});

// ---------------------------------------------------------------------------
// Section 2 — Discussion Forum
// ---------------------------------------------------------------------------

test("[HTML-10] <section id='discussion-forum'> exists inside <main>", () => {
  const section = document.querySelector("main section#discussion-forum");
  expect(section).not.toBeNull();
});

test("[HTML-11] discussion section contains an <h2> with non-empty text", () => {
  const h2 = document.querySelector("section#discussion-forum h2");
  expect(h2).not.toBeNull();
  expect(h2.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-12] <div id='comment-list'> exists inside discussion section", () => {
  const div = document.querySelector("section#discussion-forum div#comment-list");
  expect(div).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Comment form
// ---------------------------------------------------------------------------

test("[HTML-13] <form id='comment-form'> exists inside discussion section", () => {
  const form = document.querySelector("section#discussion-forum form#comment-form");
  expect(form).not.toBeNull();
});

test("[HTML-14] comment form contains a <fieldset> with a <legend>", () => {
  const legend = document.querySelector("form#comment-form fieldset legend");
  expect(legend).not.toBeNull();
  expect(legend.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-15] <textarea id='new-comment' required> exists inside comment form", () => {
  const textarea = document.querySelector("form#comment-form textarea#new-comment");
  expect(textarea).not.toBeNull();
  expect(textarea.hasAttribute("required")).toBe(true);
});

test("[HTML-16] comment form has a <label> whose 'for' attribute is 'new-comment'", () => {
  const label = document.querySelector("form#comment-form label[for='new-comment']");
  expect(label).not.toBeNull();
});

test("[HTML-17] comment form has a <button type='submit'> with non-empty text", () => {
  const btn = document.querySelector("form#comment-form button[type='submit']");
  expect(btn).not.toBeNull();
  expect(btn.textContent.trim().length).toBeGreaterThan(0);
});
