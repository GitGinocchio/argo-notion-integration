import type { Client as NotionClient } from "@notionhq/client";
import { buildDate } from "./utils.ts";

type Promemoria = {
  pkDocente: string;
  desAnnotazioni: string;
  datEvento?: string;
  datGiorno?: string;
  docente: string;
  oraInizio?: string;
  oraFine?: string;
  flgVisibileFamiglia: string; // "S" o "N"
};

function truncateTitle(text: string, max = 30): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "..." : text;
}

// Funzione per popolare i promemoria
export async function seedPromemoriaRecords(
  client: NotionClient,
  databaseId: string,
  promemoria: Promemoria[]
) {
  for (const p of promemoria) {

    const fullText = p.desAnnotazioni || "";
    const shortTitle = truncateTitle(fullText);
    const eventoDate = buildDate(p.datEvento);

    // 🔍 Controllo duplicati su datEvento + desAnnotazioni
    if (eventoDate?.start) {
      const query = await client.databases.query({
        database_id: databaseId,
        filter: {
          and: [
            {
              property: "datEvento",
              date: {
                equals: eventoDate.start,
              },
            },
            {
              property: "desAnnotazioni",
              title: {
                equals: shortTitle,
              },
            },
          ],
        },
      });

      if (query.results.length > 0) {
        console.log(
          `Evento "${shortTitle}" del ${eventoDate.start} già presente, salto.`
        );
        continue;
      }
    }

    const properties: Record<string, any> = {
      desAnnotazioni: {
        title: [
          {
            text: { content: shortTitle },
          },
        ],
      },
      pkDocente: {
        rich_text: [{ text: { content: p.pkDocente || "" } }],
      },
      docente: {
        rich_text: [{ text: { content: p.docente || "" } }],
      },
      flgVisibileFamiglia: {
        checkbox: p.flgVisibileFamiglia === "S",
      },
      datEvento: {
        date: eventoDate,
      },
      datGiorno: {
        date: buildDate(p.datGiorno),
      },
      oraInizio: {
        rich_text: [{ text: { content: p.oraInizio || "00:00" } }],
      },
      oraFine: {
        rich_text: [{ text: { content: p.oraFine || "00:00" } }],
      },
    };

    await client.pages.create({
      parent: { database_id: databaseId },
      properties,
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: fullText,
                },
              },
            ],
          },
        },
      ],
    });
  }
}