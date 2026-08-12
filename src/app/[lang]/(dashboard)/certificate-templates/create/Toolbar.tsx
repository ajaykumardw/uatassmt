// "use client";

// import { useEffect, useState } from "react";
// import {
//   Box,
//   Button,
//   Stack,
//   Typography,
//   Divider,
//   TextField
// } from "@mui/material";

// export default function Toolbar({ canvas, fabric }: any) {

//   const { Textbox, Rect, Text, Group, Image } = fabric;

//   const [fontSize, setFontSize] = useState(28);
//   const [color, setColor] = useState("#000000");
//   const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");

//   // ================= IMAGE LOADER =================
//   const loadImage = (src: string) =>
//     new Promise<any>((resolve) => {
//       const imgEl = new window.Image();
//       imgEl.src = src;
//       imgEl.onload = () => resolve(new Image(imgEl));
//     });

//   // ================= ORIENTATION =================
//   const applyOrientation = (type: "portrait" | "landscape") => {
//     let width = 1123;
//     let height = 794;

//     if (type === "portrait") {
//       width = 794;
//       height = 1123;
//     }

//     setOrientation(type);

//     canvas.setDimensions({ width, height });

//     const bg = canvas.getObjects().find((o: any) => o.customType === "background");

//     if (bg) {
//       bg.set({
//         left: 0,
//         top: 0,
//         originX: "left",
//         originY: "top",
//         scaleX: width / bg.width,
//         scaleY: height / bg.height
//       });
//     }

//     canvas.renderAll();
//   };

//   // ================= BOUNDARY LOCK =================
//   useEffect(() => {
//     if (!canvas) return;

//     const keepInside = (e: any) => {
//       const obj = e.target;
//       if (!obj || obj.customType === "background") return;

//       // ✅ use real bounding box (correct during scaling + rotation)
//       const bound = obj.getBoundingRect(true);

//       let newLeft = obj.left;
//       let newTop = obj.top;

//       // LEFT
//       if (bound.left < 0) {
//         newLeft -= bound.left;
//       }

//       // TOP
//       if (bound.top < 0) {
//         newTop -= bound.top;
//       }

//       // RIGHT
//       if (bound.left + bound.width > canvas.width) {
//         newLeft -= (bound.left + bound.width - canvas.width);
//       }

//       // BOTTOM
//       if (bound.top + bound.height > canvas.height) {
//         newTop -= (bound.top + bound.height - canvas.height);
//       }

//       obj.set({
//         left: newLeft,
//         top: newTop
//       });
//     };

//     // 🔥 apply to BOTH moving + scaling
//     canvas.on("object:moving", keepInside);
//     canvas.on("object:scaling", keepInside);

//     return () => {
//       canvas.off("object:moving", keepInside);
//       canvas.off("object:scaling", keepInside);
//     };
//   }, [canvas]);

//   // ================= QR =================
//   const addQR = () => {
//     const rect = new Rect({
//       width: 100,
//       height: 100,
//       fill: "#eee",
//       stroke: "#000"
//     });

//     const label = new Text("QR", {
//       fontSize: 16,
//       originX: "center",
//       originY: "center"
//     });

//     const group = new Group([rect, label], {
//       left: 900,
//       top: 600
//     });

//     group.customType = "qr";

//     canvas.add(group);
//     canvas.renderAll();
//   };

//   // ================= BACKGROUND =================
//   const setBackground = async (e: any) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();

//     reader.onload = async (f: any) => {

//       const oldBg = canvas.getObjects().find((o: any) => o.customType === "background");
//       if (oldBg) {
//         canvas.remove(oldBg);
//         canvas.discardActiveObject();
//       }

//       const img = await loadImage(f.target.result);

//       img.set({
//         left: 0,
//         top: 0,
//         originX: "left",
//         originY: "top",
//         scaleX: canvas.width / img.width,
//         scaleY: canvas.height / img.height,

//         selectable: false,
//         evented: false
//       });

//       img.customType = "background";
//       img.srcOriginal = f.target.result;

//       canvas.add(img);
//       canvas.moveObjectTo(img, 0);

//       canvas.renderAll();
//     };

//     reader.readAsDataURL(file);
//   };

//   // ================= SIGNATURE =================
//   const addSignature = async (e: any) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();

//     reader.onload = async (f: any) => {
//       const img = await loadImage(f.target.result);

//       // ✅ dynamic safe scaling
//       const maxWidth = canvas.width * 0.25; // 25% of canvas
//       const scale = maxWidth / img.width;

//       img.set({
//         left: 50,
//         top: 50,
//         scaleX: scale,
//         scaleY: scale
//       });

//       img.customType = "signature";
//       img.srcOriginal = f.target.result;

//       canvas.add(img);
//       canvas.setActiveObject(img);
//       canvas.renderAll();
//     };

//     reader.readAsDataURL(file);
//   };

//   // ================= DELETE =================
//   const deleteSelected = () => {
//     const obj = canvas.getActiveObject();

//     if (obj) {
//       canvas.remove(obj);
//       canvas.discardActiveObject();
//       canvas.renderAll();
//     }
//   };

//   // ================= TEXT STYLE =================
//   const updateFontSize = (size: number) => {
//     const obj = canvas.getActiveObject();

//     if (obj?.customType === "text") {
//       obj.set("fontSize", size);
//       canvas.renderAll();
//     }

//     if (obj?.customType === "static_text" || obj?.customType === "dynamic_text") {
//       obj.set("fontSize", size);
//       canvas.renderAll();
//     }
//   };

//   const updateColor = (color: string) => {
//     const obj = canvas.getActiveObject();

//     if (obj?.customType === "text") {
//       obj.set("fill", color);
//       canvas.renderAll();
//     }
//   };

//   // ================= SYNC =================
//   useEffect(() => {
//     if (!canvas) return;

//     const handler = () => {
//       const obj = canvas.getActiveObject();

