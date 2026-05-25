/**
 * @jest-environment jsdom
 *
 * HTML Structure Tests for src/discussion/topic.html
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");

beforeAll(() => {
  const html = fs.readFileSync(
    path.resolve(__dirname, "../../src/discussion/topic.html"), "utf8"
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

test("[HTML-04] <script src='topic.js'> with defer attribute exists", () => {
  const raw = fs.readFileSync(
    path.resolve(__dirname, "../../src/discussion/topic.html"), "utf8"
  );
  const srcFirst   = /<script[^>]+src=["']topic\.js["'][^>]*defer[^>]*>/i;
  const deferFirst = /<script[^>]+defer[^>]+src=["']topic\.js["'][^>]*>/i;
  expect(srcFirst.test(raw) || deferFirst.test(raw)).toBe(true);
});

test("[HTML-05] <header> element exists", () => {
  expect(document.querySelector("header")).not.toBeNull();
});

test("[HTML-06] <h1 id='topic-subject'> exists", () => {
  expect(document.querySelector("h1#topic-subject")).not.toBeNull();
});

test("[HTML-07] <main> element exists", () => {
  expect(document.querySelector("main")).not.toBeNull();
});

// Original post
test("[HTML-08] <article id='original-post'> exists inside <main>", () => {
  expect(document.querySelector("main article#original-post")).not.toBeNull();
});

test("[HTML-09] <p id='op-message'> exists inside #original-post", () => {
  expect(
    document.querySelector("article#original-post p#op-message")
  ).not.toBeNull();
});

test("[HTML-10] <footer id='op-footer'> exists inside #original-post", () => {
  expect(
    document.querySelector("article#original-post footer#op-footer")
  ).not.toBeNull();
});

// Replies section
test("[HTML-11] <section id='replies-section'> exists inside <main>", () => {
  expect(document.querySelector("main section#replies-section")).not.toBeNull();
});

test("[HTML-12] replies section contains an <h2> with non-empty text", () => {
  const h2 = document.querySelector("section#replies-section h2");
  expect(h2).not.toBeNull();
  expect(h2.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-13] <div id='reply-list-container'> exists inside replies section", () => {
  expect(
    document.querySelector("section#replies-section div#reply-list-container")
  ).not.toBeNull();
});

// Reply form
test("[HTML-14] <form id='reply-form'> exists inside replies section", () => {
  expect(
    document.querySelector("section#replies-section form#reply-form")
  ).not.toBeNull();
});

test("[HTML-15] reply form contains a <fieldset> with a <legend>", () => {
  const legend = document.querySelector("form#reply-form fieldset legend");
  expect(legend).not.toBeNull();
  expect(legend.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-16] <textarea id='new-reply' required> exists inside reply form", () => {
  const ta = document.querySelector("form#reply-form textarea#new-reply");
  expect(ta).not.toBeNull();
  expect(ta.hasAttribute("required")).toBe(true);
});

test("[HTML-17] reply form has a <label> whose 'for' is 'new-reply'", () => {
  expect(
    document.querySelector("form#reply-form label[for='new-reply']")
  ).not.toBeNull();
});

test("[HTML-18] reply form has a <button type='submit'> with non-empty text", () => {
  const btn = document.querySelector("form#reply-form button[type='submit']");
  expect(btn).not.toBeNull();
  expect(btn.textContent.trim().length).toBeGreaterThan(0);
});
