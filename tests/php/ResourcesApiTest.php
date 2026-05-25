<?php

declare(strict_types=1);

use GuzzleHttp\Client;
use PHPUnit\Framework\TestCase;

/**
 * PHPUnit Tests for src/resources/api/index.php
 *
 * Starts a real `php -S` development server pointing at src/resources/api/.
 * The student's index.php is completely unmodified.
 *
 * Each test is worth 1 point.
 */
class ResourcesApiTest extends TestCase
{
    /** @var resource|null */
    private static $serverProcess = null;

    private static Client $client;

    // -----------------------------------------------------------------------
    // Boot the server once for the whole class
    // -----------------------------------------------------------------------
    public static function setUpBeforeClass(): void
    {
        $host   = RESOURCES_SERVER_HOST;
        $port   = RESOURCES_SERVER_PORT;
        $root   = RESOURCES_SERVER_ROOT;   // path to src/resources/api
        $router = RESOURCES_TEST_ROUTER;   // injects db connection before each request

        $cmd = sprintf(
            'php -S %s:%s -t %s %s',
            $host,
            $port,
            escapeshellarg($root),
            escapeshellarg($router)
        );

        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        self::$serverProcess = proc_open($cmd, $descriptors, $pipes);

        // Wait up to 5 seconds for the server to accept connections
        $start = time();
        while (time() - $start < 5) {
            $conn = @fsockopen($host, (int) $port, $errno, $errstr, 1);
            if ($conn !== false) {
                fclose($conn);
                break;
            }
            usleep(100_000);
        }

        self::$client = new Client([
            'base_uri'    => "http://{$host}:{$port}",
            'http_errors' => false,
            'timeout'     => 5,
        ]);
    }

    // -----------------------------------------------------------------------
    // Kill the server after all tests
    // -----------------------------------------------------------------------
    public static function tearDownAfterClass(): void
    {
        if (self::$serverProcess !== null) {
            proc_terminate(self::$serverProcess);
            proc_close(self::$serverProcess);
            self::$serverProcess = null;
        }
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------
    private function get(array $query = []): array
    {
        $uri      = '/index.php' . (empty($query) ? '' : '?' . http_build_query($query));
        $response = self::$client->get($uri);
        $raw      = (string) $response->getBody();
        $decoded  = json_decode($raw, true);
        $this->assertNotNull($decoded, 'Expected valid JSON. Got: ' . $raw);
        return $decoded;
    }

    private function post(array $body, array $query = []): array
    {
        $uri      = '/index.php' . (empty($query) ? '' : '?' . http_build_query($query));
        $response = self::$client->post($uri, ['json' => $body]);
        $raw      = (string) $response->getBody();
        $decoded  = json_decode($raw, true);
        $this->assertNotNull($decoded, 'Expected valid JSON. Got: ' . $raw);
        return $decoded;
    }

    private function put(array $body): array
    {
        $response = self::$client->put('/index.php', ['json' => $body]);
        $raw      = (string) $response->getBody();
        $decoded  = json_decode($raw, true);
        $this->assertNotNull($decoded, 'Expected valid JSON. Got: ' . $raw);
        return $decoded;
    }

    private function delete(array $query): array
    {
        $uri      = '/index.php?' . http_build_query($query);
        $response = self::$client->delete($uri);
        $raw      = (string) $response->getBody();
        $decoded  = json_decode($raw, true);
        $this->assertNotNull($decoded, 'Expected valid JSON. Got: ' . $raw);
        return $decoded;
    }

    private function httpStatusFor(
        string $method,
        array  $body  = [],
        array  $query = []
    ): int {
        $uri     = '/index.php' . (empty($query) ? '' : '?' . http_build_query($query));
        $options = empty($body) ? [] : ['json' => $body];
        return self::$client->request($method, $uri, $options)->getStatusCode();
    }

    // -----------------------------------------------------------------------
    // [PHP-01] GET returns success:true with a data array
    // -----------------------------------------------------------------------
    public function testGetAllResourcesReturnsSuccessAndDataArray(): void
    {
        $response = $this->get();
        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);
        $this->assertIsArray($response['data']);
    }

    // -----------------------------------------------------------------------
    // [PHP-02] GET returns the seeded resources
    // -----------------------------------------------------------------------
    public function testGetAllResourcesIncludesSeededResources(): void
    {
        $response = $this->get();
        $titles   = array_column($response['data'], 'title');
        $this->assertContains('MDN Web Docs',    $titles);
        $this->assertContains('Course Syllabus', $titles);
    }

    // -----------------------------------------------------------------------
    // [PHP-03] GET returns id, title, description, link, created_at fields
    // -----------------------------------------------------------------------
    public function testGetAllResourcesReturnsExpectedFields(): void
    {
        $response = $this->get();
        $this->assertNotEmpty($response['data']);

        $first = $response['data'][0];
        foreach (['id', 'title', 'description', 'link', 'created_at'] as $field) {
            $this->assertArrayHasKey(
                $field,
                $first,
                "Field '{$field}' missing from resource object."
            );
        }
    }

