<?php

return [
    // Set a strong, unique password in Railway Variables. Never commit it.
    'lecturer_password' => env('LECTURER_PASSWORD'),
    'lecturer_token_ttl' => (int) env('LECTURER_TOKEN_TTL', 43200),
];
