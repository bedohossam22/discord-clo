import { StreamChat } from "stream-chat";

export async function POST(request: Request) {
    const apiKey = process.env.STREAM_API_KEY;
    if (!apiKey) {
        return Response.json({ error: "Missing STREAM_API_KEY" }, { status: 500 });
    }

    const serverClient = StreamChat.getInstance(apiKey, process.env.STREAM_SECRET);
    const body = await request.json();

    const { serverName, serverId } = body || {};
    if (!serverName) {
        return Response.json({ error: "Missing serverName" }, { status: 400 });
    }

    // Protection: main server BB CANNOT be deleted
    if (serverName.trim().toLowerCase() === 'bb') {
        return Response.json({ error: "The main server 'BB' cannot be deleted!" }, { status: 403 });
    }

    try {
        // Query all messaging channels with admin client
        const channels = await serverClient.queryChannels(
            { type: 'messaging' },
            {},
            { limit: 300 }
        );

        const targetChannels = channels.filter((ch) => {
            const data = (ch.data as Record<string, any>)?.data || (ch.data as Record<string, any>);
            const chServer = data?.server;
            const chServerId = data?.serverId;
            return (
                (typeof chServer === 'string' && chServer.trim().toLowerCase() === serverName.trim().toLowerCase()) ||
                (serverId && chServerId === serverId)
            );
        });

        console.log(`[/api/delete-server] Found ${targetChannels.length} channels to delete for server "${serverName}"`);

        let deletedCount = 0;
        for (const ch of targetChannels) {
            try {
                await ch.delete();
                deletedCount++;
            } catch (err) {
                console.error(`[/api/delete-server] Failed to delete channel ${ch.cid}:`, err);
            }
        }

        return Response.json({ success: true, deletedChannels: deletedCount });
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete server';
        console.error('[/api/delete-server] Error deleting server channels:', err);
        return Response.json({ error: errorMsg }, { status: 500 });
    }
}