//       if (obj?.customType === "static_text" || obj?.customType === "dynamic_text") {
//         setFontSize(obj.fontSize || 28);
//         setColor(obj.fill || "#000000");
//       }
//     };

//     canvas.on("selection:created", handler);
//     canvas.on("selection:updated", handler);

//     return () => {
//       canvas.off("selection:created", handler);
//       canvas.off("selection:updated", handler);
//     };
//   }, [canvas]);

//   const addStaticText = () => {
//     const text = new Textbox("Edit this text", {
//       left: 200,
//       top: 200,
//       fontSize,
//       fill: color,
//       editable: true,

//       lockScalingX: true,
//       lockScalingY: true,
//       lockRotation: true,
//     });

//     text.customType = "static_text";

//     canvas.add(text);
//     canvas.setActiveObject(text);
//     canvas.renderAll();
//   };

//   const addDynamicText = (key: string) => {
//     const text = new Textbox(`{{${key}}}`, {
//       left: 200,
//       top: 200,
//       fontSize,
//       fill: "#1976d2",

//       editable: false, // ❌ cannot edit
//       selectable: true,

//       lockScalingX: true,
//       lockScalingY: true,
//       lockRotation: true,
//       hasControls: false
//     });

//     text.customType = "dynamic_text";
//     text.dataKey = key;

//     canvas.add(text);
//     canvas.setActiveObject(text);
//     canvas.renderAll();
//   };

//   // ================= SAVE =================
//   const saveTemplate = async () => {

//     let background: any = null;

//     const elements = canvas.getObjects().map((obj: any) => {

//       if (obj.customType === "background") {
//         background = {
//           src: obj.srcOriginal,
//           scaleX: obj.scaleX,
//           scaleY: obj.scaleY
//         };
//         return null;
//       }

//       if (obj.customType === "static_text") {
//         return {
//           type: "static_text",
//           text: obj.text,
//           left: obj.left,
//           top: obj.top,
//           fontSize: obj.fontSize,
//           color: obj.fill
//         };
//       }

//       if (obj.customType === "dynamic_text") {
//         return {
//           type: "dynamic_text",
//           key: obj.dataKey,
//           left: obj.left,
//           top: obj.top,
//           fontSize: obj.fontSize,
//           color: obj.fill
//         };
//       }

//       if (obj.customType === "text") {
//         return {
//           type: "text",
//           key: obj.dataKey,
//           left: obj.left,
//           top: obj.top,
//           fontSize: obj.fontSize,
//           color: obj.fill
//         };
//       }

//       if (obj.customType === "qr") {
//         return {
//           type: "qr",
//           left: obj.left,
//           top: obj.top,
//           size: obj.width * obj.scaleX
//         };
//       }

//       if (obj.customType === "signature") {
//         return {
//           type: "image",
//           key: "signature",
//           left: obj.left,
//           top: obj.top,
//           width: obj.width * obj.scaleX,
//           height: obj.height * obj.scaleY,
//           src: obj.srcOriginal
//         };
//       }

//       return null;
//     }).filter(Boolean);

//     const template = {
//       width: canvas.width,
//       height: canvas.height,
//       orientation,
//       background,
//       elements
//     };

//     await fetch("/api/templates", {
//       method: "POST",
//       body: JSON.stringify(template)
//     });

//     alert("Template saved!");
//   };

//   return (
//     <Box sx={{ width: 260, p: 2, borderRight: "1px solid #ddd" }}>
//       <Stack spacing={2}>

//         <Typography variant="h6">Static Text</Typography>
//         <Button variant="contained" onClick={addStaticText}>
//           Add Text
//         </Button>

//         <Divider />

//         <Typography variant="h6">Dynamic Fields</Typography>

//         <Button variant="outlined" onClick={() => addDynamicText("candidate_name")}>
//           Candidate Name
//         </Button>

//         <Button variant="outlined" onClick={() => addDynamicText("course")}>
//           Course
//         </Button>

//         <Button variant="outlined" onClick={() => addDynamicText("date")}>
//           Date
//         </Button>
//         <Button variant="contained" onClick={addQR}>QR Code</Button>

//         <Divider />

//         <Typography variant="h6">Orientation</Typography>
//         <Stack direction="row" spacing={1}>
//           <Button
//             variant={orientation === "landscape" ? "contained" : "outlined"}
//             onClick={() => applyOrientation("landscape")}
//           >
//             Landscape
//           </Button>

//           <Button
//             variant={orientation === "portrait" ? "contained" : "outlined"}
//             onClick={() => applyOrientation("portrait")}
//           >
//             Portrait
//           </Button>
//         </Stack>

//         <Divider />

//         <Typography variant="h6">Text Style</Typography>

//         <TextField
//           label="Font Size"
//           type="number"
//           size="small"
//           value={fontSize}
//           onChange={(e) => {
//             const val = Number(e.target.value);
//             setFontSize(val);
//             updateFontSize(val);
//           }}
//         />

//         <TextField
//           label="Text Color"
//           type="color"
//           size="small"
//           value={color}
//           onChange={(e) => {
//             setColor(e.target.value);
//             updateColor(e.target.value);
//           }}
//         />

//         <Divider />

//         <Typography variant="h6">Upload</Typography>

//         <Button component="label" variant="outlined">
//           Background
//           <input hidden type="file" onChange={setBackground} onClick={(e:any)=>e.target.value=null}/>
//         </Button>

//         <Button component="label" variant="outlined">
//           Signature
//           <input hidden type="file" onChange={addSignature} />
//         </Button>

//         <Divider />

//         <Typography variant="h6">Actions</Typography>

//         <Button color="error" variant="contained" onClick={deleteSelected}>
//           Delete
//         </Button>

//         <Button color="success" variant="contained" onClick={saveTemplate}>
//           Save Template
//         </Button>

//       </Stack>
//     </Box>
//   );
// }


"use client";

import { useEffect, useState } from "react";

import CardContent from "@mui/material/CardContent"

import {
  Button,
  Typography,
  Divider,
  TextField,
  Card
} from "@mui/material";

