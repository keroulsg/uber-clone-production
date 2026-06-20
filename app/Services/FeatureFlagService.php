<?php

namespace App\Services;

use App\Models\FeatureFlag;
use Illuminate\Support\Facades\Cache;

class FeatureFlagService
{
    private static ?FeatureFlagService $instance = null;
    private array $cache = [];

    public static function instance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function isEnabled(string $code): bool
    {
        if (!isset($this->cache[$code])) {
            try {
                $flag = FeatureFlag::where('code', $code)->first();
                $this->cache[$code] = $flag ? $flag->is_enabled : true;
            } catch (\Exception $e) {
                $this->cache[$code] = true;
            }
        }
        return $this->cache[$code];
    }

    public function enable(string $code): bool
    {
        try {
            $flag = FeatureFlag::where('code', $code)->first();
            if (!$flag) return false;
            $flag->update(['is_enabled' => true]);
            unset($this->cache[$code]);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function disable(string $code): bool
    {
        try {
            $flag = FeatureFlag::where('code', $code)->first();
            if (!$flag) return false;
            $flag->update(['is_enabled' => false]);
            unset($this->cache[$code]);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function all(): array
    {
        try {
            return FeatureFlag::orderBy('category')->orderBy('sort_order')->get()->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }

    public function getByCategory(?string $category = null): array
    {
        try {
            $query = FeatureFlag::orderBy('sort_order');
            if ($category) {
                $query->where('category', $category);
            }
            return $query->get()->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }

    public function categories(): array
    {
        try {
            return FeatureFlag::select('category')->distinct()->orderBy('category')->pluck('category')->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }
}
