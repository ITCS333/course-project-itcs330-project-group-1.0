/*
  Requirement: Populate the resource detail page and discussion forum.

  Instructions:
  1. Link this file to `details.html` using:
     <script src="details.js" defer></script>

  2. In `details.html`, add the following IDs:
     - To the <h1>:                           id="resource-title"
     - To the description <p>:                id="resource-description"
     - To the "Access Resource Material" <a>: id="resource-link"
     - To the <div> for comments:             id="comment-list"
     - To the comment <form>:                 id="comment-form"
     - To the <textarea>:                     id="new-comment"

  3. Implement the TODOs below.
*/

// --- Global Data Store ---
// These will hold the data related to this specific resource.
let currentResourceId = null;
let currentComments = [];

// --- Element Selections ---
// TODO: Select all the elements you added IDs for in step 2.
const resourceTitle       = document.getElementById('resource-title');
const resourceDescription = document.getElementById('resource-description');
const resourceLink        = document.getElementById('resource-link');
const commentList         = document.getElementById('comment-list');
const commentForm         = document.getElementById('comment-form');
const newCommentTextarea  = document.getElementById('new-comment');

// --- Functions ---

/**
 * TODO: Implement the getResourceIdFromURL function.
 * It should:
 * 1. Get the query string from `window.location.search`.
 * 2. Use the `URLSearchParams` object to get the value of the 'id' parameter.
 * 3. Return the id value (as a string).
 */
function getResourceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/**
 * TODO: Implement the renderResourceDetails function.
 * It takes one resource object { id, title, description, link }.
 * It should:
 * 1. Set the `textContent` of the title element (id="resource-title")
 *    to the resource's title.
 * 2. Set the `textContent` of the description element (id="resource-description")
 *    to the resource's description.
 * 3. Set the `href` attribute of the link element (id="resource-link")
 *    to the resource's link.
 */
function renderResourceDetails(resource) {
  resourceTitle.textContent       = resource.title;
  resourceDescription.textContent = resource.description;
  resourceLink.href               = resource.link;
}

/**
 * TODO: Implement the createCommentArticle function.
 * It takes one comment object { id, resource_id, author, text, created_at }.
 * It should return an <article> element matching the structure in `details.html`:
 * - A <p> containing the comment's text.
 * - A <footer> containing the comment's author
 *   (e.g., "Posted by: Ali Hassan").
 */
function createCommentArticle(comment) {
  const article = document.createElement('article');

  const p = document.createElement('p');
  p.textContent = comment.text;

  const footer = document.createElement('footer');
  footer.textContent = `Posted by: ${comment.author}`;

  article.appendChild(p);
  article.appendChild(footer);

  return article;
}

/**
 * TODO: Implement the renderComments function.
 * It should:
 * 1. Clear the comment list container (id="comment-list").
 * 2. Loop through the global `currentComments` array.
 * 3. For each comment, call `createCommentArticle()` and
 *    append the returned <article> to the comment list container.
 */
function renderComments() {
  commentList.innerHTML = '';
  currentComments.forEach(comment => {
    commentList.appendChild(createCommentArticle(comment));
  });
}

/**
 * TODO: Implement the handleAddComment function.
 * This is the event handler for the comment form's 'submit' event.
 * It should:
 * 1. Prevent the form's default submission.
 * 2. Get the text from the textarea (id="new-comment").
 * 3. If the text is empty, return early.
 * 4. Use `fetch()` to POST the new comment to the API:
 *    - URL: './api/index.php?action=comment'
 *    - Method: POST
 *    - Headers: { 'Content-Type': 'application/json' }
 *    - Body: JSON.stringify({
 *        resource_id: currentResourceId,
 *        author: 'Student',
 *        text: commentText
 *      })
 *      ('Student' is an acceptable hardcoded author for this exercise.)
 * 5. On success, add the new comment object returned by the API to the
 *    global `currentComments` array.
 * 6. Call `renderComments()` to refresh the comment list.
 * 7. Clear the textarea.
 */
async function handleAddComment(event) {
  event.preventDefault();

  const commentText = newCommentTextarea.value.trim();
  if (!commentText) return;

  const response = await fetch('./api/index.php?action=comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resource_id: currentResourceId,
      author: 'Student',
      text: commentText,
    }),
  });
  const result = await response.json();

  if (result.success) {
    currentComments.push(result.data);
    renderComments();
    newCommentTextarea.value = '';
  }
}

/**
 * TODO: Implement the initializePage function.
 * This function must be 'async'.
 * It should:
 * 1. Call `getResourceIdFromURL()` and store the result in `currentResourceId`.
 * 2. If no id is found, set the title element's textContent to
 *    "Resource not found." and stop.
 * 3. Fetch the resource details and its comments at the same time
 *    using Promise.all():
 *    - Resource URL:  `./api/index.php?id=${currentResourceId}`
 *      Response:      { success: true, data: { id, title, description, link, created_at } }
 *    - Comments URL:  `./api/index.php?resource_id=${currentResourceId}&action=comments`
 *      Response:      { success: true, data: [ ...comment objects ] }
 * 4. Store the comments array in the global `currentComments` variable.
 *    (If no comments exist, use an empty array.)
 * 5. If the resource is found:
 *    - Call `renderResourceDetails()` with the resource object.
 *    - Call `renderComments()` to display the initial comments.
 *    - Add the 'submit' event listener to the comment form
 *      (id="comment-form"), calling `handleAddComment`.
 * 6. If the resource is not found, display an error in the title element.
 */
async function initializePage() {
  currentResourceId = getResourceIdFromURL();

  if (!currentResourceId) {
    resourceTitle.textContent = 'Resource not found.';
    return;
  }

  const [resourceRes, commentsRes] = await Promise.all([
    fetch(`./api/index.php?id=${currentResourceId}`).then(r => r.json()),
    fetch(`./api/index.php?resource_id=${currentResourceId}&action=comments`).then(r => r.json()),
  ]);

  currentComments = (commentsRes.success && commentsRes.data) ? commentsRes.data : [];

  if (resourceRes.success && resourceRes.data) {
    renderResourceDetails(resourceRes.data);
    renderComments();
    commentForm.addEventListener('submit', handleAddComment);
  } else {
    resourceTitle.textContent = 'Resource not found.';
  }
}

// --- Initial Page Load ---
initializePage();