<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'lecturer_id',
        'deadline',
        'deadline_mode', // 'strict' | 'lenient'
        'is_closed',     // tutup paksa manual oleh dosen
    ];

    protected $casts = [
        'is_closed' => 'boolean',
    ];

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }

    public function lecturer()
    {
        return $this->belongsTo(User::class, 'lecturer_id');
    }

    /**
     * Apakah tugas ini masih menerima pengumpulan baru?
     * - is_closed = true  → ditolak apapun kondisinya
     * - mode strict + lewat deadline → ditolak
     * - mode lenient + lewat deadline → diterima, tapi ditandai terlambat
     */
    public function isAcceptingSubmissions(): bool
    {
        if ($this->is_closed) {
            return false;
        }
        if ($this->deadline_mode === 'strict' && now()->greaterThan($this->deadline)) {
            return false;
        }
        return true;
    }

    public function isPastDeadline(): bool
    {
        return now()->greaterThan($this->deadline);
    }
}
