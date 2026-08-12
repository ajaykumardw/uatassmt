// libs/generateTemplateHtml.ts

export default function generateTemplateHtml(template: any) {

  const {
    width,
    height,
    elements
  } = template;

  // ================= PER-CHARACTER BOLD =================
  const buildStyledText = (text: string, styles: any) => {
    if (!text || !styles) return text;

    return text
      .split("\n")
      .map((line, lineIndex) => {
        const lineStyles = styles[lineIndex];

        if (!lineStyles) return line;

        let result = "";
        let isBold = false;
        let buffer = "";

        const flush = () => {
          if (!buffer) return;

          result += isBold ? `<b>${buffer}</b>` : buffer;

          buffer = "";
        };

        for (let i = 0; i < line.length; i++) {
          const currentBold =
            !!lineStyles[i]?.fontWeight &&
            lineStyles[i].fontWeight === "bold";

          if (currentBold !== isBold) {
            flush();
            isBold = currentBold;
          }

          buffer += line[i];
        }

        flush();

        return result;
      })
      .join("\n");
  };

  const renderElement = (el: any) => {

    // ================= STATIC TEXT =================
    if (el.type === "static_text") {
      const translateX =
        el.originX === "center"
          ? "-50%"
          : el.originX === "right"
            ? "-100%"
            : "0";

      const translateY =
        el.originY === "center"
          ? "-50%"
          : el.originY === "bottom"
            ? "-100%"
            : "0";

      return `
        <div
          style="
            position:absolute;

            left:${el.left}px;
            top:${el.top}px;

            width:${el.width}px;

            transform: translate(${translateX}, ${translateY}) scale(${el.scaleX || 1}, ${el.scaleY || 1}) rotate(${el.angle || 0}deg);

            font-size:${el.fontSize || 20}px;

            color:${el.color || "#000"};

            font-weight:${el.fontWeight || "normal"};

            font-style:${el.fontStyle || "normal"};

            text-decoration: ${el.underline ? "underline" : "none"};

            text-align:${el.textAlign || "left"};

            line-height:${el.lineHeight || 1.2};

            font-family:${el.fontFamily || "Arial"};

            opacity:${el.opacity || 1};

            white-space:pre-line;

            transform-origin:top left;
          "
        >${buildStyledText(el.text, el.styles)}</div>
      `;
    }

    // ================= DYNAMIC TEXT =================
    if (el.type === "dynamic_text") {

      const translateX =
        el.originX === "center"
          ? "-50%"
          : el.originX === "right"
            ? "-100%"
            : "0";

      const translateY =
        el.originY === "center"
          ? "-50%"
          : el.originY === "bottom"
            ? "-100%"
            : "0";

      return `
        <div
          style="
            position:absolute;
            left:${el.left}px;
            top:${el.top}px;

            width:${el.width}px;

            transform: translate(${translateX}, ${translateY}) scale(${el.scaleX || 1}, ${el.scaleY || 1}) rotate(${el.angle || 0}deg);

            font-size:${el.fontSize || 20}px;

            color:${el.color || "#000"};

            font-weight:${el.fontWeight || "normal"};

            font-style:${el.fontStyle || "normal"};

            text-decoration: ${el.underline ? "underline" : "none"};

            text-align:${el.textAlign || "left"};

            line-height:${el.lineHeight || 1.2};

            font-family:${el.fontFamily || "Arial"};

            opacity:${el.opacity || 1};

            white-space:pre-line;

            transform-origin:top left;
          "
        >${buildStyledText(el.text, el.styles)}</div>
      `;
    }

    // ================= IMAGE =================
    if (el.type === "image") {

      const translateX =
        el.originX === "center"
          ? "-50%"
          : el.originX === "right"
            ? "-100%"
            : "0";

      const translateY =
        el.originY === "center"
          ? "-50%"
          : el.originY === "bottom"
            ? "-100%"
            : "0";

      return `
        <img
          src="{{${el.fileKey}}}"
          style="
            position:absolute;
            left:${el.left}px;
            top:${el.top}px;

            width:${el.width}px;
            height:${el.height}px;
            transform: translate(${translateX}, ${translateY}) scale(${el.scaleX || 1}, ${el.scaleY || 1}) rotate(${el.angle || 0}deg);
            transform-origin: ${el.originX || "top"} ${el.originY || "left"};

            object-fit:contain;
          "
        />
      `;
    }

    // ================= QR =================
    if (el.type === "qr") {

      const translateX =
        el.originX === "center"
          ? "-50%"
          : el.originX === "right"
            ? "-100%"
            : "0";

      const translateY =
        el.originY === "center"
          ? "-50%"
          : el.originY === "bottom"
            ? "-100%"
            : "0";

      return `
        <img
          src="{{qr_code}}"
          style="
            position:absolute;
            left:${el.left}px;
            top:${el.top}px;
            border: 2px solid #000;

            width:${el.size}px;
            height:${el.size}px;
            transform: translate(${translateX}, ${translateY}) scale(${el.scaleX || 1}, ${el.scaleY || 1}) rotate(${el.angle || 0}deg);
            transform-origin: ${el.originX || "top"} ${el.originY || "left"};

            object-fit:contain;
          "
        />
      `;
    }

    // ================= AGENCY LOGO =================
    if (el.type === "agency_logo") {

      const translateX =
        el.originX === "center"
          ? "-50%"
          : el.originX === "right"
            ? "-100%"
            : "0";

      const translateY =
        el.originY === "center"
          ? "-50%"
          : el.originY === "bottom"
            ? "-100%"
            : "0";

      return `
        <img
          src="{{agency_logo}}"
          style="
            position:absolute;
            left:${el.left}px;
            top:${el.top}px;

            width:${el.width}px;
            height:${el.height}px;
            transform: translate(${translateX}, ${translateY}) scale(${el.scaleX || 1}, ${el.scaleY || 1}) rotate(${el.angle || 0}deg);
            transform-origin: ${el.originX || "top"} ${el.originY || "left"};

            object-fit:contain;
          "
        />
      `;
    }

    // ================= AGENCY STAMP =================
    if (el.type === "agency_stamp") {
      const translateX =
        el.originX === "center"
          ? "-50%"
          : el.originX === "right"
            ? "-100%"
            : "0";

      const translateY =
        el.originY === "center"
          ? "-50%"
          : el.originY === "bottom"
            ? "-100%"
            : "0";

      return `
        <img
          src="{{agency_stamp}}"
          style="
            position:absolute;
            left:${el.left}px;
            top:${el.top}px;

            width:${el.width}px;
            height:${el.height}px;

            transform: translate(${translateX}, ${translateY}) scale(${el.scaleX || 1}, ${el.scaleY || 1}) rotate(${el.angle || 0}deg);
            transform-origin: ${el.originX || "top"} ${el.originY || "left"};

            object-fit:contain;
          "
        />
      `;
    }

    return "";
  };

  return `
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />

  <style>
    *{
      box-sizing:border-box;
      font-family:Times New Roman, serif !important;
    }

    body{
      margin:0;
      padding:0;
      font-family:Times New Roman, serif !important;
    }

    .certificate{
      position:relative;

      width:${width}px;
      height:${height}px;

      overflow:hidden;

      background-image:url('{{background}}');
      background-size:100% 100%;
      background-repeat:no-repeat;
    }
  </style>
</head>

<body>

  <div class="certificate">

    ${elements.map(renderElement).join("\n")}

  </div>

</body>
</html>
  `;
}
