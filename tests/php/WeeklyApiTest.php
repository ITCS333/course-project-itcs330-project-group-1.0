<?php

declare(strict_types=1);

use GuzzleHttp\Client;
use PHPUnit\Framework\TestCase;

/**
 * PHPUnit Tests for src/weekly/api/index.php
 *
 * Starts a real php -S development server pointing at src/weekly/api/.
 * The student's index.php is completely unmodified.
 *
 * Each test is worth 1 point.
 */
class WeeklyApiTest extends TestCase
{
    /** @var resource|null */
    private static $serverProcess = null;

    private static Client $client;

    // -----------------------------------------------------------------------
    // Boot the server once for the whole class
    // -----------------------------------------------------------------------
    public static function setUpBeforeClass(): void
    {
        $host   = WEEKLY_SERVER_HOST;
        $port   = WEEKLY_SERVER_PORT;
        $root   = WEEKLY_SERVER_ROOT;
        $router = WEEKLY_TEST_ROUTER;

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

    private function httpStatusFor(string $method, array $body = [], array $query = []): int
    {
        $uri     = '/index.php' . (empty($query) ? '' : '?' . http_build_query($query));
        $options = empty($body) ? [] : ['json' => $body];
        return self::$client->request($method, $uri, $options)->getStatusCode();
    }

    // -----------------------------------------------------------------------
    // [PHP-01] GET returns success:true with a data array
    // -----------------------------------------------------------------------
    public function testGetAllWeeksReturnsSuccessAndDataArray(): void
    {
        $response = $this->get();
        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);
        $this->assertIsArray($response['data']);
    }

    // -----------------------------------------------------------------------
    // [PHP-02] GET returns the seeded weeks
    // -----------------------------------------------------------------------
    public function testGetAllWeeksIncludesSeededWeeks(): void
    {
        $response = $this->get();
        $titles   = array_column($response['data'], 'title');
        $this->assertContains('Week 1: Introduction to HTML', $titles);
        $this->assertContains('Week 2: CSS Fundamentals',     $titles);
    }

    // -----------------------------------------------------------------------
    // [PHP-03] GET returns expected fields including links as an array
    // -----------------------------------------------------------------------
    public function testGetAllWeeksReturnsExpectedFields(): void
    {
        $response = $this->get();
        $this->assertNotEmpty($response['data']);
        $first = $response['data'][0];
        foreach (['id', 'title', 'start_date', 'description', 'links', 'created_at'] as $field) {
            $this->assertArrayHasKey($field, $first, "Field '{$field}' missing.");
        }
        $this->assertIsArray($first['links'], "'links' must be decoded to an array.");
    }

