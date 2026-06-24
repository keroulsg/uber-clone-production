<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    /**
     * Log a security, account, or financial event.
     */
    public static function log(
        string $event,
        ?int $actorId = null,
        ?string $actorRole = null,
        ?string $targetType = null,
        ?int $targetId = null,
        ?float $amount = null,
        ?array $metadata = null
    ): AuditLog {
        // Automatically resolve actor if not provided
        if ($actorId === null && auth()->check()) {
            $user = auth()->user();
            $actorId = $user->id;
            
            if ($actorRole === null) {
                $roles = $user->roles ?? [];
                if ($roles instanceof \Illuminate\Support\Collection) {
                    $actorRole = $roles->first()?->name;
                } elseif (is_array($roles)) {
                    $actorRole = count($roles) > 0 ? (is_object($roles[0]) ? $roles[0]->name : (string) $roles[0]) : null;
                }
            }
        }

        // Sanitize metadata to prevent logging sensitive fields
        if ($metadata !== null) {
            $sensitiveKeys = ['password', 'password_confirmation', 'token', 'secret', 'cvv', 'card_number', 'otp', 'new_password', 'current_password'];
            foreach ($sensitiveKeys as $key) {
                if (isset($metadata[$key])) {
                    $metadata[$key] = '[REDACTED]';
                }
            }
        }

        return AuditLog::create([
            'actor_id' => $actorId,
            'actor_role' => $actorRole,
            'event' => $event,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'amount' => $amount,
            'ip' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'metadata' => $metadata,
        ]);
    }
}
