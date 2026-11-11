<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Submission;
use App\Models\Assignment;
use Telegram\Bot\Laravel\Facades\Telegram;

class SubmissionController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'assignment_id' => 'required|integer',
            'student_name'  => 'required|string|max:255',
            'nim'           => 'required|string|max:50',
            'file'          => 'required|file|max:10240',
        ]);

        $assignment = Assignment::find($request->assignment_id);

        if (!$assignment) {
            return response()->json(['message' => 'Tugas tidak ditemukan.'], 404);
        }

        // Cek tutup paksa — prioritas tertinggi, tidak ada pengecualian
        if ($assignment->is_closed) {
            return response()->json([
                'message' => 'Pengumpulan tugas ini sudah ditutup oleh dosen.',
            ], 403);
        }

        // Cek deadline berdasarkan mode
        $isLate = $assignment->isPastDeadline();

        if ($isLate && $assignment->deadline_mode === 'strict') {
            return response()->json([
                'message' => 'Batas waktu pengumpulan sudah berakhir. Tugas tidak dapat dikirim.',
            ], 403);
        }

        // Upload file
        if (!$request->hasFile('file')) {
            return response()->json(['message' => 'File wajib disertakan.'], 400);
        }
        $path = $request->file('file')->store('uploads', 'private_uploads');

        // Simpan submission
        $submission = Submission::create([
            'assignment_id' => $request->assignment_id,
            'student_name'  => $request->student_name,
            'nim'           => $request->nim,
            'file_path'     => $path,
            'is_late'       => $isLate,
        ]);

        // Kirim notifikasi Telegram
        $statusNotif = 'Notifikasi tidak dikirim.';
        try {
            $chatId = $assignment->lecturer_id;

            if (strlen($chatId) >= 5) {
                $lateNote = $isLate ? "\nCatatan: Pengumpulan TERLAMBAT" : '';
                $pesan = "*TUGAS MASUK*\n\n"
                       . "Mahasiswa: " . $request->student_name . "\n"
                       . "NIM: " . $request->nim . "\n"
                       . "Tugas: " . $assignment->title
                       . $lateNote;

                Telegram::sendMessage([
                    'chat_id'    => $chatId,
                    'text'       => $pesan,
                    'parse_mode' => 'Markdown',
                ]);

                $statusNotif = 'Notifikasi terkirim ke dosen.';
            } else {
                $statusNotif = 'ID Dosen tidak valid untuk Telegram.';
            }
        } catch (\Exception $e) {
            $statusNotif = 'Gagal kirim notifikasi: ' . $e->getMessage();
        }

        $responseMessage = $isLate
            ? 'Tugas berhasil dikirim. Catatan: pengumpulan terlambat dari deadline.'
            : 'Tugas berhasil dikirim.';

        return response()->json([
            'message'         => $responseMessage,
            'is_late'         => $isLate,
            'telegram_status' => $statusNotif,
            'data'            => $submission,
        ], 201);
    }


    /**
     * Download a submitted file. This route is protected by lecturer.auth.
     */
    public function download($id)
    {
        $submission = Submission::findOrFail($id);
        $disk = Storage::disk('private_uploads');

        if (! $disk->exists($submission->file_path)) {
            return response()->json(['message' => 'File pengumpulan tidak ditemukan.'], 404);
        }

        return $disk->download($submission->file_path, basename($submission->file_path));
    }
}
