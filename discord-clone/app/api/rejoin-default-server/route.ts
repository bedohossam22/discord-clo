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
        // Try filtered query first
        const filter = { type: 'messaging', 'data.server': AUTO_JOIN_SERVER } as Record<string, unknown>;
        let channels = await serverClient.queryChannels(filter, {}, { limit: 100 });

        // Fallback: fetch all and filter manually
        if (channels.length === 0) {
            const allChannels = await serverClient.queryChannels({ type: 'messaging' }, {}, { limit: 100 });
            channels = allChannels.filter((ch) => {
                const raw = ch.data as Record<string, unknown>;
                const serverName = (raw?.server ?? (raw?.data as Record<string, unknown>)?.server) as string | undefined;
                return serverName?.trim() === AUTO_JOIN_SERVER;
            });
        }

        if (channels.length === 0) {
            return Response.json({ message: `No channels found in server "${AUTO_JOIN_SERVER}"` });
        }

        for (const ch of channels) {
            await ch.addMembers([userId]);
        }

        console.log(`[/api/rejoin-default-server] User "${userId}" joined ${channels.length} channels in "${AUTO_JOIN_SERVER}"`);
        return Response.json({ success: true, joinedChannels: channels.length });
    } catch (err) {
        console.error('[/api/rejoin-default-server] Error:', err);
        return Response.json({ error: 'Failed to join server' }, { status: 500 });
    }
}
