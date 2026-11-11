<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class LecturerAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string', 'max:512'],
        ]);

        $key = 'gridcloud-lecturer-login:'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'message' => 'Terlalu banyak percobaan login. Coba lagi beberapa menit.',
            ], 429);
        }

        $configuredPassword = (string) config('gridcloud.lecturer_password');
        $appKey = (string) config('app.key');

        if ($configuredPassword === '' || $appKey === '') {
            return response()->json(['message' => 'Autentikasi dosen belum dikonfigurasi.'], 503);
        }

        if (! hash_equals($configuredPassword, $request->input('password'))) {
            RateLimiter::hit($key, 60);

            return response()->json([
                'message' => 'Password salah. Coba lagi.',
            ], 401);
        }

        RateLimiter::clear($key);

        $payload = (string) (time() + max(300, config('gridcloud.lecturer_token_ttl', 43200)));
        $encodedPayload = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
        $signature = hash_hmac('sha256', $encodedPayload, $appKey);

        return response()->json([
            'token' => $encodedPayload.'.'.$signature,
            'expires_in' => max(300, config('gridcloud.lecturer_token_ttl', 43200)),
        ]);
    }
}
