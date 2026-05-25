<?php
/**
 * PHPUnit Bootstrap
 *
 * Servers:
 *   1. Auth        — src/auth/api/         port 8765
 *   2. Admin       — src/admin/api/        port 8766
 *   3. Resources   — src/resources/api/    port 8767
 *   4. Weekly      — src/weekly/api/       port 8768
 *   5. Assignments — src/assignments/api/  port 8769
 *   6. Discussion  — src/discussion/api/   port 8770
 */

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
define('TEST_DB_PATH',  __DIR__ . '/auth_test.sqlite');
define('SERVER_HOST',   '127.0.0.1');
define('SERVER_PORT',   '8765');
define('SERVER_ROOT',   realpath(__DIR__ . '/../../src/auth/api'));
define('TEST_DB_SHIM',  SERVER_ROOT . '/db.php');
define('TEST_ROUTER',   SERVER_ROOT . '/router.php');

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
define('ADMIN_TEST_DB_PATH', __DIR__ . '/admin_test.sqlite');
define('ADMIN_SERVER_HOST',  '127.0.0.1');
define('ADMIN_SERVER_PORT',  '8766');
define('ADMIN_SERVER_ROOT',  realpath(__DIR__ . '/../../src/admin/api'));
define('ADMIN_TEST_DB_SHIM', ADMIN_SERVER_ROOT . '/db.php');
define('ADMIN_TEST_ROUTER',  ADMIN_SERVER_ROOT . '/router.php');

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------
define('RESOURCES_TEST_DB_PATH', __DIR__ . '/resources_test.sqlite');
define('RESOURCES_SERVER_HOST',  '127.0.0.1');
define('RESOURCES_SERVER_PORT',  '8767');
define('RESOURCES_SERVER_ROOT',  realpath(__DIR__ . '/../../src/resources/api'));
define('RESOURCES_TEST_DB_SHIM', RESOURCES_SERVER_ROOT . '/db.php');
define('RESOURCES_TEST_ROUTER',  RESOURCES_SERVER_ROOT . '/router.php');

// ---------------------------------------------------------------------------
// Weekly
// ---------------------------------------------------------------------------
define('WEEKLY_TEST_DB_PATH', __DIR__ . '/weekly_test.sqlite');
define('WEEKLY_SERVER_HOST',  '127.0.0.1');
define('WEEKLY_SERVER_PORT',  '8768');
define('WEEKLY_SERVER_ROOT',  realpath(__DIR__ . '/../../src/weekly/api'));
define('WEEKLY_TEST_DB_SHIM', WEEKLY_SERVER_ROOT . '/db.php');
define('WEEKLY_TEST_ROUTER',  WEEKLY_SERVER_ROOT . '/router.php');

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------
define('ASSIGNMENTS_TEST_DB_PATH', __DIR__ . '/assignments_test.sqlite');
define('ASSIGNMENTS_SERVER_HOST',  '127.0.0.1');
define('ASSIGNMENTS_SERVER_PORT',  '8769');
define('ASSIGNMENTS_SERVER_ROOT',  realpath(__DIR__ . '/../../src/assignments/api'));
define('ASSIGNMENTS_TEST_DB_SHIM', ASSIGNMENTS_SERVER_ROOT . '/db.php');
define('ASSIGNMENTS_TEST_ROUTER',  ASSIGNMENTS_SERVER_ROOT . '/router.php');

// ---------------------------------------------------------------------------
// Discussion
// ---------------------------------------------------------------------------
define('DISCUSSION_TEST_DB_PATH', __DIR__ . '/discussion_test.sqlite');
define('DISCUSSION_SERVER_HOST',  '127.0.0.1');
define('DISCUSSION_SERVER_PORT',  '8770');
define('DISCUSSION_SERVER_ROOT',  realpath(__DIR__ . '/../../src/discussion/api'));
define('DISCUSSION_TEST_DB_SHIM', DISCUSSION_SERVER_ROOT . '/db.php');
define('DISCUSSION_TEST_ROUTER',  DISCUSSION_SERVER_ROOT . '/router.php');