    // -----------------------------------------------------------------------
    // [PHP-04] GET ?id=<valid> returns the correct single week
    // -----------------------------------------------------------------------
    public function testGetWeekByIdReturnsCorrectWeek(): void
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
    public function testGetWeekByIdReturns404ForUnknownId(): void
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
        $response = $this->get(['search' => 'CSS']);
        $this->assertTrue($response['success']);
        $this->assertNotEmpty($response['data']);
        foreach ($response['data'] as $week) {
            $haystack = strtolower($week['title'] . ' ' . $week['description']);
            $this->assertStringContainsString('css', $haystack);
        }
    }

    // -----------------------------------------------------------------------
    // [PHP-08] POST creates a new week and returns HTTP 201
    // -----------------------------------------------------------------------
    public function testCreateWeekReturns201(): void
    {
        $status = $this->httpStatusFor('POST', [
            'title'       => 'Test Week',
            'start_date'  => '2025-06-01',
            'description' => 'A test week.',
            'links'       => [],
        ]);
        $this->assertSame(201, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-09] POST response includes the new week id
    // -----------------------------------------------------------------------
    public function testCreateWeekReturnsNewId(): void
    {
        $response = $this->post([
            'title'       => 'Another Test Week',
            'start_date'  => '2025-06-08',
            'description' => 'Description here.',
            'links'       => ['https://example.com'],
        ]);
        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('id', $response);
        $this->assertIsNumeric($response['id']);
    }

    // -----------------------------------------------------------------------
    // [PHP-10] POST with missing title returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateWeekRejects400WhenTitleMissing(): void
    {
        $status = $this->httpStatusFor('POST', [
            'start_date'  => '2025-06-15',
            'description' => 'No title.',
        ]);
        $this->assertSame(400, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-11] POST with missing start_date returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateWeekRejects400WhenStartDateMissing(): void
    {
        $status = $this->httpStatusFor('POST', [
            'title'       => 'No Date Week',
            'description' => 'Missing date.',
        ]);
        $this->assertSame(400, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-12] POST with invalid start_date format returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateWeekRejects400ForInvalidDateFormat(): void
    {
        $status = $this->httpStatusFor('POST', [
            'title'       => 'Bad Date Week',
            'start_date'  => '01-06-2025',
            'description' => 'Wrong date format.',
        ]);
        $this->assertSame(400, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-13] PUT updates an existing week's title
    // -----------------------------------------------------------------------
    public function testUpdateWeekTitle(): void
    {
        $all  = $this->get();
        $week = $all['data'][0];

        $response = $this->put([
            'id'    => $week['id'],
            'title' => 'Updated Week Title',
        ]);
        $this->assertTrue($response['success']);

        $updated = $this->get(['id' => $week['id']]);
        $this->assertSame('Updated Week Title', $updated['data']['title']);
    }

    // -----------------------------------------------------------------------
    // [PHP-14] PUT with unknown id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testUpdateWeekReturns404ForUnknownId(): void
    {
        $status = $this->httpStatusFor('PUT', [
            'id'    => 99999,
            'title' => 'Ghost Week',
        ]);
        $this->assertSame(404, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-15] PUT with invalid start_date returns HTTP 400
    // -----------------------------------------------------------------------
    public function testUpdateWeekRejects400ForInvalidDate(): void
    {
        $all = $this->get();
        $id  = $all['data'][0]['id'];

        $status = $this->httpStatusFor('PUT', [
            'id'         => $id,
            'start_date' => 'not-a-date',
        ]);
        $this->assertSame(400, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-16] DELETE removes a week successfully
    // -----------------------------------------------------------------------
    public function testDeleteWeekSucceeds(): void
    {
        $created = $this->post([
            'title'       => 'To Be Deleted',
            'start_date'  => '2025-12-01',
            'description' => 'Will be gone soon.',
            'links'       => [],
        ]);
        $deleteId = $created['id'];

        $response = $this->delete(['id' => $deleteId]);
        $this->assertTrue($response['success']);

        $status = $this->httpStatusFor('GET', [], ['id' => $deleteId]);
        $this->assertSame(404, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-17] DELETE with unknown id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testDeleteWeekReturns404ForUnknownId(): void
    {
        $status = $this->httpStatusFor('DELETE', [], ['id' => 99999]);
        $this->assertSame(404, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-18] GET ?action=comments&week_id=<id> returns comments array
    // -----------------------------------------------------------------------
    public function testGetCommentsByWeekIdReturnsArray(): void
    {
        $all    = $this->get();
        $weekId = $all['data'][0]['id'];

        $response = $this->get([
            'action'  => 'comments',
            'week_id' => $weekId,
        ]);

        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);
        $this->assertIsArray($response['data']);
    }

    // -----------------------------------------------------------------------
    // [PHP-19] GET ?action=comments returns seeded comments for a week
    // -----------------------------------------------------------------------
    public function testGetCommentsReturnsSeededComments(): void
    {
        // Create a dedicated week and comment so this test is self-contained.
        $week = $this->post([
            'title'       => 'Comments Test Week',
            'start_date'  => '2025-11-01',
            'description' => 'Used by testGetCommentsReturnsSeededComments.',
            'links'       => [],
        ]);
        $this->assertTrue($week['success'], 'Failed to create test week.');
        $weekId = $week['id'];

        $comment = $this->post(
            [
                'week_id' => $weekId,
                'author'  => 'Fatema Ahmed',
                'text'    => 'The HTML basics were easy to follow.',
            ],
            ['action' => 'comment']
        );
        $this->assertTrue($comment['success'], 'Failed to create test comment.');

        $response = $this->get(['action' => 'comments', 'week_id' => $weekId]);
        $this->assertTrue($response['success']);
        $this->assertNotEmpty($response['data']);

        $authors = array_column($response['data'], 'author');
        $this->assertContains('Fatema Ahmed', $authors);
    }

    // -----------------------------------------------------------------------
    // [PHP-20] POST ?action=comment creates a comment and returns HTTP 201
    // -----------------------------------------------------------------------
    public function testCreateCommentReturns201(): void
    {
        $all    = $this->get();
        $weekId = $all['data'][0]['id'];

        $status = $this->httpStatusFor(
            'POST',
            [
                'week_id' => $weekId,
                'author'  => 'Test Student',
                'text'    => 'This is a test comment.',
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
        $all    = $this->get();
        $weekId = $all['data'][0]['id'];

        $status = $this->httpStatusFor(
            'POST',
            [
                'week_id' => $weekId,
                'author'  => 'Test Student',
            ],
            ['action' => 'comment']
        );
        $this->assertSame(400, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-22] POST ?action=comment with unknown week_id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testCreateCommentReturns404ForUnknownWeek(): void
    {
        $status = $this->httpStatusFor(
            'POST',
            [
                'week_id' => 99999,
                'author'  => 'Ghost',
                'text'    => 'This week does not exist.',
            ],
            ['action' => 'comment']
        );
        $this->assertSame(404, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-23] DELETE ?action=delete_comment&comment_id=<id> removes comment
    // -----------------------------------------------------------------------
    public function testDeleteCommentSucceeds(): void
    {
        $week = $this->post([
            'title'       => 'Comment Target Week',
            'start_date'  => '2025-11-10',
            'description' => '',
            'links'       => [],
        ]);
        $weekId = $week['id'];

        $comment = $this->post(
            [
                'week_id' => $weekId,
                'author'  => 'To Delete',
                'text'    => 'Delete this comment.',
            ],
            ['action' => 'comment']
        );
        $commentId = $comment['id'];

        $response = $this->delete([
            'action'     => 'delete_comment',
            'comment_id' => $commentId,
        ]);
        $this->assertTrue($response['success']);
    }

    // -----------------------------------------------------------------------
    // [PHP-24] DELETE ?action=delete_comment with unknown id → HTTP 404
    // -----------------------------------------------------------------------
    public function testDeleteCommentReturns404ForUnknownId(): void
    {
        $status = $this->httpStatusFor(
            'DELETE',
            [],
            ['action' => 'delete_comment', 'comment_id' => 99999]
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
