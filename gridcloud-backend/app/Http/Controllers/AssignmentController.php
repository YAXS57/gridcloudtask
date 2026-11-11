<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Assignment;
use Telegram\Bot\Laravel\Facades\Telegram;

class AssignmentController extends Controller
{
    public function index()
    {
        return Assignment::orderBy('created_at', 'desc')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'         => 'required|string|max:255',
            'description'   => 'required|string',
            'lecturer_id'   => 'required',
            'deadline'      => 'required|date',
            'deadline_mode' => 'required|in:strict,lenient',
        ]);

        $assignment = Assignment::create([
            'title'         => $request->title,
            'description'   => $request->description,
            'lecturer_id'   => $request->lecturer_id,
            'deadline'      => $request->deadline,
            'deadline_mode' => $request->deadline_mode,
            'is_closed'     => false,
        ]);

        $deadlineIndo = date('d F Y, H:i', strtotime($request->deadline));
        $modeLabel    = $request->deadline_mode === 'strict'
            ? 'Tutup otomatis saat deadline'
            : 'Menerima terlambat (dengan catatan)';

        try {
            $pesan = "*TUGAS BARU DIBUAT*\n\n"
                   . "Judul: " . $request->title . "\n"
                   . "Deskripsi: " . $request->description . "\n"
                   . "Deadline: " . $deadlineIndo . " WIB\n"
                   . "Mode: " . $modeLabel . "\n\n"
                   . "Segera kerjakan sebelum tenggat waktu!";

            Telegram::sendMessage([
                'chat_id'    => $request->lecturer_id,
                'text'       => $pesan,
                'parse_mode' => 'Markdown',
            ]);
        } catch (\Exception $e) {
            \Log::error("Telegram Error: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Tugas berhasil dibuat.',
            'data'    => $assignment,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $assignment = Assignment::find($id);
        if (!$assignment) {
            return response()->json(['message' => 'Tugas tidak ditemukan'], 404);
        }

        $request->validate([
            'title'         => 'required|string|max:255',
            'description'   => 'required|string',
            'deadline'      => 'required|date',
            'lecturer_id'   => 'required',
            'deadline_mode' => 'required|in:strict,lenient',
        ]);

        $assignment->update([
            'title'         => $request->title,
            'description'   => $request->description,
            'deadline'      => $request->deadline,
            'lecturer_id'   => $request->lecturer_id,
            'deadline_mode' => $request->deadline_mode,
        ]);

        return response()->json([
            'message' => 'Tugas berhasil diperbarui.',
            'data'    => $assignment,
        ]);
    }

    public function destroy($id)
    {
        $assignment = Assignment::find($id);
        if (!$assignment) {
            return response()->json(['message' => 'Tugas tidak ditemukan'], 404);
        }
        $assignment->delete();
        return response()->json(['message' => 'Tugas berhasil dihapus']);
    }

    public function getSubmissions($id)
    {
        $assignment = Assignment::with('submissions')->find($id);
        if (!$assignment) {
            return response()->json(['message' => 'Tugas tidak ditemukan'], 404);
        }
        return response()->json($assignment);
    }

    /**
     * Tutup paksa pengumpulan — dosen menutup manual tanpa menghapus tugas.
     * PATCH /api/assignments/{id}/close
     */
    public function close($id)
    {
        $assignment = Assignment::find($id);
        if (!$assignment) {
            return response()->json(['message' => 'Tugas tidak ditemukan'], 404);
        }

        $assignment->update(['is_closed' => true]);

        return response()->json([
            'message' => 'Pengumpulan tugas ditutup.',
            'data'    => $assignment,
        ]);
    }

    /**
     * Buka kembali pengumpulan yang ditutup paksa.
     * PATCH /api/assignments/{id}/reopen
     */
    public function reopen($id)
    {
        $assignment = Assignment::find($id);
        if (!$assignment) {
            return response()->json(['message' => 'Tugas tidak ditemukan'], 404);
        }

        $assignment->update(['is_closed' => false]);

        return response()->json([
            'message' => 'Pengumpulan tugas dibuka kembali.',
            'data'    => $assignment,
        ]);
    }
}
