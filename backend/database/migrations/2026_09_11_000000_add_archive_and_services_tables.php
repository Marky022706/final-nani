<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->boolean('is_archived')->default(false)->after('cover_image');
        });

        Schema::create('library_services', function (Blueprint $table) {
            $table->id();
            $table->string('service_key')->unique(); // e.g. srv-1
            $table->string('name');
            $table->string('category');
            $table->text('description')->nullable();
            $table->string('icon_name')->default('Search');
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });

        Schema::create('service_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->nullable()->constrained('library_services')->nullOnDelete();
            $table->string('service_name');
            $table->string('member_id');
            $table->string('member_name');
            $table->date('date');
            $table->string('time');
            $table->text('notes')->nullable();
            $table->string('recorded_by')->default('Staff');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_records');
        Schema::dropIfExists('library_services');
        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn('is_archived');
        });
    }
};
