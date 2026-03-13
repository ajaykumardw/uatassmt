import { useEffect, useState } from "react";

import { fetchQuestions, type Filters } from "../utils/questionApi";

export function useQuestions(filters: Filters) {

  const [data, setData] = useState([]);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);

  console.log(filters);

  useEffect(() => {

    if (filters.qp === null) return;

    const load = async () => {

      setLoading(true);

      try {

        const result =
          await fetchQuestions(filters);

        setData(result.data);

        setTotal(result.total);

      }
      catch (err) {

        console.error(err);

      }

      setLoading(false);

    };

    load();

  }, [filters]);

  return {

    data,

    total,

    loading

  };

}
