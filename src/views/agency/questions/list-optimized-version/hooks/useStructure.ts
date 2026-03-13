import { useEffect, useState } from "react";

import type { SSCType } from "@/types/sectorskills/sscType";

export function useStructure() {

  const [structure, setStructure] = useState<SSCType[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    // const cached =
    //   localStorage.getItem("structure");

    // if (cached) {

    //   setStructure(JSON.parse(cached));

    //   setLoading(false);

    //   return;

    // }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/structure`)
      .then(r => r.json())
      .then(data => {

        setStructure(data);

        // localStorage.setItem(
        //   "structure",
        //   JSON.stringify(data)
        // );

        setLoading(false);

      });

  }, []);

  return {

    structure,

    loading

  };

}
