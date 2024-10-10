
export function removeDuplicates<T, K extends keyof T>(data: T[], key: K): T[] {

  const seen = new Set();

  return data.filter((item) => {

    const id = item[key];

    return seen.has(id) ? false : seen.add(id);

  });


}
