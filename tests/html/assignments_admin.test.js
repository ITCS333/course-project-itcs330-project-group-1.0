/**
 * @jest-environment jsdom
 *
 * HTML Structure Tests for src/assignments/admin.html
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");

beforeAll(() => {
  const html = fs.readFileSync(
    path.resolve(__dirname, "../../src/assignments/admin.html"), "utf8"
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

test("[HTML-04] <script src='admin.js'> with defer attribute exists", () => {
  const raw = fs.readFileSync(
    path.resolve(__dirname, "../../src/assignments/admin.html"), "utf8"
  );
  const srcFirst   = /<script[^>]+src=["']admin\.js["'][^>]*defer[^>]*>/i;
  const deferFirst = /<script[^>]+defer[^>]+src=["']admin\.js["'][^>]*>/i;
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

// Section 1 — form
test("[HTML-08] first <section> inside <main> contains an <h2> with non-empty text", () => {
  const section = document.querySelector("main section");
  expect(section).not.toBeNull();
  const h2 = section.querySelector("h2");
  expect(h2).not.toBeNull();
  expect(h2.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-09] <form id='assignment-form'> exists", () => {
  expect(document.querySelector("form#assignment-form")).not.toBeNull();
});

test("[HTML-10] assignment form contains a <fieldset> with a <legend>", () => {
  const legend = document.querySelector("form#assignment-form fieldset legend");
  expect(legend).not.toBeNull();
  expect(legend.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-11] <input type='text' id='assignment-title' required> exists", () => {
  const input = document.querySelector("input#assignment-title");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("text");
  expect(input.hasAttribute("required")).toBe(true);
});

test("[HTML-12] form has a <label> whose 'for' is 'assignment-title'", () => {
  expect(
    document.querySelector("form#assignment-form label[for='assignment-title']")
  ).not.toBeNull();
});

test("[HTML-13] <textarea id='assignment-description' required> exists", () => {
  const ta = document.querySelector("textarea#assignment-description");
  expect(ta).not.toBeNull();
  expect(ta.hasAttribute("required")).toBe(true);
});

test("[HTML-14] form has a <label> whose 'for' is 'assignment-description'", () => {
  expect(
    document.querySelector("form#assignment-form label[for='assignment-description']")
  ).not.toBeNull();
});

test("[HTML-15] <input type='date' id='assignment-due-date' required> exists", () => {
  const input = document.querySelector("input#assignment-due-date");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("date");
  expect(input.hasAttribute("required")).toBe(true);
});

test("[HTML-16] form has a <label> whose 'for' is 'assignment-due-date'", () => {
  expect(
    document.querySelector("form#assignment-form label[for='assignment-due-date']")
  ).not.toBeNull();
});

test("[HTML-17] <textarea id='assignment-files'> exists", () => {
  expect(document.querySelector("textarea#assignment-files")).not.toBeNull();
});

test("[HTML-18] form has a <label> whose 'for' is 'assignment-files'", () => {
  expect(
    document.querySelector("form#assignment-form label[for='assignment-files']")
  ).not.toBeNull();
});

test("[HTML-19] <button id='add-assignment' type='submit'> exists with non-empty text", () => {
  const btn = document.querySelector("button#add-assignment");
  expect(btn).not.toBeNull();
  expect(btn.getAttribute("type")).toBe("submit");
  expect(btn.textContent.trim().length).toBeGreaterThan(0);
});

// Section 2 — table
test("[HTML-20] second <section> inside <main> contains an <h2> with non-empty text", () => {
  const sections = document.querySelectorAll("main section");
  expect(sections.length).toBeGreaterThanOrEqual(2);
  const h2 = sections[1].querySelector("h2");
  expect(h2).not.toBeNull();
  expect(h2.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-21] <table id='assignments-table'> exists", () => {
  expect(document.querySelector("table#assignments-table")).not.toBeNull();
});

test("[HTML-22] table has a <thead> with at least one <th>", () => {
  const thead = document.querySelector("table#assignments-table thead");
  expect(thead).not.toBeNull();
  expect(thead.querySelectorAll("th").length).toBeGreaterThan(0);
});

test("[HTML-23] table thead contains a 'Title' column header", () => {
  const texts = Array.from(
    document.querySelectorAll("table#assignments-table thead th")
  ).map(h => h.textContent.trim().toLowerCase());
  expect(texts).toContain("title");
});

test("[HTML-24] table thead contains a 'Due Date' column header", () => {
  const texts = Array.from(
    document.querySelectorAll("table#assignments-table thead th")
  ).map(h => h.textContent.trim().toLowerCase());
  expect(texts.some(t => t.includes("due") || t.includes("date"))).toBe(true);
});

test("[HTML-25] table thead contains a 'Description' column header", () => {
  const texts = Array.from(
    document.querySelectorAll("table#assignments-table thead th")
  ).map(h => h.textContent.trim().toLowerCase());
  expect(texts).toContain("description");
});

test("[HTML-26] table thead contains an 'Actions' column header", () => {
  const texts = Array.from(
    document.querySelectorAll("table#assignments-table thead th")
  ).map(h => h.textContent.trim().toLowerCase());
  expect(texts).toContain("actions");
});

test("[HTML-27] <tbody id='assignments-tbody'> exists inside the table", () => {
  expect(
    document.querySelector("table#assignments-table tbody#assignments-tbody")
  ).not.toBeNull();
});
