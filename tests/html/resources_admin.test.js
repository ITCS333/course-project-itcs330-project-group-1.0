/**
 * @jest-environment jsdom
 *
 * HTML Structure Tests for admin.html (resources)
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Load the student's HTML file once before all tests
// ---------------------------------------------------------------------------
beforeAll(() => {
  const htmlPath = path.resolve(__dirname, "../../src/resources/admin.html");
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

test("[HTML-04] <script src='admin.js'> with defer attribute exists", () => {
  const htmlPath = path.resolve(__dirname, "../../src/resources/admin.html");
  const raw      = fs.readFileSync(htmlPath, "utf8");

  const srcFirst   = /<script[^>]+src=["']admin\.js["'][^>]*defer[^>]*>/i;
  const deferFirst = /<script[^>]+defer[^>]+src=["']admin\.js["'][^>]*>/i;

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
// Section 1 — Add / Edit Resource Form
// ---------------------------------------------------------------------------

test("[HTML-08] first <section> inside <main> contains an <h2> with non-empty text", () => {
  const section = document.querySelector("main section");
  expect(section).not.toBeNull();
  const h2 = section.querySelector("h2");
  expect(h2).not.toBeNull();
  expect(h2.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-09] <form id='resource-form'> exists", () => {
  expect(document.querySelector("form#resource-form")).not.toBeNull();
});

test("[HTML-10] resource form contains a <fieldset> with a <legend>", () => {
  const legend = document.querySelector("form#resource-form fieldset legend");
  expect(legend).not.toBeNull();
  expect(legend.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-11] <input type='text' id='resource-title' required> exists", () => {
  const input = document.querySelector("input#resource-title");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("text");
  expect(input.hasAttribute("required")).toBe(true);
});

test("[HTML-12] resource form has a <label> whose 'for' is 'resource-title'", () => {
  const label = document.querySelector("form#resource-form label[for='resource-title']");
  expect(label).not.toBeNull();
});

test("[HTML-13] <textarea id='resource-description'> exists", () => {
  expect(document.querySelector("textarea#resource-description")).not.toBeNull();
});

test("[HTML-14] resource form has a <label> whose 'for' is 'resource-description'", () => {
  const label = document.querySelector("form#resource-form label[for='resource-description']");
  expect(label).not.toBeNull();
});

test("[HTML-15] <input type='url' id='resource-link' required> exists", () => {
  const input = document.querySelector("input#resource-link");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("url");
  expect(input.hasAttribute("required")).toBe(true);
});

test("[HTML-16] resource form has a <label> whose 'for' is 'resource-link'", () => {
  const label = document.querySelector("form#resource-form label[for='resource-link']");
  expect(label).not.toBeNull();
});

test("[HTML-17] <button id='add-resource' type='submit'> exists with non-empty text", () => {
  const btn = document.querySelector("button#add-resource");
  expect(btn).not.toBeNull();
  expect(btn.getAttribute("type")).toBe("submit");
  expect(btn.textContent.trim().length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Section 2 — Existing Resources Table
// ---------------------------------------------------------------------------

test("[HTML-18] second <section> inside <main> contains an <h2> with non-empty text", () => {
  const sections = document.querySelectorAll("main section");
  expect(sections.length).toBeGreaterThanOrEqual(2);
  const h2 = sections[1].querySelector("h2");
  expect(h2).not.toBeNull();
  expect(h2.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-19] <table id='resources-table'> exists", () => {
  expect(document.querySelector("table#resources-table")).not.toBeNull();
});

test("[HTML-20] table has a <thead> with at least one <th>", () => {
  const thead = document.querySelector("table#resources-table thead");
  expect(thead).not.toBeNull();
  expect(thead.querySelectorAll("th").length).toBeGreaterThan(0);
});

test("[HTML-21] table thead contains 'Title' column header", () => {
  const headers = document.querySelectorAll("table#resources-table thead th");
  const texts   = Array.from(headers).map(h => h.textContent.trim().toLowerCase());
  expect(texts).toContain("title");
});

test("[HTML-22] table thead contains 'Description' column header", () => {
  const headers = document.querySelectorAll("table#resources-table thead th");
  const texts   = Array.from(headers).map(h => h.textContent.trim().toLowerCase());
  expect(texts).toContain("description");
});

test("[HTML-23] table thead contains 'Link' column header", () => {
  const headers = document.querySelectorAll("table#resources-table thead th");
  const texts   = Array.from(headers).map(h => h.textContent.trim().toLowerCase());
  expect(texts).toContain("link");
});

test("[HTML-24] table thead contains 'Actions' column header", () => {
  const headers = document.querySelectorAll("table#resources-table thead th");
  const texts   = Array.from(headers).map(h => h.textContent.trim().toLowerCase());
  expect(texts).toContain("actions");
});

test("[HTML-25] <tbody id='resources-tbody'> exists inside the table", () => {
  expect(
    document.querySelector("table#resources-table tbody#resources-tbody")
  ).not.toBeNull();
});
