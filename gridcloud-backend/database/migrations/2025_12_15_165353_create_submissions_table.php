<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up()
{
    Schema::create('submissions', function (Blueprint $table) {
        $table->id();
        $table->foreignId('assignment_id')->constrained()->onDelete('cascade'); // Relasi ke Tugas
        $table->string('student_name');
        $table->string('nim');
        $table->string('file_path'); // Lokasi file yang diupload
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
