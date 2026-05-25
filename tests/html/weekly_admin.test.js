/**
 * @jest-environment jsdom
 *
 * HTML Structure Tests for src/weekly/admin.html
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");

beforeAll(() => {
  const htmlPath = path.resolve(__dirname, "../../src/weekly/admin.html");
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

test("[HTML-04] <script src='admin.js'> with defer attribute exists", () => {
  const raw = fs.readFileSync(
    path.resolve(__dirname, "../../src/weekly/admin.html"), "utf8"
  );
  const srcFirst   = /<script[^>]+src=["']admin\.js["'][^>]*defer[^>]*>/i;
  const deferFirst = /<script[^>]+defer[^>]+src=["']admin\.js["'][^>]*>/i;
  expect(srcFirst.test(raw) || deferFirst.test(raw)).toBe(true);
});

// ---------------------------------------------------------------------------
// Page structure
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
// Section 1 — Add / Edit Week Form
// ---------------------------------------------------------------------------

test("[HTML-08] first <section> inside <main> contains an <h2> with non-empty text", () => {
  const section = document.querySelector("main section");
  expect(section).not.toBeNull();
  const h2 = section.querySelector("h2");
  expect(h2).not.toBeNull();
  expect(h2.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-09] <form id='week-form'> exists", () => {
  expect(document.querySelector("form#week-form")).not.toBeNull();
});

test("[HTML-10] week form contains a <fieldset> with a <legend>", () => {
  const legend = document.querySelector("form#week-form fieldset legend");
  expect(legend).not.toBeNull();
  expect(legend.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-11] <input type='text' id='week-title' required> exists", () => {
  const input = document.querySelector("input#week-title");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("text");
  expect(input.hasAttribute("required")).toBe(true);
});

test("[HTML-12] week form has a <label> whose 'for' is 'week-title'", () => {
  expect(document.querySelector("form#week-form label[for='week-title']")).not.toBeNull();
});

test("[HTML-13] <input type='date' id='week-start-date' required> exists", () => {
  const input = document.querySelector("input#week-start-date");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("date");
  expect(input.hasAttribute("required")).toBe(true);
});

test("[HTML-14] week form has a <label> whose 'for' is 'week-start-date'", () => {
  expect(document.querySelector("form#week-form label[for='week-start-date']")).not.toBeNull();
});

test("[HTML-15] <textarea id='week-description'> exists", () => {
  expect(document.querySelector("textarea#week-description")).not.toBeNull();
});

test("[HTML-16] week form has a <label> whose 'for' is 'week-description'", () => {
  expect(document.querySelector("form#week-form label[for='week-description']")).not.toBeNull();
});

test("[HTML-17] <textarea id='week-links'> exists", () => {
  expect(document.querySelector("textarea#week-links")).not.toBeNull();
});

test("[HTML-18] week form has a <label> whose 'for' is 'week-links'", () => {
  expect(document.querySelector("form#week-form label[for='week-links']")).not.toBeNull();
});

test("[HTML-19] <button id='add-week' type='submit'> exists with non-empty text", () => {
  const btn = document.querySelector("button#add-week");
  expect(btn).not.toBeNull();
  expect(btn.getAttribute("type")).toBe("submit");
  expect(btn.textContent.trim().length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Section 2 — Existing Weeks Table
// ---------------------------------------------------------------------------

test("[HTML-20] second <section> inside <main> contains an <h2> with non-empty text", () => {
  const sections = document.querySelectorAll("main section");
  expect(sections.length).toBeGreaterThanOrEqual(2);
  const h2 = sections[1].querySelector("h2");
  expect(h2).not.toBeNull();
  expect(h2.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-21] <table id='weeks-table'> exists", () => {
  expect(document.querySelector("table#weeks-table")).not.toBeNull();
});

test("[HTML-22] table has a <thead> with at least one <th>", () => {
  const thead = document.querySelector("table#weeks-table thead");
  expect(thead).not.toBeNull();
  expect(thead.querySelectorAll("th").length).toBeGreaterThan(0);
});

test("[HTML-23] table thead contains 'Week Title' column header", () => {
  const texts = Array.from(
    document.querySelectorAll("table#weeks-table thead th")
  ).map(h => h.textContent.trim().toLowerCase());
  expect(texts.some(t => t.includes("title"))).toBe(true);
});

test("[HTML-24] table thead contains 'Start Date' column header", () => {
  const texts = Array.from(
    document.querySelectorAll("table#weeks-table thead th")
  ).map(h => h.textContent.trim().toLowerCase());
  expect(texts.some(t => t.includes("start") || t.includes("date"))).toBe(true);
});

test("[HTML-25] table thead contains 'Description' column header", () => {
  const texts = Array.from(
    document.querySelectorAll("table#weeks-table thead th")
  ).map(h => h.textContent.trim().toLowerCase());
  expect(texts).toContain("description");
});

test("[HTML-26] table thead contains 'Actions' column header", () => {
  const texts = Array.from(
    document.querySelectorAll("table#weeks-table thead th")
  ).map(h => h.textContent.trim().toLowerCase());
  expect(texts).toContain("actions");
});

test("[HTML-27] <tbody id='weeks-tbody'> exists inside the table", () => {
  expect(
    document.querySelector("table#weeks-table tbody#weeks-tbody")
  ).not.toBeNull();
});
