// src/seedBulletinBoard.ts
import type { Client as NotionClient } from "@notionhq/client";
import { buildDate } from "./utils.ts";

type Promemoria = {
  pkDocente: string;
  desAnnotazioni: string;
  datEvento?: string;      // opzionale
  datGiorno?: string;      // opzionale
  docente: string;
  oraInizio?: string;      // opzionale
  oraFine?: string;        // opzionale
  flgVisibileFamiglia: string; // "S" o "N"
};

// Funzione per popolare i promemoria
export async function seedPromemoriaRecords(
  client: NotionClient,
  databaseId: string,
  promemoria: Promemoria[]
) {
  for (const p of promemoria) {
    const query = await client.databases.query({
      database_id: databaseId,
      filter: {
        property: "desAnnotazioni",
        title: {
          equals: p.desAnnotazioni.slice(0, 100),
        },
      },
    });

    if (query.results.length > 0) {
      // La pagina esiste già → salta
      console.log(`Pagina "${p.desAnnotazioni}" già presente, salto.`);
      continue;
    }

    const properties: Record<string, any> = {
      desAnnotazioni: { title: [{ text: { content: (p.desAnnotazioni || "").slice(0, 100) } }] },
      pkDocente: { rich_text: [{ text: { content: p.pkDocente || "" } }] },
      docente: { rich_text: [{ text: { content: p.docente || "" } }] },
      flgVisibileFamiglia: { checkbox: p.flgVisibileFamiglia === "S" },
      datEvento: { date: buildDate(p.datEvento) },
      datGiorno: { date: buildDate(p.datGiorno) },
      oraInizio: { rich_text: [{ text: { content: p.oraInizio || "00:00" } }] },
      oraFine: { rich_text: [{ text: { content: p.oraFine || "00:00" } }] },
    };

    await client.pages.create({
      parent: { database_id: databaseId },
      properties,
    });
  }
}