/**
 * @jest-environment jsdom
 *
 * HTML Structure Tests for manage_users.html
 * Each test is worth 1 point.
 */

const fs   = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Load the student's HTML file once before all tests
// ---------------------------------------------------------------------------
beforeAll(() => {
  const htmlPath = path.resolve(__dirname, "../../src/admin/manage_users.html");
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

test("[HTML-04] <script src='manage_users.js'> with defer attribute exists", () => {
  const htmlPath = path.resolve(__dirname, "../../src/admin/manage_users.html");
  const raw      = fs.readFileSync(htmlPath, "utf8");

  const srcFirst   = /<script[^>]+src=["']manage_users\.js["'][^>]*defer[^>]*>/i;
  const deferFirst = /<script[^>]+defer[^>]+src=["']manage_users\.js["'][^>]*>/i;

  expect(srcFirst.test(raw) || deferFirst.test(raw)).toBe(true);
});

// ---------------------------------------------------------------------------
// Page structure — header and main
// ---------------------------------------------------------------------------

test("[HTML-05] <header> element exists", () => {
  const header = document.querySelector("header");
  expect(header).not.toBeNull();
});

test("[HTML-06] <header> contains an <h1> with non-empty text", () => {
  const h1 = document.querySelector("header h1");
  expect(h1).not.toBeNull();
  expect(h1.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-07] <main> element exists", () => {
  const main = document.querySelector("main");
  expect(main).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Section 1 — Password Management
// ---------------------------------------------------------------------------

test("[HTML-08] password management <section> contains an <h2> with non-empty text", () => {
  const sections = document.querySelectorAll("main section");
  const headings = Array.from(sections).map(s => s.querySelector("h2"));
  const hasH2    = headings.some(h => h && h.textContent.trim().length > 0);
  expect(hasH2).toBe(true);
});

test("[HTML-09] <form id='password-form'> exists", () => {
  const form = document.querySelector("form#password-form");
  expect(form).not.toBeNull();
});

test("[HTML-10] password form contains a <fieldset> with a <legend>", () => {
  const legend = document.querySelector("form#password-form fieldset legend");
  expect(legend).not.toBeNull();
  expect(legend.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-11] <input type='password' id='current-password' required> exists", () => {
  const input = document.querySelector("input#current-password");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("password");
  expect(input.hasAttribute("required")).toBe(true);
});

test("[HTML-12] <input type='password' id='new-password' required minlength='8'> exists", () => {
  const input = document.querySelector("input#new-password");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("password");
  expect(input.hasAttribute("required")).toBe(true);
  expect(input.getAttribute("minlength")).toBe("8");
});

test("[HTML-13] <input type='password' id='confirm-password' required> exists", () => {
  const input = document.querySelector("input#confirm-password");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("password");
  expect(input.hasAttribute("required")).toBe(true);
});

test("[HTML-14] password form has a <button type='submit' id='change'> with non-empty text", () => {
  const btn = document.querySelector("button#change");
  expect(btn).not.toBeNull();
  expect(btn.getAttribute("type")).toBe("submit");
  expect(btn.textContent.trim().length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Section 2 — User Management
// ---------------------------------------------------------------------------

test("[HTML-15] user management <section> contains an <h2> with non-empty text", () => {
  const sections = document.querySelectorAll("main section");
  expect(sections.length).toBeGreaterThanOrEqual(2);
  const h2 = sections[1].querySelector("h2");
  expect(h2).not.toBeNull();
  expect(h2.textContent.trim().length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Subsection 2.1 — Add New User (collapsible)
// ---------------------------------------------------------------------------

test("[HTML-16] <details> element with a <summary> exists in the user management section", () => {
  const details = document.querySelector("main section details");
  expect(details).not.toBeNull();
  const summary = details.querySelector("summary");
  expect(summary).not.toBeNull();
  expect(summary.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-17] <form id='add-user-form'> exists inside <details>", () => {
  const form = document.querySelector("details form#add-user-form");
  expect(form).not.toBeNull();
});

test("[HTML-18] add-user-form has a <fieldset> with a <legend>", () => {
  const legend = document.querySelector("form#add-user-form fieldset legend");
  expect(legend).not.toBeNull();
  expect(legend.textContent.trim().length).toBeGreaterThan(0);
});

test("[HTML-19] <input type='text' id='user-name' required> exists", () => {
  const input = document.querySelector("input#user-name");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("text");
  expect(input.hasAttribute("required")).toBe(true);
});

test("[HTML-20] <input type='email' id='user-email' required> exists", () => {
  const input = document.querySelector("input#user-email");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("email");
  expect(input.hasAttribute("required")).toBe(true);
});

test("[HTML-21] <input type='password' id='default-password' required minlength='8'> exists", () => {
  const input = document.querySelector("input#default-password");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("password");
  expect(input.hasAttribute("required")).toBe(true);
  expect(input.getAttribute("minlength")).toBe("8");
});

test("[HTML-22] <select id='is-admin'> exists with options for value '0' and value '1'", () => {
  const select  = document.querySelector("select#is-admin");
  expect(select).not.toBeNull();
  const values  = Array.from(select.options).map(o => o.value);
  expect(values).toContain("0");
  expect(values).toContain("1");
});

test("[HTML-23] add-user-form has a <button type='submit' id='add'> with non-empty text", () => {
  const btn = document.querySelector("button#add");
  expect(btn).not.toBeNull();
  expect(btn.getAttribute("type")).toBe("submit");
  expect(btn.textContent.trim().length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Subsection 2.2 — Search input
// ---------------------------------------------------------------------------

test("[HTML-24] <input id='search-input'> exists", () => {
  const input = document.querySelector("input#search-input");
  expect(input).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Subsection 2.2 — User table
// ---------------------------------------------------------------------------

test("[HTML-25] <table id='user-table'> exists", () => {
  const table = document.querySelector("table#user-table");
  expect(table).not.toBeNull();
});

test("[HTML-26] table has a <thead> with at least one <th>", () => {
  const thead = document.querySelector("table#user-table thead");
  expect(thead).not.toBeNull();
  const headers = thead.querySelectorAll("th");
  expect(headers.length).toBeGreaterThan(0);
});

test("[HTML-27] table thead contains 'Name' column header", () => {
  const headers = document.querySelectorAll("table#user-table thead th");
  const texts   = Array.from(headers).map(h => h.textContent.trim().toLowerCase());
  expect(texts).toContain("name");
});

test("[HTML-28] table thead contains 'Email' column header", () => {
  const headers = document.querySelectorAll("table#user-table thead th");
  const texts   = Array.from(headers).map(h => h.textContent.trim().toLowerCase());
  expect(texts).toContain("email");
});

test("[HTML-29] table thead contains 'Actions' column header", () => {
  const headers = document.querySelectorAll("table#user-table thead th");
  const texts   = Array.from(headers).map(h => h.textContent.trim().toLowerCase());
  expect(texts).toContain("actions");
});

test("[HTML-30] <tbody id='user-table-body'> exists inside the table", () => {
  const tbody = document.querySelector("table#user-table tbody#user-table-body");
  expect(tbody).not.toBeNull();
});
