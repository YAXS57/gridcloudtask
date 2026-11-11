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
    Schema::create('assignments', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->text('description');
        $table->string('lecturer_id');
        $table->dateTime('deadline'); // <--- PASTIKAN BARIS INI ADA
        $table->timestamps();

        // Opsional: Foreign key (matikan jika belum ada tabel users)
        // $table->foreign('lecturer_id')->references('id')->on('users');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};
