/*
  Requirement: Populate the "Course Resources" list page.

  Instructions:
  1. Link this file to `list.html` using:
     <script src="list.js" defer></script>

  2. In `list.html`, add id="resource-list-section" to the
     <section> element that will contain the resource articles.

  3. Implement the TODOs below.
*/

// --- Element Selections ---
// TODO: Select the section for the resource list ('#resource-list-section').

// --- Functions ---

/**
 * TODO: Implement the createResourceArticle function.
 * It takes one resource object { id, title, description, link }.
 * It should return an <article> element matching the structure in `list.html`.
 * The "View Resource & Discussion" link's `href` MUST be set to
 * `details.html?id=${id}` so the detail page knows which resource to load.
 */
function createResourceArticle(resource) {
  // ... your implementation here ...
}

/**
 * TODO: Implement the loadResources function.
 * This function must be 'async'.
 * It should:
 * 1. Use `fetch()` to GET data from the API endpoint:
 *    './api/index.php'
 * 2. Parse the JSON response. The API returns { success: true, data: [...] }.
 * 3. Clear any existing content from the list section.
 * 4. Loop through the resources array in `data`. For each resource:
 *    - Call `createResourceArticle()` with the resource object.
 *    - Append the returned <article> element to the list section.
 */
async function loadResources() {
  // ... your implementation here ...
}

// --- Initial Page Load ---
// Call the function to populate the page.
loadResources();
