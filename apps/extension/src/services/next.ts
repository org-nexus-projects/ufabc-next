import { ofetch } from "ofetch";

type PaginatedSubjects = {
  total: number;
  pages: number
  data: {
    name: string;
    credits: number;
  }[]
}

function resolveEndpoint() {
  if (import.meta.env.PROD) {
    return 'https://api.v2.ufabcnext.com'
  }

  return 'http://localhost:5000'
}


export const nextService = ofetch.create({
  baseURL: resolveEndpoint(),
})

export async function getPaginatedSubjects(fetchAll = false) {
  const ITEMS_PER_PAGE = 200;

  const firstPage = await nextService<PaginatedSubjects>("/entities/subjects", {
    params: {
      page: 1,
      limit: ITEMS_PER_PAGE,
    },
  });

  if (!fetchAll || firstPage.pages <= 1) {
    return firstPage;
  }
  const remainingPages = Array.from({ length: firstPage.pages - 1 }, (_, i) =>
    nextService<PaginatedSubjects>("/entities/subjects", {
      params: {
        page: i + 2, // Start from page 2
        limit: ITEMS_PER_PAGE,
      },
    })
  );

  const additionalPages = await Promise.all(remainingPages);

  const allData = {
    total: firstPage.total,
    pages: firstPage.pages,
    data: [...firstPage.data, ...additionalPages.flatMap((page) => page.data)],
  };

  return allData;
}
