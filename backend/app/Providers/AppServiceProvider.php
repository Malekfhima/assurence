<?php

namespace App\Providers;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Fix pour MySQL/MariaDB : "1071 La clé est trop longue"
        // utf8mb4 utilise 4 bytes par caractère, donc varchar(255) = 1020 bytes > 1000 max
        Schema::defaultStringLength(125);
    }
}
