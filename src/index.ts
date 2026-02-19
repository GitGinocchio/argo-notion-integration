import "dotenv/config";
import { Client as ArgoClient } from "./argo-api/Client.ts";
import { Client as NotionClient } from "@notionhq/client";
import { setupPromemoriaDatabase } from "./setup.ts";
import { seedPromemoriaRecords } from "./seed.ts";

const argoClient = new ArgoClient({});
const notionClient = new NotionClient({ auth: process.env.NOTION_TOKEN });

try {
	console.log("🔐 Login Argo in corso...\n");
	await argoClient.login();
	console.log("✓ Login Argo completato!\n");

    console.log(argoClient.dashboard?.promemoria[0]);

    const database_id = await setupPromemoriaDatabase(notionClient, process.env.NOTION_PAGE_ID as string);
    await seedPromemoriaRecords(notionClient, database_id, argoClient.dashboard?.promemoria as any);

} catch (err) {
	console.error(
		"❌ Errore:",
		err instanceof Error ? err.message : err,
	);
	process.exit(1);
}
