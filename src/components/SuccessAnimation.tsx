import { useEffect, useState } from "react";

import { Box } from "@mui/material";

const SuccessAnimation = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true); // trigger animation
  }, []);

  return (
    <Box className="p-4 flex flex-col justify-center items-center gap-4">
      <i
        className="tabler-circle-check"
        style={{
          color: "green",
          fontSize: 150,
          opacity: show ? 1 : 0,
          transform: show ? "scale(1)" : "scale(0)",
          transition: "transform 0.5s cubic-bezier(0.68,-0.55,0.27,1.55)",
        }}
      />
    </Box>
  );
};

export default SuccessAnimation;