import { toast } from "react-toastify";

import CustomIconButton from "@/@core/components/mui/IconButton";

export default function Toolbar({ canvas, fabric, mode = "create", templateId, initialConfig, initialName, onSaved }: any) {
  const { Textbox, Rect, Text, Group, Image } = fabric;

  const [fontSize, setFontSize] = useState(20);
  const [color, setColor] = useState("#000000");
  const [name, setName] = useState(initialName || "Template Name");

  const [orientation, setOrientation] =
    useState<"portrait" | "landscape">("landscape");

  const [fontWeight, setFontWeight] = useState("normal");
  const [fontStyle, setFontStyle] = useState("normal");
  const [underline, setUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");

  // ================= IMAGE LOADER =================
  const loadImage = (src: string) =>
    new Promise<any>((resolve) => {
      const imgEl = new window.Image();

      const timeout = setTimeout(() => {
        imgEl.src = "";
        resolve(null);
      }, 8000);

      imgEl.onload = () => {
        clearTimeout(timeout);
        resolve(new Image(imgEl));
      };

      imgEl.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };

      imgEl.src = src;
    });

  // ================= ORIENTATION =================
  const applyOrientation = (type: "portrait" | "landscape") => {
    let width = 1123;
    let height = 794;

    if (type === "portrait") {
      width = 794;
      height = 1123;
    }

    setOrientation(type);
    canvas.setDimensions({ width, height });

    const bg = canvas
      .getObjects()
      .find((o: any) => o.customType === "background");

    if (bg) {
      bg.set({
        left: 0,
        top: 0,
        originX: "left",
        originY: "top",
        scaleX: width / bg.width,
        scaleY: height / bg.height
      });
    }

    canvas.renderAll();
  };

  // ================= BOUNDARY LOCK =================
  useEffect(() => {
    if (!canvas) return;

    const keepInside = (e: any) => {
      const obj = e.target;

      if (!obj || obj.customType === "background") return;

      const bound = obj.getBoundingRect(true);

      let newLeft = obj.left;
      let newTop = obj.top;

      if (bound.left < 0) newLeft -= bound.left;
      if (bound.top < 0) newTop -= bound.top;

      if (bound.left + bound.width > canvas.width) {
        newLeft -= bound.left + bound.width - canvas.width;
      }

      if (bound.top + bound.height > canvas.height) {
        newTop -= bound.top + bound.height - canvas.height;
      }

      obj.set({ left: newLeft, top: newTop });
    };

    canvas.on("object:moving", keepInside);
    canvas.on("object:scaling", keepInside);

    return () => {
      canvas.off("object:moving", keepInside);
      canvas.off("object:scaling", keepInside);
    };
  }, [canvas]);

  // ================= ALIGNMENT =================
  const align = (type: string) => {
    const obj = canvas.getActiveObject();

    if (!obj) return;

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // Always work with CENTER origin (prevents drift)
    const center = obj.getCenterPoint();

    let x = center.x;
    let y = center.y;

    switch (type) {
      case "left":
        x = obj.getScaledWidth() / 2;
        break;

      case "center":
        x = canvasWidth / 2;
        break;

      case "right":
        x = canvasWidth - obj.getScaledWidth() / 2;
        break;

      case "top":
        y = obj.getScaledHeight() / 2;
        break;

      case "middle":
        y = canvasHeight / 2;
        break;

      case "bottom":
        y = canvasHeight - obj.getScaledHeight() / 2;
        break;
    }

    // 🔥 Always set using center → no cumulative shift
    obj.setPositionByOrigin({ x, y }, "center", "center");

    obj.setCoords();
    canvas.renderAll();
  };

  // ================= TEXT STYLE =================
  const updateStyle = (styles: any) => {
    const obj = canvas.getActiveObject();

    if (!obj) return;

    if (
      obj.customType === "static_text" ||
      obj.customType === "dynamic_text"
    ) {
      obj.set(styles);
      obj.setCoords();
      canvas.renderAll();
    }

    // obj.set(styles);
    // obj.setCoords();
    // canvas.renderAll();
  };

  // ================= SINGLE INSTANCE HELPER =================
  const removeExistingByType = (type: string) => {
    const existing = canvas
      .getObjects()
      .find((o: any) => o.customType === type);

    if (existing) {
      canvas.remove(existing);
    }
  };

  // ================= TEXT =================
  const addStaticText = () => {
    const text = new Textbox("Edit this text", {
      left: 200,
      top: 200,
      fontSize,
      fill: color
    });

    text.customType = "static_text";

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addDynamicText = (key: string) => {
    const text = new Textbox(`{{${key}}}`, {
      left: 200,
      top: 200,
      fontSize,
      fill: color,
      editable: false
    });

    text.customType = "dynamic_text";
    text.dataKey = key;

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addIssueDate = () => {
    const text = new Textbox("Date of Issuance: {{issue_date}}\nSystem Identification Number\n{{system_identification_no}}", {
      left: canvas.getWidth() / 2 + 200,
      top: canvas.getHeight() - 300,
      fontSize: 16,
      fill: color,
      width: 400,
      textAlign: "center",
      editable: true
    });

    text.customType = "dynamic_text";
    text.dataKey = "issue_date";

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }

  const addCertificateNo = () => {
    const text = new Textbox("{{certificate_no}}", {
      left: canvas.getWidth() - 250,
      top: canvas.getHeight() - 130,
      fontSize: 16,
      textAlign: "center",
      fill: color,
      editable: false
    });

    text.customType = "dynamic_text";
    text.dataKey = "certificate_no";

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  // ================= Agency Logo =================
  const addAgencyLogo = () => {

    // 🔥 remove old one
    removeExistingByType("agency_logo");

    const rect = new Rect({
      width: 100,
      height: 100,
      fill: "#eee",
      stroke: "#000"
    });

    const label = new Text("Agency Logo", {
      fontSize: 16,
      originX: "center",
      originY: "center"
    });

    const group = new Group([rect, label], {
      left: canvas.getWidth() - 150,
      top: 100
    });

    group.customType = "agency_logo";

    canvas.add(group);
    canvas.renderAll();
  };

  const addAgencyStamp = () => {

    // 🔥 remove old one
    removeExistingByType("agency_stamp");

    const rect = new Rect({
      width: 100,
      height: 100,
      fill: "#eee",
      stroke: "#000"
    });

    const label = new Text("Stamp", {
      fontSize: 16,
      originX: "center",
      originY: "center"
    });

    const group = new Group([rect, label], {
      left: canvas.getWidth() / 2 - 250,
      top: canvas.getHeight() - 200
    });

    group.customType = "agency_stamp";

    canvas.add(group);
    canvas.renderAll();
  };

  // ================= QR =================
  const addQR = () => {

    // 🔥 remove old QR
    removeExistingByType("qr");

    const rect = new Rect({
      width: 100,
      height: 100,
      fill: "#eee",
      stroke: "#000"
    });

    const label = new Text("QR", {
      fontSize: 16,
      originX: "center",
      originY: "center"
    });

    const group = new Group([rect, label], {
      left: canvas.getWidth() - 250,
      top: canvas.getHeight() - 200
    });

    group.customType = "qr";

    canvas.add(group);
    canvas.renderAll();
  };

  // ================= BACKGROUND =================
  // const setBackground = async (e: any) => {
  //   const file = e.target.files[0];

  //   if (!file) return;

  //   const reader = new FileReader();

  //   reader.onload = async (f: any) => {
  //     const oldBg = canvas
  //       .getObjects()
  //       .find((o: any) => o.customType === "background");

  //     if (oldBg) canvas.remove(oldBg);

  //     const img = await loadImage(f.target.result);

  //     img.set({
  //       left: 0,
  //       top: 0,
  //       originX: "left",
  //       originY: "top",
  //       scaleX: canvas.width / img.width,
  //       scaleY: canvas.height / img.height,
  //       selectable: false,
  //       evented: false
  //     });

  //     img.customType = "background";
  //     img.srcOriginal = f.target.result;

  //     canvas.add(img);
  //     canvas.moveObjectTo(img, 0);
  //     canvas.renderAll();
  //   };

  //   reader.readAsDataURL(file);
  // };

  const setBackground = async (e: any) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (f: any) => {
      const oldBg = canvas
        .getObjects()
        .find((o: any) => o.customType === "background");

      if (oldBg) canvas.remove(oldBg);

      const img = await loadImage(f.target.result);

      img.set({
        left: 0,
        top: 0,
        originX: "left",
        originY: "top",
        scaleX: canvas.width / img.width,
        scaleY: canvas.height / img.height,
        selectable: false,
        evented: false
      });

      img.customType = "background";

      // 🔥 IMPORTANT: base64 nahi, FILE store karo
      img.file = file;

      canvas.add(img);
      canvas.moveObjectTo(img, 0);
      canvas.renderAll();
    };

    reader.readAsDataURL(file);
  };

  // certificate content with multiple dynamic fields
  const boldTokensInLine = (line: string, tokens: string[]) => {
    const charStyles: any = {};

    tokens.forEach((token) => {
      let index = 0;

      while (index < line.length) {
        const start = line.indexOf(token, index);

        if (start === -1) break;

        for (let i = start; i < start + token.length; i++) {
          charStyles[i] = { fontWeight: "bold" };
        }

        index = start + token.length;
      }
    });

    return charStyles;
  };

  const addCertificateContent = () => {
    const lines = [
      "This is to certify that",
      "{{candidate_name}} {{father_name}}",
      "has successfully completed the assessment for the Job role of",
      "{{qp_name}}",
      "conforming to National Skills Qualifications Framework Level-{{qp_level}}",
      "Scheme:- {{scheme}}",
      "Institution Name:- {{tp_name}}",
      "Assessed by:- {{agency_name}}"
    ];

    const styles: any = {};

    styles[1] = boldTokensInLine(lines[1], ["{{candidate_name}}", "{{father_name}}"]);
    styles[3] = boldTokensInLine(lines[3], ["{{qp_name}}"]);
    styles[4] = boldTokensInLine(lines[4], ["{{qp_level}}"]);
    styles[5] = boldTokensInLine(lines[5], ["{{scheme}}"]);
    styles[6] = boldTokensInLine(lines[6], ["{{tp_name}}"]);
    styles[7] = boldTokensInLine(lines[7], ["{{agency_name}}"]);

    const text = new Textbox(
      lines.join("\n"),
      {
        left: canvas.getWidth() / 2,
        top: 300,
        fontSize: 20,
        fill: "#000",

        width: canvas.getWidth() * 0.7, // 🔥 important for wrapping
        textAlign: "center",
        lineHeight: 1.4,

        editable: true,
        selectable: true,

        styles
      }
    );

    text.set({
      originX: "center",
      originY: "center"
    });

    text.customType = "dynamic_text";
    text.dataKey = "certificate_content";

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  // ================= SIGNATURE =================
  // const addSignature = async (e: any) => {
  //   const file = e.target.files[0];

  //   if (!file) return;

  //   const reader = new FileReader();

  //   reader.onload = async (f: any) => {
  //     const img = await loadImage(f.target.result);

  //     const maxWidth = canvas.width * 0.25;
  //     const scale = maxWidth / img.width;

  //     img.set({
  //       left: 50,
  //       top: 50,
  //       scaleX: scale,
  //       scaleY: scale
  //     });

  //     img.customType = "signature";
  //     img.srcOriginal = f.target.result;

  //     canvas.add(img);
  //     canvas.setActiveObject(img);
  //     canvas.renderAll();
  //   };

  //   reader.readAsDataURL(file);
  // };

  const addSignature = async (e: any) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (f: any) => {
      const img = await loadImage(f.target.result);

      const maxWidth = canvas.width * 0.25;
      const scale = maxWidth / img.width;

      img.set({
        left: 50,
        top: 50,
        scaleX: scale,
        scaleY: scale
      });

      img.customType = "signature";

      // 🔥 FILE store karo
      img.file = file;

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    };

    reader.readAsDataURL(file);
  };

  const addImage = async (e: any) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (f: any) => {
      const img = await loadImage(f.target.result);

      // 🔥 auto scale (safe default)
      const maxWidth = canvas.width * 0.25;
      const scale = maxWidth / img.width;

      img.set({
        left: 50,
        top: 50,
        scaleX: scale,
        scaleY: scale
      });

      // ✅ IMPORTANT
      img.customType = "image";
      img.file = file; // backend ke liye

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    };

    reader.readAsDataURL(file);
  };

  const addHeadStamp = () => {
    const text = new Textbox(
      "{{head_name}}\nHead of Assessment\n{{agency_name}}",
      {
        left: 200,
        top: 600,
        fontSize,
        fill: color,
        width: 300,

        editable: false, // ❌ no editing
        selectable: true, // ✅ can move
        lockMovementX: false,
        lockMovementY: false,
        lockScalingX: false,
        lockScalingY: false,
        lockRotation: false,

        textAlign: "left", // looks better by default
        lineHeight: 1.2,

        styles: {
          0: boldTokensInLine("{{head_name}}", ["{{head_name}}"]),
          2: boldTokensInLine("{{agency_name}}", ["{{agency_name}}"])
        }
      }
    );

    text.customType = "dynamic_text";
    text.dataKey = "head_stamp"; // 🔥 important for backend

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  // ================= DELETE =================
  const deleteSelected = () => {
    const obj = canvas.getActiveObject();

    if (!obj) return;

    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  // ================= LOAD EXISTING TEMPLATE =================
  const loadTemplate = async (config: any) => {
    if (!config) return;

    // reset canvas
    canvas.getObjects().forEach((obj: any) => canvas.remove(obj));

    canvas.setDimensions({ width: config.width || 1123, height: config.height || 794 });

    setOrientation(config.orientation || "landscape");

    // ================= BACKGROUND =================
    if (config.background?.url) {
      try {
        const img = await loadImage(config.background.url);

        if (img) {
          img.set({
            left: 0,
            top: 0,
            originX: "left",
            originY: "top",
            scaleX: (config.width || 1123) / img.width,
            scaleY: (config.height || 794) / img.height,
            selectable: false,
            evented: false
          });

          img.customType = "background";
          img.existingUrl = config.background.url;

          canvas.add(img);
          canvas.moveObjectTo(img, 0);
        }
      } catch (e) {
        console.error("Error loading background:", e);
      }
    }

    // ================= ELEMENTS =================
    for (const el of config.elements || []) {
      try {
        // ---------- STATIC TEXT ----------
        if (el.type === "static_text") {
          const text = new Textbox(el.text || "Text", {
            left: el.left,
            top: el.top,
            width: el.width || 200,
            fontSize: el.fontSize || 20,
            fill: el.color || "#000",
            fontWeight: el.fontWeight,
            fontStyle: el.fontStyle,
            underline: el.underline,
            textAlign: el.textAlign,
            lineHeight: el.lineHeight,
            fontFamily: el.fontFamily,
            opacity: el.opacity,
            angle: el.angle,
            scaleX: el.scaleX || 1,
            scaleY: el.scaleY || 1,
            styles: el.styles
          });

          if (el.originX) text.set({ originX: el.originX });
          if (el.originY) text.set({ originY: el.originY });

          text.customType = "static_text";

          canvas.add(text);
        }

        // ---------- DYNAMIC TEXT ----------
        if (el.type === "dynamic_text") {
          const text = new Textbox(el.text || `{{${el.key}}}`, {
            left: el.left,
            top: el.top,
            width: el.width || 200,
            fontSize: el.fontSize || 20,
            fill: el.color || "#000",
            fontWeight: el.fontWeight,
            fontStyle: el.fontStyle,
            underline: el.underline,
            textAlign: el.textAlign,
            lineHeight: el.lineHeight,
            fontFamily: el.fontFamily,
            opacity: el.opacity,
            angle: el.angle,
            scaleX: el.scaleX || 1,
            scaleY: el.scaleY || 1,
            editable: false,
            styles: el.styles
          });

          if (el.originX) text.set({ originX: el.originX });
          if (el.originY) text.set({ originY: el.originY });

          text.customType = "dynamic_text";
          text.dataKey = el.key;

          canvas.add(text);
        }

        // ---------- IMAGE ----------
        if (el.type === "image" && el.src) {
          const img = await loadImage(el.src);

          if (!img) {
            continue;
          }

          img.set({
            left: el.left,
            top: el.top,
            angle: el.angle,
            opacity: el.opacity
          });

          if (el.originX) img.set({ originX: el.originX });
          if (el.originY) img.set({ originY: el.originY });

          img.set({
            scaleX: (el.width || 100) / img.width,
            scaleY: (el.height || 100) / img.height
          });

          img.customType = "image";
          img.fileKey = el.fileKey;
          img.existingSrc = el.src;

          canvas.add(img);
        }

        // ---------- QR ----------
        if (el.type === "qr") {
          const rect = new Rect({
            width: el.size || 100,
            height: el.size || 100,
            fill: "#eee",
            stroke: "#000"
          });

          const label = new Text("QR", {
            fontSize: 16,
            originX: "center",
            originY: "center"
          });

          const group = new Group([rect, label], {
            left: el.left,
            top: el.top,
            angle: el.angle,
            opacity: el.opacity
          });

          group.customType = "qr";

          canvas.add(group);
        }

        // ---------- AGENCY LOGO ----------
        if (el.type === "agency_logo") {
          const rect = new Rect({
            width: el.width || 100,
            height: el.height || 100,
            fill: "#eee",
            stroke: "#000"
          });

          const label = new Text("Agency Logo", {
            fontSize: 16,
            originX: "center",
            originY: "center"
          });

          const group = new Group([rect, label], {
            left: el.left,
            top: el.top,
            angle: el.angle,
            opacity: el.opacity
          });

          group.customType = "agency_logo";

          canvas.add(group);
        }

        // ---------- AGENCY STAMP ----------
        if (el.type === "agency_stamp") {
          const rect = new Rect({
            width: el.width || 100,
            height: el.height || 100,
            fill: "#eee",
            stroke: "#000"
          });

          const label = new Text("Stamp", {
            fontSize: 16,
            originX: "center",
            originY: "center"
          });

          const group = new Group([rect, label], {
            left: el.left,
            top: el.top,
            angle: el.angle,
            opacity: el.opacity
          });

          group.customType = "agency_stamp";

          canvas.add(group);
        }
      } catch (e) {
        console.error("Error loading element:", el, e);
      }
    }

    canvas.renderAll();
  };

  // ================= LOAD TEMPLATE ON MOUNT =================
  useEffect(() => {
    if (initialConfig && canvas) {
      loadTemplate(initialConfig);
    }
  }, [canvas, initialConfig]);

  // ================= PREFILL TEMPLATE =================
  const prefillTemplate = () => {

    // optional cleanup
    canvas.getObjects().forEach((obj: any) => {
      if (obj.customType !== "background") {
        canvas.remove(obj);
      }
    });

    // 🔥 existing functions reuse karo
    addAgencyLogo();

    addCertificateContent();

    addAgencyStamp();
    addHeadStamp();

    addIssueDate();

    addQR();
    addCertificateNo();


    // optional extra static heading
    const title = new Textbox("CERTIFICATE", {
      left: canvas.getWidth() / 2,
      top: 100,
      originX: "center",

      fontSize: 28,
      fontWeight: "bold",
      fill: "#000",

      textAlign: "center",
      underline: true,
      width: 100
    });

    title.customType = "static_text";

    canvas.add(title);

    canvas.renderAll();
  };


  // ================= SYNC =================
  useEffect(() => {
    if (!canvas) return;

    const sync = () => {
      const obj = canvas.getActiveObject();

      if (!obj) return;

      setFontSize(obj.fontSize || 20);
      setColor(obj.fill || "#000000");
      setFontWeight(obj.fontWeight || "normal");
      setFontStyle(obj.fontStyle || "normal");
      setUnderline(obj.underline || false);
    };

    canvas.on("selection:created", sync);
    canvas.on("selection:updated", sync);

    return () => {
      canvas.off("selection:created", sync);
      canvas.off("selection:updated", sync);
    };
  }, [canvas]);

  // ================= SAVE =================
  // const saveTemplate = async () => {
  //   let background: any = null;

  //   const elements = canvas
  //     .getObjects()
  //     .map((obj: any) => {
  //       if (obj.customType === "background") {
  //         background = {
  //           src: obj.srcOriginal,
  //           scaleX: obj.scaleX,
  //           scaleY: obj.scaleY
  //         };

  //         return null;
  //       }

  //       if (obj.customType === "static_text") {
  //         return {
  //           type: "static_text",
  //           text: obj.text,
  //           left: obj.left,
  //           top: obj.top,
  //           fontSize: obj.fontSize,
  //           color: obj.fill
  //         };
  //       }

  //       if (obj.customType === "dynamic_text") {
  //         return {
  //           type: "dynamic_text",
  //           key: obj.dataKey,
  //           text: obj.text,
  //           left: obj.left,
  //           top: obj.top,
  //           fontSize: obj.fontSize
  //         };
  //       }

  //       if (obj.customType === "qr") {
  //         return {
  //           type: "qr",
  //           left: obj.left,
  //           top: obj.top,
  //           size: obj.width * obj.scaleX
  //         };
  //       }

  //       if (obj.customType === "signature") {
  //         return {
  //           type: "image",
  //           key: "signature",
  //           left: obj.left,
  //           top: obj.top,
  //           width: obj.width * obj.scaleX,
  //           height: obj.height * obj.scaleY,
  //           src: obj.srcOriginal
  //         };
  //       }

  //       return null;
  //     })
  //     .filter(Boolean);

  //   await fetch("/api/templates", {
  //     method: "POST",
  //     body: JSON.stringify({
  //       width: canvas.width,
  //       height: canvas.height,
  //       orientation,
  //       background,
  //       elements
  //     })
  //   });

  //   alert("Template saved!");
  // };

  const saveTemplate = async () => {
    const formData = new FormData();

    let background: any = null;

    const elements = canvas.getObjects().map((obj: any) => {

      // ================= BACKGROUND =================
      if (obj.customType === "background") {
        if (obj.file) {
          formData.append("background", obj.file); // 🔥 file भेजो
        }

        background = {
          type: "image",
          fileKey: "background",
          ...(obj.existingUrl ? { url: obj.existingUrl } : {})
        };

        return null;
      }

      // // ================= STATIC TEXT =================
      // if (obj.customType === "static_text") {
      //   return {
      //     id: crypto.randomUUID(),
      //     type: "static_text",
      //     text: obj.text,
      //     left: obj.left,
      //     top: obj.top,
      //     fontSize: obj.fontSize,
      //     color: obj.fill
      //   };
      // }

      if (obj.customType === "static_text") {
        return {
          id: crypto.randomUUID(),
          type: "static_text",
          text: obj.text,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          originX: obj.originX,
          originY: obj.originY,
          angle: obj.angle,
          fontSize: obj.fontSize,
          color: obj.fill,
          fontWeight: obj.fontWeight,
          fontStyle: obj.fontStyle,
          underline: obj.underline,
          textAlign: obj.textAlign,
          lineHeight: obj.lineHeight,
          fontFamily: obj.fontFamily,
          opacity: obj.opacity,
          styles: obj.styles
        };
      }

      // // ================= DYNAMIC TEXT =================
      // if (obj.customType === "dynamic_text") {
      //   return {
      //     id: crypto.randomUUID(),
      //     type: "dynamic_text",
      //     key: obj.dataKey,
      //     text: obj.text,
      //     left: obj.left,
      //     top: obj.top,
      //     fontSize: obj.fontSize
      //   };
      // }

      // ================= DYNAMIC TEXT =================
      if (obj.customType === "dynamic_text") {
        return {
          id: crypto.randomUUID(),
          type: "dynamic_text",
          key: obj.dataKey,
          text: obj.text,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          originX: obj.originX,
          originY: obj.originY,
          angle: obj.angle,
          fontSize: obj.fontSize,
          color: obj.fill,
          fontWeight: obj.fontWeight,
          fontStyle: obj.fontStyle,
          underline: obj.underline,
          textAlign: obj.textAlign,
          lineHeight: obj.lineHeight,
          fontFamily: obj.fontFamily,
          opacity: obj.opacity,
          styles: obj.styles
        };
      }

      // ================= QR =================
      if (obj.customType === "qr") {
        return {
          id: crypto.randomUUID(),
          type: "qr",
          left: obj.left,
          top: obj.top,
          size: obj.width * obj.scaleX,
          originX: obj.originX,
          originY: obj.originY,
          angle: obj.angle,
          opacity: obj.opacity
        };
      }

      if (obj.customType === "agency_logo") {
        return {
          id: crypto.randomUUID(),
          type: "agency_logo",
          left: obj.left,
          top: obj.top,
          width: obj.width * obj.scaleX,
          height: obj.height * obj.scaleY,
          originX: obj.originX,
          originY: obj.originY,
          angle: obj.angle,
          opacity: obj.opacity
        };
      }

      if (obj.customType === "agency_stamp") {
        return {
          id: crypto.randomUUID(),
          type: "agency_stamp",
          left: obj.left,
          top: obj.top,
          width: obj.width * obj.scaleX,
          height: obj.height * obj.scaleY,
          originX: obj.originX,
          originY: obj.originY,
          angle: obj.angle,
          opacity: obj.opacity
        };
      }

      // ================= SIGNATURE =================
      if (obj.customType === "signature") {
        const fileKey = "signature_1";

        if (obj.file) {
          formData.append(`files[${fileKey}]`, obj.file); // file
        }

        return {
          id: crypto.randomUUID(),
          type: "image",
          key: "signature",
          fileKey, // 🔥 important
          left: obj.left,
          top: obj.top,
          width: obj.width * obj.scaleX,
          height: obj.height * obj.scaleY,
          ...(obj.existingSrc ? { src: obj.existingSrc } : {})
        };
      }

      if (obj.customType === "image") {
        const fileKey = `asset_${crypto.randomUUID()}`; // ✅ unique

        if (obj.file) {
          formData.append(`files[${fileKey}]`, obj.file);
        }

        return {
          id: crypto.randomUUID(),
          type: "image",
          fileKey,
          left: obj.left,
          top: obj.top,
          width: obj.width * obj.scaleX,
          height: obj.height * obj.scaleY,
          originX: obj.originX,
          originY: obj.originY,
          angle: obj.angle,
          opacity: obj.opacity,
          ...(obj.existingSrc ? { src: obj.existingSrc } : {})
        };
      }

      return null;
    }).filter(Boolean);

    if(name.trim() === "") {
      toast.error("Template name is required.");

      return;
    }

    if (elements.length === 0) {
      toast.error("Please add at least one element to save the template.");

      return;
    }

    const template = {
      width: canvas.width,
      height: canvas.height,
      orientation,
      background,
      elements
    };

    // JSON to string
    formData.append("template", JSON.stringify(template));

    formData.append("name", name);

    try {

      const url = mode === "edit"
        ? `${process.env.NEXT_PUBLIC_API_URL}/certificate/templates/${templateId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/certificate/templates`;

      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        body: formData // NOT JSON
      });

      const data = await res.json();

      if (res.ok && data.success) {

        toast.success(mode === "edit" ? "Template updated!" : "Template saved!");

        onSaved?.();
      } else {
        toast.error(data.message || "Failed to save template.");
      }

    } catch (error) {

      console.error("Error saving template:", error);

      toast.error("An error occurred while saving the template.");
    }

  };

  // ================= UI =================
  return (
    <Card sx={{ width: 280 }}>
      <CardContent>

        <TextField
          label="Template Name"
          required
          {...(name.trim() === "" && { error: true, helperText: "Name is required" })}
          onChange={(e) => setName(e.target.value)}
          value={name}
          size="small"
          fullWidth
          className="mb-4"
        />

        <Typography variant="h6">Text</Typography>
        <div className="flex gap-2">
          <Button variant="outlined" size="small" onClick={addStaticText}>
            Add Text
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={prefillTemplate}
          >
            Prefill
          </Button>
        </div>

        <Divider className="my-4" />


        <Typography variant="h6">Text Style</Typography>

        <div className="flex flex-col gap-4 mt-4">
          <TextField
            label="Font Size"
            type="number"
            size="small"
            fullWidth
            value={fontSize}
            onChange={(e) => {
              const val = Number(e.target.value);

              setFontSize(val);
              updateStyle({ fontSize: val });
            }}
          />

          <TextField
            label="Text Color"
            type="color"
            size="small"
            value={color}
            fullWidth
            onChange={(e) => {
              setColor(e.target.value);
              updateStyle({ fill: e.target.value });
            }}
          />

          <div className="flex flex-wrap gap-2">
            <CustomIconButton
              variant="outlined"
              {...textAlign === "left" && { color: "primary"}}
              size="small"
              onClick={() => {
                setTextAlign("left");
                updateStyle({ textAlign: "left" });
              }}
            >
              <i className='tabler-align-left' />
            </CustomIconButton>

            <CustomIconButton
              variant="outlined"
              {...textAlign === "center" && { color: "primary"}}
              size="small"
              onClick={() => {
                setTextAlign("center");
                updateStyle({ textAlign: "center" });
              }}
            >
              <i className='tabler-align-center' />
            </CustomIconButton>

            <CustomIconButton
              variant="outlined"
              {...textAlign === "right" && { color: "primary"}}
              size="small"
              onClick={() => {
                setTextAlign("right");
                updateStyle({ textAlign: "right" });
              }}
            >
              <i className='tabler-align-right' />
            </CustomIconButton>
            <CustomIconButton
              size="small"
              variant="outlined"
              {...fontWeight === "bold" && { color: "primary" }}
              onClick={() => {
                const val = fontWeight === "bold" ? "normal" : "bold";

                setFontWeight(val);
                updateStyle({ fontWeight: val });
              }}
            >
              <i className='tabler-bold' />
            </CustomIconButton>
            <CustomIconButton
              size="small"
              variant="outlined"
              {...fontStyle === "italic" && { color: "primary" }}
              onClick={() => {
                const val = fontStyle === "italic" ? "normal" : "italic";

                setFontStyle(val);
                updateStyle({ fontStyle: val });
              }}
            >
              <i className='tabler-italic' />
            </CustomIconButton>
            <CustomIconButton
              size="small"
              variant="outlined"
              {...underline && { color: "primary" }}
              onClick={() => {
                const val = !underline;

                setUnderline(val);
                updateStyle({ underline: val });
              }}
            >
              <i className='tabler-underline' />
            </CustomIconButton>
          </div>
        </div>

        <Divider className="my-4" />

        <Typography variant="h6">Alignment</Typography>
        <div className="flex flex-wrap gap-2">
          <Button variant="outlined" size="small" onClick={() => align("left")}>L</Button>
          <Button variant="outlined" size="small" onClick={() => align("center")}>C</Button>
          <Button variant="outlined" size="small" onClick={() => align("right")}>R</Button>
          <Button variant="outlined" size="small" onClick={() => align("top")}>T</Button>
          <Button variant="outlined" size="small" onClick={() => align("middle")}>M</Button>
          <Button variant="outlined" size="small" onClick={() => align("bottom")}>B</Button>
        </div>

        <Divider className="my-4" />

        <Typography variant="h6">Dynamic</Typography>
        <div className="flex flex-wrap gap-2 mt-2">
          <Button size="small" variant="outlined" onClick={addAgencyLogo}>
            Agency Logo
          </Button>
          <Button size="small" variant="outlined" onClick={addAgencyStamp}>
            Agency Stamp
          </Button>
          <Button size="small" variant="outlined" onClick={addCertificateContent}>
            Certificate Content
          </Button>
          <Button size="small" variant="outlined" onClick={() => addDynamicText("candidate_name")}>
            Candidate Name
          </Button>
          <Button size="small" variant="outlined" onClick={() => addDynamicText("qualification_pack")}>
            Qualification Pack
          </Button>
          <Button size="small" variant="outlined" onClick={() => addDynamicText("qp_level")}>
            QP Level
          </Button>
          <Button size="small" variant="outlined" onClick={() => addDynamicText("scheme")}>
            Scheme
          </Button>
          <Button size="small" variant="outlined" onClick={() => addDynamicText("institution")}>
            Institution
          </Button>
          <Button size="small" variant="outlined" onClick={() => addDynamicText("assessed_by")}>
            Assessed By
          </Button>
          <Button size="small" variant="outlined" onClick={() => addIssueDate()}>
            Issue Date
          </Button>
          <Button size="small" variant="outlined" onClick={addHeadStamp}>
            Head + Agency Stamp
          </Button>
          <Button size="small" variant="outlined" onClick={addQR}>
            QR Code
          </Button>
          <Button size="small" variant="outlined" onClick={addCertificateNo}>
            Certificate No.
          </Button>
        </div>

        {/* <div className="flex flex-wrap gap-2 mt-2">
          <Button
            variant={fontWeight === "bold" ? "contained" : "outlined"}
            onClick={() => {
              const val = fontWeight === "bold" ? "normal" : "bold";

              setFontWeight(val);
              updateStyle({ fontWeight: val });
            }}
          >
            B
          </Button>

          <Button
            variant={fontStyle === "italic" ? "contained" : "outlined"}
            onClick={() => {
              const val = fontStyle === "italic" ? "normal" : "italic";

              setFontStyle(val);
              updateStyle({ fontStyle: val });
            }}
          >
            I
          </Button>

          <Button
            variant={underline ? "contained" : "outlined"}
            onClick={() => {
              const val = !underline;

              setUnderline(val);
              updateStyle({ underline: val });
            }}
          >
            U
          </Button>
        </div> */}

        <Divider className="my-4" />

        <Typography variant="h6">Upload</Typography>

        <div className="flex flex-wrap gap-2">
          <Button component="label" variant="outlined">
            Background
            <input hidden type="file" accept=".png,.jpeg,.jpg" onChange={setBackground} />
          </Button>

          <Button component="label" variant="outlined">
            Signature
            <input hidden type="file" accept=".png,.jpeg,.jpg" onChange={addSignature} />
          </Button>

          <Button component="label" variant="outlined">
            Add Image
            <input hidden type="file" accept=".png,.jpeg,.jpg" onChange={addImage} />
          </Button>

        </div>

        <Divider className="my-4" />

        <Typography variant="h6">Orientation</Typography>
        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            size="small"
            variant={orientation === "portrait" ? "outlined" : "text"}
            color={orientation === "portrait" ? "primary" : "secondary"}
            onClick={() => applyOrientation("portrait")}
          >
            Portrait
          </Button>
          <Button
            size="small"
            variant={orientation === "landscape" ? "outlined" : "text"}
            color={orientation === "landscape" ? "primary" : "secondary"}
            onClick={() => applyOrientation("landscape")}
          >
            Landscape
          </Button>
        </div>

        <Divider className="my-4" />

        <Typography variant="h6">Actions</Typography>
        <div className="flex flex-col gap-2">
          <Button color="primary" variant="contained" onClick={saveTemplate} disabled={name.trim() === ""}>
            {mode === "edit" ? "Update Template" : "Save Template"}
          </Button>
          <Button color="error" variant="outlined" onClick={deleteSelected}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
