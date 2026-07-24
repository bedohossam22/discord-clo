import { StreamChat } from "stream-chat";

const AUTO_JOIN_SERVER = 'BB';

export async function POST(request: Request) {
    const apiKey = process.env.STREAM_API_KEY;
    if (!apiKey) {
        return Response.error();
    }
    const serverClient = StreamChat.getInstance(apiKey, process.env.STREAM_SECRET);

    const body = await request.json();
    const userId = body?.userId;

    if (!userId) {
        return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    try {
        // Fetch ALL messaging channels (admin client sees everything)
        // Use the same dual-path accessor the client uses: data?.data || data
        // because channels created with an explicit ID nest custom fields under data.data
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

        console.log(`[/api/rejoin-default-server] Found ${bbChannels.length} BB channels out of ${allChannels.length} total`);

        if (bbChannels.length === 0) {
            return Response.json({ message: `No channels found in server "${AUTO_JOIN_SERVER}"`, totalQueried: allChannels.length });
        }

        for (const ch of bbChannels) {
            try {
                await ch.addMembers([userId]);
            } catch (chErr) {
                console.warn(`[/api/rejoin-default-server] Skipping channel ${ch.id}:`, (chErr as Error).message);
            }
        }

        console.log(`[/api/rejoin-default-server] User "${userId}" joined ${bbChannels.length} channels in "${AUTO_JOIN_SERVER}"`);
        return Response.json({ success: true, joinedChannels: bbChannels.length });
    } catch (err) {
        console.error('[/api/rejoin-default-server] Error:', err);
        return Response.json({ error: 'Failed to join server' }, { status: 500 });
    }
}
