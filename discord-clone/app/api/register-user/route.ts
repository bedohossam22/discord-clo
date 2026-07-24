import { clerkClient } from '@clerk/clerk-sdk-node';
import { StreamChat } from "stream-chat";

// Name of the server that every new user should automatically join
const AUTO_JOIN_SERVER = 'BB';

export async function POST(request: Request){
    const apiKey = process.env.STREAM_API_KEY;
    if (!apiKey){
        return Response.error();
    }
    const serverClient = StreamChat.getInstance(
        apiKey,
        process.env.STREAM_SECRET
    );
    const body = await request.json();
    console.log('[/api/register-user] Body:', body);

    const userId = body?.userId;
    const mail = body?.email;

    if (!userId || !mail){
        return Response.error();
    }

    // 1. Upsert the user into Stream Chat
    await serverClient.upsertUser({
        id: userId,
        role: 'user',
        name: mail,
        imageURL: `https://getstream.io/random_png/?id=${userId}&name=${mail}`,
    });

    // 2. Auto-join the user to every channel in the AUTO_JOIN_SERVER
    try {
        // Admin client sees ALL channels; filter manually using the same dual-path
        // accessor the client side uses: data?.data (explicit-ID channels) OR data directly
        const allChannels = await serverClient.queryChannels({ type: 'messaging' }, {}, { limit: 200 });

        const bbChannels = allChannels.filter((ch) => {
            const raw = ch.data as Record<string, unknown>;
            // Skip distinct channels (DMs) — Stream does not allow adding members to them
            if (raw?.distinct === true) return false;
            const nested = (raw?.data as Record<string, unknown>)?.server as string | undefined;
            const direct = raw?.server as string | undefined;
            const serverName = nested ?? direct;
            return serverName?.trim() === AUTO_JOIN_SERVER;
        });

        console.log(
            `[/api/register-user] Found ${bbChannels.length} BB channels out of ${allChannels.length} total`
        );

        if (bbChannels.length > 0) {
            console.log(
                `[/api/register-user] Auto-joining user "${userId}" to ${bbChannels.length} channels in server "${AUTO_JOIN_SERVER}"`
            );
            for (const ch of bbChannels) {
                try {
                    await ch.addMembers([userId]);
                } catch (chErr) {
                    console.warn(`[/api/register-user] Skipping channel ${ch.id}:`, (chErr as Error).message);
                }
            }
        } else {
            console.log(
                `[/api/register-user] No channels found for server "${AUTO_JOIN_SERVER}" — skipping auto-join`
            );
        }
    } catch (err) {
        // Non-fatal — user is still registered even if auto-join fails
        console.error('[/api/register-user] Auto-join error:', err);
    }

    // 3. Mark user as registered in Clerk metadata
    const params = {
        publicMetadata: {
            streamRegistered: true,
        },
    };
    const updatedUser = await clerkClient.users.updateUser(userId, params);
    console.log('[/api/register-user] User registered:', updatedUser.id);

    const response = {
        userId: userId,
        userName: mail,
    };
    return Response.json(response);
}