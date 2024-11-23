import { normalizeDiacritics } from "@/utils/removeDiacritics";
import { extractCredits } from "@/utils/extractCredits";

export async function scrapeClassesPage(page: string) {
  const parser = new DOMParser();
  const gradesDocument = parser.parseFromString(page, "text/html");
  if (!gradesDocument.body) {
    console.log("could not mount document", document);
    return null;
  }

  const $table = document.querySelector<HTMLTableElement>(
    "#j_id_jsp_303365748_2 > table > tbody:nth-child(4)"
  );

  if (!$table) {
    console.log("could not found table in page", $table);
    return null;
  }

  const tableArray = Array.from($table.children);

  return tableArray
    .filter((row) => row.children.length === 5)
    .map((row) => {
      const NAME_SPLITTER = " - ";

      const rowCells = Array.from(row.children);
      const [$name, , $provisionPeriod, ,] = rowCells;

      if (!$name.textContent) {
        console.log("could not found component name in page", $name);
        return null;
      }

      if (!$provisionPeriod.textContent) {
        console.log(
          "could not found component provision period in page",
          $provisionPeriod
        );
        return null;
      }

      const [, normalizedName] = $name.textContent.split(NAME_SPLITTER);
      const normalizedProvisionPeriod = normalizeDiacritics(
        $provisionPeriod.textContent
      );

      return {
        name: normalizedName.trim().toLocaleLowerCase(),
        credits: extractCredits(normalizedProvisionPeriod),
      };
    });
}
