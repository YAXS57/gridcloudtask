<?php

use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\LecturerAuthController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\TelegramBotController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public endpoints: students can view assignments and submit work.
Route::get('assignments', [AssignmentController::class, 'index']);
Route::post('submissions', [SubmissionController::class, 'store'])->middleware('throttle:10,1');

// Lecturer authentication.
Route::post('lecturer/login', [LecturerAuthController::class, 'login'])
    ->middleware('throttle:5,1');

// Lecturer-only endpoints.
Route::middleware('lecturer.auth')->group(function () {
    Route::post('assignments', [AssignmentController::class, 'store']);
    Route::delete('assignments/{id}', [AssignmentController::class, 'destroy']);
    Route::get('assignments/{id}/submissions', [AssignmentController::class, 'getSubmissions']);
    Route::get('submissions/{id}/download', [SubmissionController::class, 'download']);
    Route::put('assignments/{id}', [AssignmentController::class, 'update']);
    Route::patch('assignments/{id}/close', [AssignmentController::class, 'close']);
    Route::patch('assignments/{id}/reopen', [AssignmentController::class, 'reopen']);
});

// Telegram webhook endpoint.
Route::post('telegram/webhook', [TelegramBotController::class, 'handleWebhook']);

Route::get('/user', function (Request $request) {
    return $request->user();
});
