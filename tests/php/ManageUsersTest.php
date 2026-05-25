<?php

declare(strict_types=1);

use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;
use PHPUnit\Framework\TestCase;

/**
 * PHPUnit Tests for src/admin/api/index.php
 *
 * Starts a real php -S development server with a router script that
 * injects db.php before every request. The student's index.php is
 * completely unmodified.
 *
 * Each test is worth 1 point.
 */
class ManageUsersTest extends TestCase
{
    /** @var resource|null */
    private static $serverProcess = null;

    private static Client $client;

    // -----------------------------------------------------------------------
    // Boot the server once for the whole class
    // -----------------------------------------------------------------------
    public static function setUpBeforeClass(): void
    {
        $host   = ADMIN_SERVER_HOST;
        $port   = ADMIN_SERVER_PORT;
        $root   = ADMIN_SERVER_ROOT;
        $router = ADMIN_TEST_ROUTER;

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
    // [PHP-01] GET /index.php returns success: true with a data array
    // -----------------------------------------------------------------------
    public function testGetAllUsersReturnsSuccessAndDataArray(): void
    {
        $response = $this->get();
        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);
        $this->assertIsArray($response['data']);
    }

    // -----------------------------------------------------------------------
    // [PHP-02] GET returns the seeded users (at least the two known ones)
    // -----------------------------------------------------------------------
    public function testGetAllUsersIncludesSeededUsers(): void
    {
        $response = $this->get();
        $emails   = array_column($response['data'], 'email');
        $this->assertContains('ali@stu.uob.edu.bh',    $emails);
        $this->assertContains('fatema@stu.uob.edu.bh', $emails);
    }

    // -----------------------------------------------------------------------
    // [PHP-03] GET never exposes the password column
    // -----------------------------------------------------------------------
    public function testGetAllUsersNeverExposesPassword(): void
    {
        $response = $this->get();
        foreach ($response['data'] as $user) {
            $this->assertArrayNotHasKey(
                'password',
                $user,
                'Password column must never be returned.'
            );
        }
    }

