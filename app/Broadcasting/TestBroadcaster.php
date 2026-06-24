<?php

namespace App\Broadcasting;

use Illuminate\Broadcasting\Broadcasters\Broadcaster;
use Illuminate\Support\Str;

class TestBroadcaster extends Broadcaster
{
    public function auth($request): mixed
    {
        $channelName = $this->normalizeChannelName($request->channel_name);

        return $this->verifyUserCanAccessChannel($request, $channelName);
    }

    public function validAuthenticationResponse($request, $result): mixed
    {
        return [];
    }

    public function broadcast(array $channels, $event, array $payload = []): void
    {
        //
    }

    protected function normalizeChannelName(string $channel): string
    {
        if ($this->isGuardedChannel($channel)) {
            return str_starts_with($channel, 'private-')
                ? Str::replaceFirst('private-', '', $channel)
                : Str::replaceFirst('presence-', '', $channel);
        }

        return $channel;
    }

    protected function isGuardedChannel(string $channel): bool
    {
        return str_starts_with($channel, 'private-') || str_starts_with($channel, 'presence-');
    }
}
