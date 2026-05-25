/**
 * @jest-environment jsdom
 *
 * HTML Structure Tests for login.html
 * Each test is worth 1 point.
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Load the student's HTML file once before all tests
// ---------------------------------------------------------------------------
beforeAll(() => {
  const htmlPath = path.resolve(__dirname, "../../src/auth/login.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  document.documentElement.innerHTML = html;
});

// ---------------------------------------------------------------------------
// <head> meta / title tests
// ---------------------------------------------------------------------------

test("[HTML-01] <meta charset='UTF-8'> exists", () => {
  const meta = document.querySelector("meta[charset]");
  expect(meta).not.toBeNull();
  expect(meta.getAttribute("charset").toUpperCase()).toBe("UTF-8");
});

test("[HTML-02] <meta name='viewport'> exists with correct content", () => {
  const meta = document.querySelector("meta[name='viewport']");
  expect(meta).not.toBeNull();

  const content = meta.getAttribute("content") || "";
  expect(content).toMatch(/width=device-width/i);
  expect(content).toMatch(/initial-scale=1/i);
});

test("[HTML-03] <title> is 'Login'", () => {
  const title = document.querySelector("title");
  expect(title).not.toBeNull();
  expect(title.textContent.trim()).toBe("Login");
});

// ---------------------------------------------------------------------------
// <script> tag
// ---------------------------------------------------------------------------

test("[HTML-04] <script src='login.js'> with defer attribute exists", () => {
  // jsdom strips <script> tags from innerHTML; read raw HTML instead
  const htmlPath = path.resolve(__dirname, "../../src/auth/login.html");
  const raw = fs.readFileSync(htmlPath, "utf8");

  // Match <script ... src="login.js" ... defer ...> in any attribute order
  const scriptRegex = /<script[^>]+src=["']login\.js["'][^>]*defer[^>]*>/i;
  const deferFirstRegex = /<script[^>]+defer[^>]+src=["']login\.js["'][^>]*>/i;

  const found = scriptRegex.test(raw) || deferFirstRegex.test(raw);
  expect(found).toBe(true);
});

// ---------------------------------------------------------------------------
// Form structure
// ---------------------------------------------------------------------------

test("[HTML-05] <form id='login-form'> exists", () => {
  const form = document.querySelector("form#login-form");
  expect(form).not.toBeNull();
});

test("[HTML-06] <fieldset> exists inside the form", () => {
  const fieldset = document.querySelector("form#login-form fieldset");
  expect(fieldset).not.toBeNull();
});

test("[HTML-07] <legend> exists inside the fieldset", () => {
  const legend = document.querySelector("form#login-form fieldset legend");
  expect(legend).not.toBeNull();
  expect(legend.textContent.trim().length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Email input
// ---------------------------------------------------------------------------

test("[HTML-08] <input type='email' id='email' required> exists", () => {
  const input = document.querySelector("input#email");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("email");
  expect(input.hasAttribute("required")).toBe(true);
});

// ---------------------------------------------------------------------------
// Password input
// ---------------------------------------------------------------------------

test("[HTML-09] <input type='password' id='password' required> exists", () => {
  const input = document.querySelector("input#password");
  expect(input).not.toBeNull();
  expect(input.getAttribute("type")).toBe("password");
  expect(input.hasAttribute("required")).toBe(true);
});

test("[HTML-10] password input has minlength='8'", () => {
  const input = document.querySelector("input#password");
  expect(input).not.toBeNull();
  expect(input.getAttribute("minlength")).toBe("8");
});

// ---------------------------------------------------------------------------
// Submit button
// ---------------------------------------------------------------------------

test("[HTML-11] <button type='submit' id='login'> exists", () => {
  const button = document.querySelector("button#login");
  expect(button).not.toBeNull();
  expect(button.getAttribute("type")).toBe("submit");
});

// ---------------------------------------------------------------------------
// Message container
// ---------------------------------------------------------------------------

test("[HTML-12] <div id='message-container'> exists", () => {
  const div = document.querySelector("div#message-container");
  expect(div).not.toBeNull();
});
