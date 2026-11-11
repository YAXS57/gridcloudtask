<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'assignment_id',
        'student_name',
        'nim',
        'file_path',
        'is_late',
    ];

    protected $casts = [
        'is_late' => 'boolean',
    ];

    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }
}