// ---------------------------------------------------------------------------
// Auth database
// ---------------------------------------------------------------------------
function buildAuthDatabase(): void
{
    if (file_exists(TEST_DB_PATH)) unlink(TEST_DB_PATH);
    $pdo = new PDO('sqlite:' . TEST_DB_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL, is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    $s = $pdo->prepare('INSERT INTO users (name,email,password,is_admin) VALUES (?,?,?,?)');
    $s->execute(['Ali Hassan','202101234@stu.uob.edu.bh',password_hash('password123',PASSWORD_DEFAULT),0]);
}

// ---------------------------------------------------------------------------
// Admin database
// ---------------------------------------------------------------------------
function buildAdminDatabase(): void
{
    if (file_exists(ADMIN_TEST_DB_PATH)) unlink(ADMIN_TEST_DB_PATH);
    $pdo = new PDO('sqlite:' . ADMIN_TEST_DB_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL, is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    $s = $pdo->prepare('INSERT INTO users (name,email,password,is_admin) VALUES (?,?,?,?)');
    $h = password_hash('password', PASSWORD_DEFAULT);
    $s->execute(['Course Admin',    'admin@uob.edu.bh',       $h, 1]);
    $s->execute(['Ali Hassan',      'ali@stu.uob.edu.bh',     $h, 0]);
    $s->execute(['Fatema Ahmed',    'fatema@stu.uob.edu.bh',  $h, 0]);
    $s->execute(['Mohamed Abdulla', 'mohamed@stu.uob.edu.bh', $h, 0]);
    $s->execute(['Noora Salman',    'noora@stu.uob.edu.bh',   $h, 0]);
}

// ---------------------------------------------------------------------------
// Resources database
// ---------------------------------------------------------------------------
function buildResourcesDatabase(): void
{
    if (file_exists(RESOURCES_TEST_DB_PATH)) unlink(RESOURCES_TEST_DB_PATH);
    $pdo = new PDO('sqlite:' . RESOURCES_TEST_DB_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec("CREATE TABLE resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
        description TEXT, link TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    $pdo->exec("CREATE TABLE comments_resource (
        id INTEGER PRIMARY KEY AUTOINCREMENT, resource_id INTEGER NOT NULL,
        author TEXT NOT NULL, text TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE)");
    $r = $pdo->prepare('INSERT INTO resources (title,description,link) VALUES (?,?,?)');
    $r->execute(['Course Syllabus','Complete course outline.','https://www.uob.edu.bh/courses/web-dev/syllabus.pdf']);
    $r->execute(['MDN Web Docs','Mozilla documentation.','https://developer.mozilla.org/en-US/']);
    $r->execute(['W3Schools HTML Tutorial','HTML tutorial.','https://www.w3schools.com/html/']);
    $r->execute(['CSS Tricks','CSS articles.','https://css-tricks.com/']);
    $r->execute(['JavaScript.info','JS tutorial.','https://javascript.info/']);
    $c = $pdo->prepare('INSERT INTO comments_resource (resource_id,author,text) VALUES (?,?,?)');
    $c->execute([1,'Fatema Ahmed','The syllabus is very clear. Thank you!']);
    $c->execute([2,'Noora Salman','MDN is my go-to resource!']);
    $c->execute([3,'Mohamed Abdulla','W3Schools examples are helpful.']);
    $c->execute([4,'Ali Hassan','CSS Tricks helped me understand Flexbox.']);
}

// ---------------------------------------------------------------------------
// Weekly database
// ---------------------------------------------------------------------------
function buildWeeklyDatabase(): void
{
    if (file_exists(WEEKLY_TEST_DB_PATH)) unlink(WEEKLY_TEST_DB_PATH);
    $pdo = new PDO('sqlite:' . WEEKLY_TEST_DB_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec("CREATE TABLE weeks (
        id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
        start_date TEXT NOT NULL, description TEXT, links TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    $pdo->exec("CREATE TABLE comments_week (
        id INTEGER PRIMARY KEY AUTOINCREMENT, week_id INTEGER NOT NULL,
        author TEXT NOT NULL, text TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE)");
    $w = $pdo->prepare('INSERT INTO weeks (title,start_date,description,links) VALUES (?,?,?,?)');
    $w->execute(['Week 1: Introduction to HTML','2025-01-13','Learn HTML fundamentals.',json_encode(['https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML','https://www.w3schools.com/html/html_intro.asp'])]);
    $w->execute(['Week 2: CSS Fundamentals','2025-01-20','Master CSS selectors.',json_encode(['https://developer.mozilla.org/en-US/docs/Learn/CSS','https://www.w3schools.com/css/'])]);
    $w->execute(['Week 3: Responsive Design','2025-01-27','Create mobile-friendly websites.',json_encode(['https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design','https://css-tricks.com/snippets/css/a-guide-to-flexbox/'])]);
    $w->execute(['Week 4: JavaScript Basics','2025-02-03','Introduction to JavaScript.',json_encode(['https://javascript.info/first-steps','https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps'])]);
    $w->execute(['Week 5: DOM Manipulation','2025-02-10','Learn to interact with the DOM.',json_encode(['https://javascript.info/document','https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model'])]);
    $c = $pdo->prepare('INSERT INTO comments_week (week_id,author,text) VALUES (?,?,?)');
    $c->execute([1,'Fatema Ahmed','The HTML basics were easy to follow. Great examples!']);
    $c->execute([1,'Zainab Ebrahim','Could you add more examples of semantic HTML elements?']);
    $c->execute([2,'Mohamed Abdulla','The CSS box model explanation was very clear.']);
    $c->execute([3,'Ali Hassan','Responsive design is challenging but interesting!']);
    $c->execute([4,'Noora Salman','JavaScript is more fun than I expected!']);
}

// ---------------------------------------------------------------------------
// Assignments database
// ---------------------------------------------------------------------------
function buildAssignmentsDatabase(): void
{
    if (file_exists(ASSIGNMENTS_TEST_DB_PATH)) unlink(ASSIGNMENTS_TEST_DB_PATH);
    $pdo = new PDO('sqlite:' . ASSIGNMENTS_TEST_DB_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec("CREATE TABLE assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
        description TEXT, due_date TEXT NOT NULL, files TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    $pdo->exec("CREATE TABLE comments_assignment (
        id INTEGER PRIMARY KEY AUTOINCREMENT, assignment_id INTEGER NOT NULL,
        author TEXT NOT NULL, text TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE)");
    $a = $pdo->prepare('INSERT INTO assignments (title,description,due_date,files) VALUES (?,?,?,?)');
    $a->execute(['HTML & CSS Portfolio','Create a responsive portfolio website using HTML5 and CSS3. Must include: header, navigation, main content area, and footer.','2025-02-15',json_encode(['https://example.com/files/assignment1-brief.pdf','https://example.com/files/starter-template.zip'])]);
    $a->execute(['JavaScript Interactivity','Add interactive features to your portfolio using vanilla JavaScript. Include form validation and dynamic content loading.','2025-03-01',json_encode(['https://example.com/files/assignment2-brief.pdf'])]);
    $a->execute(['Final Project Proposal','Submit a detailed proposal for your final web application project including wireframes and technology stack.','2025-03-20',json_encode([])]);
    $c = $pdo->prepare('INSERT INTO comments_assignment (assignment_id,author,text) VALUES (?,?,?)');
    $c->execute([1,'Mohamed Abdulla','Is it okay to use Flexbox for the layout instead of floats?']);
    $c->execute([1,'Course Admin','Absolutely! Flexbox and CSS Grid are the modern approaches and are preferred.']);
    $c->execute([1,'Zainab Ebrahim','Can we include JavaScript animations?']);
    $c->execute([1,'Course Admin','For Assignment 1, focus on HTML and CSS. We will add JavaScript in Assignment 2.']);
    $c->execute([2,'Ali Hassan','Do we need to support Internet Explorer?']);
    $c->execute([2,'Course Admin','No, you can use modern JavaScript (ES6+). Focus on Chrome, Firefox, and Safari.']);
}

// ---------------------------------------------------------------------------
// Discussion database
// Mirrors: topics + replies tables from schema.sql
// ---------------------------------------------------------------------------
function buildDiscussionDatabase(): void
{
    if (file_exists(DISCUSSION_TEST_DB_PATH)) unlink(DISCUSSION_TEST_DB_PATH);
    $pdo = new PDO('sqlite:' . DISCUSSION_TEST_DB_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON');

    $pdo->exec("CREATE TABLE topics (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        subject    TEXT    NOT NULL,
        message    TEXT    NOT NULL,
        author     TEXT    NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE replies (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        topic_id   INTEGER NOT NULL,
        text       TEXT    NOT NULL,
        author     TEXT    NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    )");

    $t = $pdo->prepare('INSERT INTO topics (subject,message,author) VALUES (?,?,?)');
    $t->execute(['Welcome to Web Development!','Welcome everyone! Please introduce yourself and share what you hope to learn in this course.','Course Admin']);
    $t->execute(['Assignment 1 Discussion','Questions and discussions about the HTML & CSS Portfolio assignment.','Ali Hassan']);
    $t->execute(['Best CSS Framework?','What CSS framework do you recommend for beginners? Bootstrap, Tailwind, or pure CSS?','Fatema Ahmed']);

    $r = $pdo->prepare('INSERT INTO replies (topic_id,text,author) VALUES (?,?,?)');
    $r->execute([1,'Hi everyone! I am Ali from Bahrain. Excited to learn web development!','Ali Hassan']);
    $r->execute([1,'Hello! I am Fatema. I want to become a frontend developer.','Fatema Ahmed']);
    $r->execute([1,'Welcome everyone! This will be a great journey.','Course Admin']);
    $r->execute([2,'Can we use CSS Grid for the layout?','Mohamed Abdulla']);
    $r->execute([2,'Yes, both Flexbox and CSS Grid are acceptable for this assignment.','Course Admin']);
    $r->execute([3,'I would recommend starting with pure CSS to understand the fundamentals.','Course Admin']);
    $r->execute([3,'Bootstrap is great for rapid prototyping!','Noora Salman']);
}

// ---------------------------------------------------------------------------
// Write db.php shim
// ---------------------------------------------------------------------------
function writeDbShim(string $shimPath, string $dbPath): void
{
    file_put_contents($shimPath, <<<PHP
<?php
function getDBConnection(): PDO {
    static \$pdo = null;
    if (\$pdo === null) {
        \$pdo = new PDO('sqlite:$dbPath');
        \$pdo->setAttribute(PDO::ATTR_ERRMODE,            PDO::ERRMODE_EXCEPTION);
        \$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        \$pdo->exec('PRAGMA foreign_keys = ON');
    }
    return \$pdo;
}
PHP);
}

// ---------------------------------------------------------------------------
// Write router.php shim
// ---------------------------------------------------------------------------
function writeRouter(string $routerPath): void
{
    file_put_contents($routerPath, <<<'PHP'
<?php
chdir(__DIR__);
require_once __DIR__ . '/db.php';
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($uri !== '/' && $uri !== '/index.php') { return false; }
require __DIR__ . '/index.php';
PHP);
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------
register_shutdown_function(function () {
    foreach ([
        TEST_DB_SHIM,              TEST_ROUTER,              TEST_DB_PATH,
        ADMIN_TEST_DB_SHIM,        ADMIN_TEST_ROUTER,        ADMIN_TEST_DB_PATH,
        RESOURCES_TEST_DB_SHIM,    RESOURCES_TEST_ROUTER,    RESOURCES_TEST_DB_PATH,
        WEEKLY_TEST_DB_SHIM,       WEEKLY_TEST_ROUTER,       WEEKLY_TEST_DB_PATH,
        ASSIGNMENTS_TEST_DB_SHIM,  ASSIGNMENTS_TEST_ROUTER,  ASSIGNMENTS_TEST_DB_PATH,
        DISCUSSION_TEST_DB_SHIM,   DISCUSSION_TEST_ROUTER,   DISCUSSION_TEST_DB_PATH,
    ] as $file) {
        if (file_exists($file)) unlink($file);
    }
});

// ---------------------------------------------------------------------------
// Run all setup
// ---------------------------------------------------------------------------
buildAuthDatabase();
writeDbShim(TEST_DB_SHIM,              TEST_DB_PATH);
writeRouter(TEST_ROUTER);

buildAdminDatabase();
writeDbShim(ADMIN_TEST_DB_SHIM,        ADMIN_TEST_DB_PATH);
writeRouter(ADMIN_TEST_ROUTER);

buildResourcesDatabase();
writeDbShim(RESOURCES_TEST_DB_SHIM,    RESOURCES_TEST_DB_PATH);
writeRouter(RESOURCES_TEST_ROUTER);

buildWeeklyDatabase();
writeDbShim(WEEKLY_TEST_DB_SHIM,       WEEKLY_TEST_DB_PATH);
writeRouter(WEEKLY_TEST_ROUTER);

buildAssignmentsDatabase();
writeDbShim(ASSIGNMENTS_TEST_DB_SHIM,  ASSIGNMENTS_TEST_DB_PATH);
writeRouter(ASSIGNMENTS_TEST_ROUTER);

buildDiscussionDatabase();
writeDbShim(DISCUSSION_TEST_DB_SHIM,   DISCUSSION_TEST_DB_PATH);
writeRouter(DISCUSSION_TEST_ROUTER);
