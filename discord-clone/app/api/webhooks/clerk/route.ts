import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { StreamChat } from 'stream-chat';

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
        console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET is not set');
        return new Response('Webhook secret not configured', { status: 500 });
    }

    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Missing svix headers', { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('[clerk-webhook] Invalid signature:', err);
        return new Response('Invalid webhook signature', { status: 400 });
    }

    if (evt.type === 'user.deleted') {
        const userId = evt.data.id;
        if (!userId) {
            return new Response('No user id in event', { status: 400 });
        }

        const apiKey = process.env.STREAM_API_KEY;
        const apiSecret = process.env.STREAM_SECRET;
        if (!apiKey || !apiSecret) {
            return new Response('Stream credentials not configured', { status: 500 });
        }

        const serverClient = StreamChat.getInstance(apiKey, apiSecret);

        try {
            const channels = await serverClient.queryChannels(
                { members: { $in: [userId] } },
                {},
                { limit: 200 }
            );
            for (const ch of channels) {
                try {
                    await ch.removeMembers([userId]);
                } catch (e) {
                    console.warn(`[clerk-webhook] Could not remove ${userId} from channel ${ch.id}:`, e);
                }
            }

            await serverClient.deleteUser(userId, {
                mark_messages_deleted: false,
                hard_delete: true,
            });
            console.log(`[clerk-webhook] Hard-deleted Stream user: ${userId}`);
        } catch (err) {
            console.error('[clerk-webhook] Failed to clean up Stream user:', err);
            return new Response('Stream cleanup failed', { status: 500 });
        }
    }

    return new Response('OK', { status: 200 });
}