    // -----------------------------------------------------------------------
    // [PHP-04] GET ?id=<valid> returns the correct single resource
    // -----------------------------------------------------------------------
    public function testGetResourceByIdReturnsCorrectResource(): void
    {
        $all     = $this->get();
        $firstId = $all['data'][0]['id'];

        $response = $this->get(['id' => $firstId]);
        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);
        $this->assertSame((int) $firstId, (int) $response['data']['id']);
    }

    // -----------------------------------------------------------------------
    // [PHP-05] GET ?id=99999 returns HTTP 404
    // -----------------------------------------------------------------------
    public function testGetResourceByIdReturns404ForUnknownId(): void
    {
        $status = $this->httpStatusFor('GET', [], ['id' => 99999]);
        $this->assertSame(404, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-06] Content-Type header is application/json
    // -----------------------------------------------------------------------
    public function testResponseContentTypeIsJson(): void
    {
        $response    = self::$client->get('/index.php');
        $contentType = $response->getHeaderLine('Content-Type');
        $this->assertStringContainsString('application/json', $contentType);
    }

    // -----------------------------------------------------------------------
    // [PHP-07] GET ?search= filters by title or description
    // -----------------------------------------------------------------------
    public function testSearchFiltersByTitleOrDescription(): void
    {
        $response = $this->get(['search' => 'MDN']);
        $this->assertTrue($response['success']);
        $this->assertNotEmpty($response['data']);
        foreach ($response['data'] as $resource) {
            $haystack = strtolower($resource['title'] . ' ' . $resource['description']);
            $this->assertStringContainsString('mdn', $haystack);
        }
    }

    // -----------------------------------------------------------------------
    // [PHP-08] POST creates a new resource and returns HTTP 201
    // -----------------------------------------------------------------------
    public function testCreateResourceReturns201(): void
    {
        $status = $this->httpStatusFor('POST', [
            'title'       => 'Test Resource',
            'description' => 'A test resource.',
            'link'        => 'https://test-resource.example.com',
        ]);
        $this->assertSame(201, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-09] POST response includes the new resource id
    // -----------------------------------------------------------------------
    public function testCreateResourceReturnsNewId(): void
    {
        $response = $this->post([
            'title'       => 'Another Resource',
            'description' => 'Description here.',
            'link'        => 'https://another.example.com',
        ]);
        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('id', $response);
        $this->assertIsNumeric($response['id']);
    }

    // -----------------------------------------------------------------------
    // [PHP-10] POST with missing title returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateResourceRejects400WhenTitleMissing(): void
    {
        $status = $this->httpStatusFor('POST', [
            'description' => 'No title here.',
            'link'        => 'https://notitle.example.com',
        ]);
        $this->assertSame(400, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-11] POST with missing link returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateResourceRejects400WhenLinkMissing(): void
    {
        $status = $this->httpStatusFor('POST', [
            'title'       => 'No Link Resource',
            'description' => 'This has no link.',
        ]);
        $this->assertSame(400, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-12] POST with invalid URL returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateResourceRejects400ForInvalidUrl(): void
    {
        $status = $this->httpStatusFor('POST', [
            'title'       => 'Bad URL Resource',
            'description' => 'Invalid link.',
            'link'        => 'not-a-valid-url',
        ]);
        $this->assertSame(400, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-13] PUT updates an existing resource's title
    // -----------------------------------------------------------------------
    public function testUpdateResourceTitle(): void
    {
        $all  = $this->get();
        $res  = $all['data'][0];

        $response = $this->put([
            'id'    => $res['id'],
            'title' => 'Updated Title',
        ]);
        $this->assertTrue($response['success']);

        // Confirm the change persisted
        $updated = $this->get(['id' => $res['id']]);
        $this->assertSame('Updated Title', $updated['data']['title']);
    }

    // -----------------------------------------------------------------------
    // [PHP-14] PUT with unknown id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testUpdateResourceReturns404ForUnknownId(): void
    {
        $status = $this->httpStatusFor('PUT', [
            'id'    => 99999,
            'title' => 'Ghost',
        ]);
        $this->assertSame(404, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-15] PUT with invalid link returns HTTP 400
    // -----------------------------------------------------------------------
    public function testUpdateResourceRejects400ForInvalidLink(): void
    {
        $all = $this->get();
        $id  = $all['data'][0]['id'];

        $status = $this->httpStatusFor('PUT', [
            'id'   => $id,
            'link' => 'not-a-url',
        ]);
        $this->assertSame(400, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-16] DELETE removes a resource successfully
    // -----------------------------------------------------------------------
    public function testDeleteResourceSucceeds(): void
    {
        // Create a throwaway resource
        $created  = $this->post([
            'title'       => 'To Be Deleted',
            'description' => 'Will be gone soon.',
            'link'        => 'https://delete-me.example.com',
        ]);
        $deleteId = $created['id'];

        $response = $this->delete(['id' => $deleteId]);
        $this->assertTrue($response['success']);

        // Confirm it is gone
        $status = $this->httpStatusFor('GET', [], ['id' => $deleteId]);
        $this->assertSame(404, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-17] DELETE with unknown id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testDeleteResourceReturns404ForUnknownId(): void
    {
        $status = $this->httpStatusFor('DELETE', [], ['id' => 99999]);
        $this->assertSame(404, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-18] GET ?resource_id=<id>&action=comments returns comments array
    // -----------------------------------------------------------------------
    public function testGetCommentsByResourceIdReturnsArray(): void
    {
        $all        = $this->get();
        $resourceId = $all['data'][0]['id'];

        $response = $this->get([
            'resource_id' => $resourceId,
            'action'      => 'comments',
        ]);

        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);
        $this->assertIsArray($response['data']);
    }

    // -----------------------------------------------------------------------
    // [PHP-19] GET ?action=comments returns seeded comments for resource
    // -----------------------------------------------------------------------
public function testGetCommentsReturnsSeededComments(): void
{
    // Create a dedicated resource for this test so we are not affected
    // by other tests mutating seeded data.
    $resource = $this->post([
        'title'       => 'Comments Test Resource',
        'description' => 'Used only by testGetCommentsReturnsSeededComments.',
        'link'        => 'https://comments-test.example.com',
    ]);

    $this->assertTrue($resource['success'], 'Failed to create test resource.');
    $resourceId = $resource['id'];

    // Add a known comment to that resource.
    $comment = $this->post(
        [
            'resource_id' => $resourceId,
            'author'      => 'Fatema Ahmed',
            'text'        => 'The syllabus is very clear. Thank you!',
        ],
        ['action' => 'comment']
    );

    $this->assertTrue($comment['success'], 'Failed to create test comment.');

    // Now fetch comments for the resource and assert.
    $response = $this->get([
        'resource_id' => $resourceId,
        'action'      => 'comments',
    ]);

    $this->assertTrue($response['success']);
    $this->assertArrayHasKey('data', $response);
    $this->assertIsArray($response['data']);
    $this->assertNotEmpty($response['data'], 'Expected at least one comment.');

    $authors = array_column($response['data'], 'author');
    $this->assertContains('Fatema Ahmed', $authors);
}
    // -----------------------------------------------------------------------
    // [PHP-20] POST ?action=comment creates a comment and returns HTTP 201
    // -----------------------------------------------------------------------
    public function testCreateCommentReturns201(): void
    {
        $all        = $this->get();
        $resourceId = $all['data'][0]['id'];

        $status = $this->httpStatusFor(
            'POST',
            [
                'resource_id' => $resourceId,
                'author'      => 'Test Student',
                'text'        => 'This is a test comment.',
            ],
            ['action' => 'comment']
        );
        $this->assertSame(201, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-21] POST ?action=comment with missing text returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateCommentRejects400WhenTextMissing(): void
    {
        $all        = $this->get();
        $resourceId = $all['data'][0]['id'];

        $status = $this->httpStatusFor(
            'POST',
            [
                'resource_id' => $resourceId,
                'author'      => 'Test Student',
            ],
            ['action' => 'comment']
        );
        $this->assertSame(400, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-22] POST ?action=comment with invalid resource_id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testCreateCommentReturns404ForUnknownResource(): void
    {
        $status = $this->httpStatusFor(
            'POST',
            [
                'resource_id' => 99999,
                'author'      => 'Ghost',
                'text'        => 'This resource does not exist.',
            ],
            ['action' => 'comment']
        );
        $this->assertSame(404, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-23] DELETE ?comment_id=<id>&action=delete_comment removes comment
    // -----------------------------------------------------------------------
    public function testDeleteCommentSucceeds(): void
    {
        // Create a resource and a comment to delete
        $resource  = $this->post([
            'title'       => 'Comment Target',
            'description' => '',
            'link'        => 'https://comment-target.example.com',
        ]);
        $resourceId = $resource['id'];

        $comment = $this->post(
            [
                'resource_id' => $resourceId,
                'author'      => 'To Delete',
                'text'        => 'Delete this comment.',
            ],
            ['action' => 'comment']
        );
        $commentId = $comment['id'];

        $response = $this->delete([
            'comment_id' => $commentId,
            'action'     => 'delete_comment',
        ]);
        $this->assertTrue($response['success']);
    }

    // -----------------------------------------------------------------------
    // [PHP-24] DELETE ?action=delete_comment with unknown id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testDeleteCommentReturns404ForUnknownId(): void
    {
        $status = $this->httpStatusFor(
            'DELETE',
            [],
            ['comment_id' => 99999, 'action' => 'delete_comment']
        );
        $this->assertSame(404, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-25] Unsupported HTTP method returns HTTP 405
    // -----------------------------------------------------------------------
    public function testUnsupportedMethodReturns405(): void
    {
        $status = $this->httpStatusFor('PATCH');
        $this->assertSame(405, $status);
    }
}
