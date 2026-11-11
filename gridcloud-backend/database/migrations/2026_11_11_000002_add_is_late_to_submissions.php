<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            // true = mahasiswa mengumpulkan setelah deadline (hanya mungkin jika mode lenient)
            $table->boolean('is_late')->default(false)->after('file_path');
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropColumn('is_late');
        });
    }
};
