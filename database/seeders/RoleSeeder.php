<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Role::findOrCreate('super-admin', 'web');
        Role::findOrCreate('admin', 'web');
        Role::findOrCreate('operations', 'web');
        Role::findOrCreate('support', 'web');
        Role::findOrCreate('finance', 'web');
        Role::findOrCreate('driver-reviewer', 'web');
        Role::findOrCreate('marketing', 'web');

        Role::findOrCreate('driver', 'web');
        Role::findOrCreate('rider', 'web');

        $allPermissions = [
            'view_admin_dashboard', 'manage_admin_users', 'manage_roles',
            'manage_riders', 'manage_drivers', 'review_driver_documents',
            'manage_rides', 'manage_payments', 'manage_wallets',
            'manage_driver_debts', 'manage_settlements', 'manage_support_tickets',
            'manage_notifications', 'view_reports', 'manage_pricing',
            'manage_service_areas', 'manage_promotions',
        ];

        foreach ($allPermissions as $perm) {
            Permission::findOrCreate($perm, 'web');
        }

        $admin->syncPermissions($allPermissions);
    }
}
