/**
 * @jest-environment jsdom
 *
 * HTML Structure Tests for src/discussion/board.html
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");

beforeAll(() => {
  const html = fs.readFileSync(
    path.resolve(__dirname, "../../src/discussion/board.html"), "utf8"
  );
  document.documentElement.innerHTML = html;
});

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

test("[HTML-04] <script src='board.js'> with defer attribute exists", () => {
  const raw = fs.readFileSync(
    path.resolve(__dirname, "../../src/discussion/board.html"), "utf8"
  );
  const srcFirst   = /<script[^>]+src=["']board\.js["'][^>]*defer[^>]*>/i;
  const deferFirst = /<script[^>]+defer[^>]+src=["']board\.js["'][^>]*>/i;
  expect(srcFirst.test(raw) || deferFirst.test(raw)).toBe(true);
});

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

// Section 1 — new-topic form
test("[HTML-08] <form id='new-topic-form'> exists", () => {
  expect(document.querySelector("form#new-topic-form")).not.toBeNull();
});

test("[HTML-09] new-topic form contains a <fieldset> with a <legend>", () => {
  const legend = document.querySelector("form#new-topic-form fieldset legend");
  expect(legend).not.toBeNull();
  expect(legend.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-10] <input type='text' id='topic-subject' required> exists", () => {
  const input = document.querySelector("input#topic-subject");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("text");
  expect(input.hasAttribute("required")).toBe(true);
});

test("[HTML-11] form has a <label> whose 'for' is 'topic-subject'", () => {
  expect(
    document.querySelector("form#new-topic-form label[for='topic-subject']")
  ).not.toBeNull();
});

test("[HTML-12] <textarea id='topic-message' required> exists", () => {
  const ta = document.querySelector("textarea#topic-message");
  expect(ta).not.toBeNull();
  expect(ta.hasAttribute("required")).toBe(true);
});

test("[HTML-13] form has a <label> whose 'for' is 'topic-message'", () => {
  expect(
    document.querySelector("form#new-topic-form label[for='topic-message']")
  ).not.toBeNull();
});

test("[HTML-14] <button id='create-topic' type='submit'> exists with non-empty text", () => {
  const btn = document.querySelector("button#create-topic");
  expect(btn).not.toBeNull();
  expect(btn.getAttribute("type")).toBe("submit");
  expect(btn.textContent.trim().length).toBeGreaterThan(0);
});

// Section 2 — topic list
test("[HTML-15] <div id='topic-list-container'> exists inside <main>", () => {
  expect(document.querySelector("main div#topic-list-container")).not.toBeNull();
});
