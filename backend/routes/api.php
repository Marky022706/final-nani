<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\CirculationController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LibraryServiceController;
use App\Http\Controllers\SystemController;

// Public
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Administrative accounts (super_admin / admin governance)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::post('/users/{id}/privileges', [UserController::class, 'updatePrivileges']);
    Route::post('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
    Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);

    // Books & Physical Copies
    Route::get('/books', [BookController::class, 'index']);
    Route::get('/books/{id}', [BookController::class, 'show']);
    Route::post('/books', [BookController::class, 'store']);
    Route::put('/books/{id}', [BookController::class, 'update']);
    Route::delete('/books/{id}', [BookController::class, 'destroy']);
    Route::get('/copies/barcode/{barcode}', [BookController::class, 'getCopyByBarcode']);

    // Members
    Route::get('/members', [MemberController::class, 'index']);
    Route::get('/members/{id}', [MemberController::class, 'show']);
    Route::get('/members/qr/{code}', [MemberController::class, 'getByQr']);
    Route::post('/members', [MemberController::class, 'store']);
    Route::put('/members/{id}', [MemberController::class, 'update']);
    Route::delete('/members/{id}', [MemberController::class, 'destroy']);
    Route::post('/members/{id}/reset-password', [MemberController::class, 'resetPassword']);

    // Circulation
    Route::get('/circulation/transactions', [CirculationController::class, 'getTransactions']);
    Route::post('/circulation/borrow', [CirculationController::class, 'borrow']);
    Route::post('/circulation/return', [CirculationController::class, 'returnBook']);
    Route::post('/circulation/renew', [CirculationController::class, 'renew']);
    Route::post('/circulation/requests/borrow', [CirculationController::class, 'requestBorrow']);
    Route::post('/circulation/requests/{id}/approve', [CirculationController::class, 'approveBorrow']);
    Route::post('/circulation/requests/{id}/reject', [CirculationController::class, 'rejectBorrow']);

    // Reservations
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::post('/reservations/{id}/approve', [ReservationController::class, 'approve']);
    Route::post('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);

    // Attendance
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('/attendance/{id}/check-out', [AttendanceController::class, 'checkOut']);
    Route::put('/attendance/{id}', [AttendanceController::class, 'update']);

    // Library Services
    Route::get('/services', [LibraryServiceController::class, 'index']);
    Route::get('/service-records', [LibraryServiceController::class, 'records']);
    Route::post('/service-records', [LibraryServiceController::class, 'recordUsage']);

    // System Logs & Notifications
    Route::get('/audit-logs', [SystemController::class, 'auditLogs']);
    Route::get('/notifications', [SystemController::class, 'notifications']);
    Route::post('/notifications/{id}/read', [SystemController::class, 'markNotificationRead']);
    Route::post('/notifications/read-all', [SystemController::class, 'markAllNotificationsRead']);
});
