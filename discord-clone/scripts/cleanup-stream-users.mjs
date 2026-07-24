// One-time cleanup: hard-deletes Stream users whose Clerk account no longer exists
// Run with: node --env-file=.env scripts/cleanup-stream-users.mjs

import { StreamChat } from 'stream-chat';
import { createClerkClient } from '@clerk/backend';

const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_SECRET = process.env.STREAM_SECRET;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!STREAM_API_KEY || !STREAM_SECRET || !CLERK_SECRET_KEY) {
    console.error('Missing env vars. Check STREAM_API_KEY, STREAM_SECRET, CLERK_SECRET_KEY.');
    process.exit(1);
}

const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_SECRET);
const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });

// 1. Fetch all Stream users (no unsupported filter - filter after)
let streamUsers = [];
let offset = 0;
while (true) {
    const res = await serverClient.queryUsers(
        {},
        { last_active: -1 },
        { limit: 100, offset }
    );
    streamUsers = streamUsers.concat(res.users);
    if (res.users.length < 100) break;
    offset += 100;
}
// Exclude admin/server-side accounts
const nonAdminStreamUsers = streamUsers.filter(u => u.role !== 'admin');
console.log(`Found ${nonAdminStreamUsers.length} non-admin Stream users`);

// 2. Fetch all Clerk user IDs
const clerkUserIds = new Set();
let clerkOffset = 0;
while (true) {
    const res = await clerk.users.getUserList({ limit: 100, offset: clerkOffset });
    for (const u of res.data) clerkUserIds.add(u.id);
    if (res.data.length < 100) break;
    clerkOffset += 100;
}
console.log(`Found ${clerkUserIds.size} Clerk users`);

// 3. Find ghost users (Stream user has no matching Clerk account)
const ghostIds = nonAdminStreamUsers.map(u => u.id).filter(id => !clerkUserIds.has(id));
console.log(`Found ${ghostIds.length} ghost users:`, ghostIds);

if (ghostIds.length === 0) {
    console.log('Nothing to clean up!');
    process.exit(0);
}

// 4. Hard-delete each ghost from Stream
let deleted = 0;
for (const userId of ghostIds) {
    try {
        const channels = await serverClient.queryChannels(
            { members: { $in: [userId] } },
            {},
            { limit: 200 }
        );
        for (const ch of channels) {
            try { await ch.removeMembers([userId]); } catch (_) {}
        }
        await serverClient.deleteUser(userId, { mark_messages_deleted: false, hard_delete: true });
        console.log(`  Deleted: ${userId}`);
        deleted++;
    } catch (err) {
        console.error(`  Failed ${userId}:`, err.message);
    }
}

console.log(`\nDone! Deleted ${deleted}/${ghostIds.length} ghost users.`);
