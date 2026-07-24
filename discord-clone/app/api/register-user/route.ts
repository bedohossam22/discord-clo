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
        // Query channels belonging to the target server by filtering on the custom 'server' field
        const filter = { type: 'messaging', 'data.server': AUTO_JOIN_SERVER } as Record<string, unknown>;
        let channels = await serverClient.queryChannels(filter, {}, { limit: 100 });

        // Fallback: if the typed filter returns nothing, fetch all and filter manually
        if (channels.length === 0) {
            const allChannels = await serverClient.queryChannels({ type: 'messaging' }, {}, { limit: 100 });
            channels = allChannels.filter((ch) => {
                const raw = ch.data as Record<string, unknown>;
                // Stream server SDK exposes custom fields directly on ch.data
                const serverName = (raw?.server ?? (raw?.data as Record<string, unknown>)?.server) as string | undefined;
                return serverName?.trim() === AUTO_JOIN_SERVER;
            });
        }

        if (channels.length > 0) {
            console.log(
                `[/api/register-user] Auto-joining user "${userId}" to ${channels.length} channels in server "${AUTO_JOIN_SERVER}"`
            );
            for (const ch of channels) {
                await ch.addMembers([userId]);
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