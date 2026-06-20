<?php

namespace Database\Seeders;

use App\Models\FeatureFlag;
use Illuminate\Database\Seeder;

class FeatureFlagSeeder extends Seeder
{
    public function run(): void
    {
        $features = [
            // Ride Features
            ['code' => 'ride_requests', 'name' => 'Ride Requests', 'description' => 'Allow riders to create new ride requests', 'category' => 'Ride Features', 'sort_order' => 1, 'is_enabled' => true],
            ['code' => 'ride_acceptance', 'name' => 'Ride Acceptance', 'description' => 'Allow drivers to accept ride requests', 'category' => 'Ride Features', 'sort_order' => 2, 'is_enabled' => true],
            ['code' => 'ride_arrival', 'name' => 'Driver Arrival', 'description' => 'Allow drivers to mark arrived at pickup', 'category' => 'Ride Features', 'sort_order' => 3, 'is_enabled' => true],
            ['code' => 'ride_start', 'name' => 'Ride Start', 'description' => 'Allow drivers to start rides', 'category' => 'Ride Features', 'sort_order' => 4, 'is_enabled' => true],
            ['code' => 'ride_completion', 'name' => 'Ride Completion', 'description' => 'Allow drivers to complete rides', 'category' => 'Ride Features', 'sort_order' => 5, 'is_enabled' => true],

            // Finance Features
            ['code' => 'cash_payments', 'name' => 'Cash Payments', 'description' => 'Allow riders to pay with cash', 'category' => 'Finance Features', 'sort_order' => 10, 'is_enabled' => true],
            ['code' => 'wallet_payments', 'name' => 'Wallet Payments', 'description' => 'Allow riders to pay via wallet', 'category' => 'Finance Features', 'sort_order' => 11, 'is_enabled' => true],
            ['code' => 'driver_wallet', 'name' => 'Driver Wallet', 'description' => 'Driver wallet balance and earnings tracking', 'category' => 'Finance Features', 'sort_order' => 12, 'is_enabled' => true],
            ['code' => 'driver_settlements', 'name' => 'Driver Settlements', 'description' => 'Driver settlement requests and admin approval', 'category' => 'Finance Features', 'sort_order' => 13, 'is_enabled' => true],
            ['code' => 'ratings', 'name' => 'Ratings', 'description' => 'Rider and driver rating system after rides', 'category' => 'Finance Features', 'sort_order' => 14, 'is_enabled' => true],

            // Safety Features
            ['code' => 'support_tickets', 'name' => 'Support Tickets', 'description' => 'Support ticket system for riders and drivers', 'category' => 'Safety Features', 'sort_order' => 20, 'is_enabled' => true],
            ['code' => 'notifications', 'name' => 'Notifications', 'description' => 'In-app notification system', 'category' => 'Safety Features', 'sort_order' => 21, 'is_enabled' => true],
            ['code' => 'female_driver_only', 'name' => 'Female Driver Only', 'description' => 'Allow riders to request only female drivers', 'category' => 'Safety Features', 'sort_order' => 22, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'trusted_contacts', 'name' => 'Trusted Contacts', 'description' => 'Share ride status with trusted contacts', 'category' => 'Safety Features', 'sort_order' => 23, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'emergency_button', 'name' => 'Emergency Button', 'description' => 'In-app emergency alert button', 'category' => 'Safety Features', 'sort_order' => 24, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'ride_sharing_code', 'name' => 'Ride Sharing Code', 'description' => 'Share ride code for tracking', 'category' => 'Safety Features', 'sort_order' => 25, 'is_enabled' => false, 'visible_in_admin' => true],

            // Premium Features
            ['code' => 'vip_system', 'name' => 'VIP System', 'description' => 'VIP rider/driver tier system', 'category' => 'Premium Features', 'sort_order' => 30, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'vip_priority_matching', 'name' => 'VIP Priority Matching', 'description' => 'VIP riders get priority driver matching', 'category' => 'Premium Features', 'sort_order' => 31, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'vip_discount', 'name' => 'VIP Discount', 'description' => 'Discount rates for VIP tier members', 'category' => 'Premium Features', 'sort_order' => 32, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'vip_airport_service', 'name' => 'VIP Airport Service', 'description' => 'Dedicated airport pickup for VIP', 'category' => 'Premium Features', 'sort_order' => 33, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'vip_support', 'name' => 'VIP Support', 'description' => 'Priority support for VIP members', 'category' => 'Premium Features', 'sort_order' => 34, 'is_enabled' => false, 'visible_in_admin' => true],

            // Operations Features
            ['code' => 'service_areas', 'name' => 'Service Areas', 'description' => 'Geographic service area restrictions', 'category' => 'Operations Features', 'sort_order' => 40, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'city_zones', 'name' => 'City Zones', 'description' => 'City-based zone management', 'category' => 'Operations Features', 'sort_order' => 41, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'airport_zones', 'name' => 'Airport Zones', 'description' => 'Airport-specific zones and pricing', 'category' => 'Operations Features', 'sort_order' => 42, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'dynamic_pricing', 'name' => 'Dynamic Pricing', 'description' => 'Time-based dynamic fare adjustments', 'category' => 'Operations Features', 'sort_order' => 43, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'surge_pricing', 'name' => 'Surge Pricing', 'description' => 'High-demand surge multiplier pricing', 'category' => 'Operations Features', 'sort_order' => 44, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'peak_pricing', 'name' => 'Peak Pricing', 'description' => 'Peak hour pricing adjustments', 'category' => 'Operations Features', 'sort_order' => 45, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'night_pricing', 'name' => 'Night Pricing', 'description' => 'Night time fare surcharge', 'category' => 'Operations Features', 'sort_order' => 46, 'is_enabled' => false, 'visible_in_admin' => true],

            // Marketing Features
            ['code' => 'promotions', 'name' => 'Promotions', 'description' => 'Promotional campaigns and offers', 'category' => 'Marketing Features', 'sort_order' => 50, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'promo_codes', 'name' => 'Promo Codes', 'description' => 'Discount promo codes for riders', 'category' => 'Marketing Features', 'sort_order' => 51, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'referral_program', 'name' => 'Referral Program', 'description' => 'Referral rewards for riders', 'category' => 'Marketing Features', 'sort_order' => 52, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'loyalty_program', 'name' => 'Loyalty Program', 'description' => 'Points-based loyalty rewards', 'category' => 'Marketing Features', 'sort_order' => 53, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'cashback_program', 'name' => 'Cashback Program', 'description' => 'Cashback on rides', 'category' => 'Marketing Features', 'sort_order' => 54, 'is_enabled' => false, 'visible_in_admin' => true],

            // Payment Gateway Features
            ['code' => 'instapay_gateway', 'name' => 'Instapay Gateway', 'description' => 'Instapay payment integration', 'category' => 'Payment Features', 'sort_order' => 60, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'vodafone_cash_gateway', 'name' => 'Vodafone Cash Gateway', 'description' => 'Vodafone Cash payment integration', 'category' => 'Payment Features', 'sort_order' => 61, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'paymob_gateway', 'name' => 'Paymob Gateway', 'description' => 'Paymob payment integration', 'category' => 'Payment Features', 'sort_order' => 62, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'fawry_gateway', 'name' => 'Fawry Gateway', 'description' => 'Fawry payment integration', 'category' => 'Payment Features', 'sort_order' => 63, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'card_gateway', 'name' => 'Card Gateway', 'description' => 'Credit/debit card payment integration', 'category' => 'Payment Features', 'sort_order' => 64, 'is_enabled' => false, 'visible_in_admin' => true],

            // Mobile Features
            ['code' => 'driver_mobile_app', 'name' => 'Driver Mobile App', 'description' => 'Driver mobile application support', 'category' => 'Mobile Features', 'sort_order' => 70, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'rider_mobile_app', 'name' => 'Rider Mobile App', 'description' => 'Rider mobile application support', 'category' => 'Mobile Features', 'sort_order' => 71, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'push_notifications', 'name' => 'Push Notifications', 'description' => 'Push notification delivery to mobile', 'category' => 'Mobile Features', 'sort_order' => 72, 'is_enabled' => false, 'visible_in_admin' => true],

            // Advanced Features
            ['code' => 'scheduled_rides', 'name' => 'Scheduled Rides', 'description' => 'Advance ride scheduling', 'category' => 'Advanced Features', 'sort_order' => 80, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'multi_stop_rides', 'name' => 'Multi-Stop Rides', 'description' => 'Rides with multiple destinations', 'category' => 'Advanced Features', 'sort_order' => 81, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'driver_destination_mode', 'name' => 'Driver Destination Mode', 'description' => 'Drivers set destination to get matching rides', 'category' => 'Advanced Features', 'sort_order' => 82, 'is_enabled' => false, 'visible_in_admin' => true],
            ['code' => 'corporate_accounts', 'name' => 'Corporate Accounts', 'description' => 'Corporate billing and account management', 'category' => 'Advanced Features', 'sort_order' => 83, 'is_enabled' => false, 'visible_in_admin' => true],
        ];

        foreach ($features as $feature) {
            FeatureFlag::updateOrCreate(
                ['code' => $feature['code']],
                $feature
            );
        }
    }
}
