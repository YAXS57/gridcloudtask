<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            // 'strict'  = tutup otomatis saat deadline lewat
            // 'lenient' = masih menerima setelah deadline, tapi ditandai terlambat
            $table->string('deadline_mode')->default('strict')->after('deadline');

            // true = dosen menutup paksa, tidak ada pengumpulan baru apapun mode-nya
            $table->boolean('is_closed')->default(false)->after('deadline_mode');
        });
    }

    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropColumn(['deadline_mode', 'is_closed']);
        });
    }
};
