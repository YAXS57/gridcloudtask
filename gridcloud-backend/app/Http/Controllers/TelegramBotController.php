<?php

namespace App\Http\Controllers;

use Telegram\Bot\Api;
use App\Models\Submission;
use App\Models\Assignment;
use App\Models\User; 
use Illuminate\Http\Request;

class TelegramBotController extends Controller
{
    protected $telegram;

    // Konstruktor menerima instance Telegram\Bot\Api dari Service Container
    public function __construct(Api $telegram)
    {
        $this->telegram = $telegram; 
    }

    // Method yang dipanggil oleh Webhook Telegram
    public function handleWebhook(Request $request)
    {
        $updates = $this->telegram->getWebhookUpdate();
        $message = $updates->getMessage();
        
        if (!$message) {
            return response()->json(['status' => 'ok']); // Abaikan jika bukan pesan
        }
        
        $chatId = $message->getChat()->getId();
        $text = $message->getText();
        
        $response = "Perintah tidak dikenal. Coba /link [ID Dosen Anda]";

        // Logika /link: Dosen menautkan ID Telegram
        if (str_starts_with($text, '/link')) {
            $parts = explode(' ', $text);
            $lecturerId = $parts[1] ?? null; 

            if ($lecturerId && $user = User::where('role', 'lecturer')->find($lecturerId)) {
                $user->telegram_chat_id = $chatId;
                $user->save();
                $response = "✅ Akun Dosen ({$user->name}) berhasil ditautkan! Anda akan menerima notifikasi tugas.";
            } else {
                $response = "❌ Gagal: Pastikan format /link [ID Dosen] dan ID dosen valid.";
            }
        } 
        
        // Logika /start
        elseif ($text === '/start') {
            $response = "Halo! Saya adalah Bot Notifikasi GridCloud Task App. Untuk menerima notifikasi, kirim: /link [ID Dosen]";
        }

        $this->telegram->sendMessage(['chat_id' => $chatId, 'text' => $response]);
        return response()->json(['status' => 'ok']);
    }

    // Method untuk Mengirim Notifikasi (Dipanggil dari SubmissionController)
    public function sendSubmissionNotification(Submission $submission)
    {
        $assignment = Assignment::find($submission->assignment_id);
        $lecturer = User::find($assignment->lecturer_id);
        
        if (!$lecturer || !$lecturer->telegram_chat_id) {
            // Dosen belum menautkan atau tidak ditemukan
            return; 
        }

        $message = "🔔 *NOTIFIKASI TUGAS MASUK* 🔔\n\n"
                 . "Tugas: *{$assignment->title}*\n"
                . "Nama Mhs: {$submission->student_name}\n"
                . "NIM: {$submission->student_nim}\n"
                . "File: {$submission->original_filename}\n"
                . "Waktu Kirim: {$submission->created_at->format('H:i:s d/m/Y')}";
                
        try {
            $this->telegram->sendMessage([
                'chat_id' => $lecturer->telegram_chat_id,
                'text' => $message,
                'parse_mode' => 'Markdown'
            ]);
        } catch (\Exception $e) {
            \Log::error("Telegram error pada Chat ID {$lecturer->telegram_chat_id}: " . $e->getMessage());
        }
    }
}