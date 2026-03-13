export type Filters = {
  qp: number | null;
  page: number;
  limit: number;
  pc: number | null;
  nos: number | null;
  search?: string
}

export async function fetchQuestions(filters: Filters) {

  let url = `${process.env.NEXT_PUBLIC_API_URL}/structure/question?qpId=${filters.qp}`;

  url += `&page=${filters.page}`;

  url += `&limit=${filters.limit}`;

  console.log("filter is fetchQuestions:", filters);

  if (filters.pc && filters.pc != null) {

    url += `&pcId=${filters.pc}`;

  }

  if (filters.nos && filters.nos != null) {

    url += `&nosId=${filters.nos}`;

  }

  if (filters.search) {

    url += `&search=${filters.search}`;

  }

  const res = await fetch(url);

  if (!res.ok) {

    throw Error("Failed");

  }

  return res.json();

}
