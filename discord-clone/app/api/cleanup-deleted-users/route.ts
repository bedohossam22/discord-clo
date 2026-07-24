import { StreamChat } from 'stream-chat';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_SECRET;
    if (!apiKey || !apiSecret) {
        return new Response('Stream credentials not configured', { status: 500 });
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    const clerk = await clerkClient();

    // 1. Fetch all Stream users (paginate in batches of 100)
    let streamUsers: { id: string }[] = [];
    let offset = 0;
    const batchSize = 100;
    while (true) {
        const res = await serverClient.queryUsers(
            { role: { $ne: 'admin' } },
            { last_active: -1 },
            { limit: batchSize, offset }
        );
        streamUsers = streamUsers.concat(res.users.map((u) => ({ id: u.id })));
        if (res.users.length < batchSize) break;
        offset += batchSize;
    }

    if (streamUsers.length === 0) {
        return Response.json({ message: 'No Stream users found', deleted: [] });
    }

    // 2. Fetch all Clerk user IDs in batches of 100
    const clerkUserIds = new Set<string>();
    let clerkOffset = 0;
    while (true) {
        const clerkRes = await clerk.users.getUserList({ limit: 100, offset: clerkOffset });
        for (const u of clerkRes.data) clerkUserIds.add(u.id);
        if (clerkRes.data.length < 100) break;
        clerkOffset += 100;
    }

    // 3. Find Stream users that no longer exist in Clerk
    const ghostIds = streamUsers.map((u) => u.id).filter((id) => !clerkUserIds.has(id));

    if (ghostIds.length === 0) {
        return Response.json({ message: 'No ghost users found', deleted: [] });
    }

    // 4. Hard-delete each ghost user from Stream
    const deleted: string[] = [];
    const errors: { id: string; error: string }[] = [];

    for (const userId of ghostIds) {
        try {
            // Remove from channels first
            const channels = await serverClient.queryChannels(
                { members: { $in: [userId] } },
                {},
                { limit: 200 }
            );
            for (const ch of channels) {
                try { await ch.removeMembers([userId]); } catch (_) {}
            }
            // Hard delete
            await serverClient.deleteUser(userId, {
                mark_messages_deleted: false,
                hard_delete: true,
            });
            deleted.push(userId);
            console.log(`[cleanup] Hard-deleted ghost Stream user: ${userId}`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[cleanup] Failed to delete ${userId}:`, msg);
            errors.push({ id: userId, error: msg });
        }
    }

    return Response.json({ deleted, errors });
}