    // -----------------------------------------------------------------------
    // [PHP-04] GET ?id=<valid> returns the correct single user
    // -----------------------------------------------------------------------
    public function testGetUserByIdReturnsCorrectUser(): void
    {
        // First fetch all users to grab a real id
        $all      = $this->get();
        $firstId  = $all['data'][0]['id'];

        $response = $this->get(['id' => $firstId]);
        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);
        $this->assertSame((int) $firstId, (int) $response['data']['id']);
    }

    // -----------------------------------------------------------------------
    // [PHP-05] GET ?id=99999 returns success: false and HTTP 404
    // -----------------------------------------------------------------------
    public function testGetUserByIdReturns404ForUnknownId(): void
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
    // [PHP-07] POST creates a new user and returns HTTP 201
    // -----------------------------------------------------------------------
    public function testCreateUserReturns201(): void
    {
        $status = $this->httpStatusFor('POST', [
            'name'     => 'Test Student',
            'email'    => 'test.create@example.com',
            'password' => 'password123',
            'is_admin' => 0,
        ]);
        $this->assertSame(201, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-08] POST with missing name returns success: false and HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateUserRejects400WhenNameMissing(): void
    {
        $status = $this->httpStatusFor('POST', [
            'email'    => 'missing.name@example.com',
            'password' => 'password123',
        ]);
        $this->assertSame(400, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-09] POST with duplicate email returns HTTP 409
    // -----------------------------------------------------------------------
    public function testCreateUserRejects409ForDuplicateEmail(): void
    {
        $status = $this->httpStatusFor('POST', [
            'name'     => 'Duplicate',
            'email'    => 'ali@stu.uob.edu.bh',  // already seeded
            'password' => 'password123',
        ]);
        $this->assertSame(409, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-10] POST with password shorter than 8 characters returns HTTP 400
    // -----------------------------------------------------------------------
    public function testCreateUserRejectsShortPassword(): void
    {
        $status = $this->httpStatusFor('POST', [
            'name'     => 'Short Pass',
            'email'    => 'shortpass@example.com',
            'password' => 'abc',
        ]);
        $this->assertSame(400, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-11] PUT updates an existing user's name
    // -----------------------------------------------------------------------
    public function testUpdateUserName(): void
    {
        $all  = $this->get();
        $user = $all['data'][0];

        $response = $this->put([
            'id'   => $user['id'],
            'name' => 'Updated Name',
        ]);
        $this->assertTrue($response['success']);

        // Confirm the change persisted
        $updated = $this->get(['id' => $user['id']]);
        $this->assertSame('Updated Name', $updated['data']['name']);
    }

    // -----------------------------------------------------------------------
    // [PHP-12] PUT with duplicate email returns HTTP 409
    // -----------------------------------------------------------------------
    public function testUpdateUserRejects409ForDuplicateEmail(): void
    {
        $all    = $this->get();
        $userId = $all['data'][0]['id'];

        // Try to update user 0's email to user 1's email
        $takenEmail = $all['data'][1]['email'];

        $status = $this->httpStatusFor('PUT', [
            'id'    => $userId,
            'email' => $takenEmail,
        ]);
        $this->assertSame(409, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-13] PUT with unknown id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testUpdateUserReturns404ForUnknownId(): void
    {
        $status = $this->httpStatusFor('PUT', [
            'id'   => 99999,
            'name' => 'Ghost',
        ]);
        $this->assertSame(404, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-14] DELETE removes a user successfully
    // -----------------------------------------------------------------------
    public function testDeleteUserSucceeds(): void
    {
        // Create a throwaway user first
        $this->post([
            'name'     => 'To Delete',
            'email'    => 'to.delete@example.com',
            'password' => 'password123',
        ]);

        // Find their id
        $all      = $this->get(['search' => 'to.delete@example.com']);
        $deleteId = $all['data'][0]['id'];

        $response = $this->delete(['id' => $deleteId]);
        $this->assertTrue($response['success']);

        // Confirm they are gone
        $status = $this->httpStatusFor('GET', [], ['id' => $deleteId]);
        $this->assertSame(404, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-15] DELETE with unknown id returns HTTP 404
    // -----------------------------------------------------------------------
    public function testDeleteUserReturns404ForUnknownId(): void
    {
        $status = $this->httpStatusFor('DELETE', [], ['id' => 99999]);
        $this->assertSame(404, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-16] POST ?action=change_password succeeds with correct credentials
    // -----------------------------------------------------------------------
    public function testChangePasswordSucceeds(): void
    {
        $all    = $this->get();
        $userId = $all['data'][0]['id'];

        $response = $this->post(
            [
                'id'               => $userId,
                'current_password' => 'password',   // seeded default
                'new_password'     => 'newpassword123',
            ],
            ['action' => 'change_password']
        );
        $this->assertTrue($response['success']);
    }

    // -----------------------------------------------------------------------
    // [PHP-17] POST ?action=change_password with wrong current password
    //          returns HTTP 401
    // -----------------------------------------------------------------------
    public function testChangePasswordReturns401ForWrongCurrentPassword(): void
    {
        $all    = $this->get();
        $userId = $all['data'][0]['id'];

        $status = $this->httpStatusFor(
            'POST',
            [
                'id'               => $userId,
                'current_password' => 'thisisthewrongpassword',
                'new_password'     => 'newpassword123',
            ],
            ['action' => 'change_password']
        );
        $this->assertSame(401, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-18] POST ?action=change_password with short new password
    //          returns HTTP 400
    // -----------------------------------------------------------------------
    public function testChangePasswordRejectsShortNewPassword(): void
    {
        $all    = $this->get();
        $userId = $all['data'][0]['id'];

        $status = $this->httpStatusFor(
            'POST',
            [
                'id'               => $userId,
                'current_password' => 'password',
                'new_password'     => 'abc',
            ],
            ['action' => 'change_password']
        );
        $this->assertSame(400, $status);
    }

    // -----------------------------------------------------------------------
    // [PHP-19] GET ?search= filters results by name
    // -----------------------------------------------------------------------
    public function testSearchFiltersByName(): void
    {
        $response = $this->get(['search' => 'Ali']);
        $this->assertTrue($response['success']);
        foreach ($response['data'] as $user) {
            $this->assertStringContainsStringIgnoringCase('ali', $user['name']);
        }
    }

    // -----------------------------------------------------------------------
    // [PHP-20] Unsupported HTTP method returns HTTP 405
    // -----------------------------------------------------------------------
    public function testUnsupportedMethodReturns405(): void
    {
        $status = $this->httpStatusFor('PATCH');
        $this->assertSame(405, $status);
    }
}
