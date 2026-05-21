<?php

namespace App\Providers;

use App\Models\Diagnosis;
use App\Models\Doctor;
use App\Models\Examination;
use App\Models\MedicalAction;
use App\Models\MedicalRecord;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Poli;
use App\Models\Invoice;
use App\Models\Prescription;
use App\Models\Visit;
use App\Policies\ExaminationPolicy;
use App\Policies\InvoicePolicy;
use App\Policies\MasterDataPolicy;
use App\Policies\MedicalRecordPolicy;
use App\Policies\MedicinePolicy;
use App\Policies\PatientPolicy;
use App\Policies\PrescriptionPolicy;
use App\Policies\VisitPolicy;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Fase 3 — Master data
        Gate::policy(Poli::class,          MasterDataPolicy::class);
        Gate::policy(Doctor::class,        MasterDataPolicy::class);
        Gate::policy(Diagnosis::class,     MasterDataPolicy::class);
        Gate::policy(MedicalAction::class, MasterDataPolicy::class);
        Gate::policy(Medicine::class,      MedicinePolicy::class);

        // Fase 4 — Pasien
        Gate::policy(Patient::class, PatientPolicy::class);

        // Fase 5 — Kunjungan & Antrean
        Gate::policy(Visit::class, VisitPolicy::class);

        // Fase 6 — Pemeriksaan
        Gate::policy(Examination::class,   ExaminationPolicy::class);
        Gate::policy(MedicalRecord::class, MedicalRecordPolicy::class);

        // Fase 7 — Resep & Farmasi
        Gate::policy(Prescription::class, PrescriptionPolicy::class);

        // Fase 8 — Kasir & Pembayaran
        Gate::policy(Invoice::class, InvoicePolicy::class);

        // Fase 9 — Laporan & Dashboard
        Gate::define('view-dashboard', fn (User $user) =>
            $user->is_active && in_array($user->role, [
                'super_admin', 'admin_klinik', 'dokter', 'perawat',
                'farmasi', 'kasir', 'owner',
            ])
        );

        Gate::define('view-reports', fn (User $user) =>
            $user->is_active && in_array($user->role, [
                'super_admin', 'admin_klinik', 'kasir', 'owner',
            ])
        );

        Gate::define('export-reports', fn (User $user) =>
            $user->is_active && in_array($user->role, [
                'super_admin', 'admin_klinik', 'owner',
            ])
        );
    }
}
