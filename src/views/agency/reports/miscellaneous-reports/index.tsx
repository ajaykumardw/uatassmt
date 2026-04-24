"use client";

import { useState, useEffect, useMemo } from "react";

import { toast } from "react-toastify";

// MUI Imports
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";

import { useStructure } from "../../questions/list-optimized-version/hooks/useStructure";

import { MenuProps } from "@/configs/customDataConfig";

import type { QPType } from "@/types/qualification-pack/qpType";

type Field = {
  id: number;
  field_name: string;
  field_code: string;
  is_default: boolean;
  is_required: boolean;
};

type ReportType = {
  id: number;
  name: string;
  code: string;
  fields: Field[];
};

const MiscellaneousReport = () => {
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [reportId, setReportId] = useState<number | "">("");
  const [sscId, setSSCId] = useState<number | "">("");
  const [qpId, setQP] = useState<number | "">("");
  const [qpData, setQPData] = useState<QPType[]>([]);
  const [fileName, setFileName] = useState("");

  const { structure } = useStructure();

  /*
  ---------------------------------------
  ALL FIELDS
  ---------------------------------------
  */
  const [fields, setFields] = useState<Field[]>([]);

  /*
  ---------------------------------------
  SELECTED FIELDS
  ---------------------------------------
  */
  const [selected, setSelected] = useState<string[]>([]);

  /*
  ---------------------------------------
  FIELD ORDER
  ---------------------------------------
  */
  const [orderedFields, setOrderedFields] = useState<string[]>([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(false);

  /*
  ---------------------------------------
  LOAD REPORT TYPES
  ---------------------------------------
  */
  const getReportTypes = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/report-types`
      );

      const data = await res.json();

      const reports = data.data || [];

      setReportTypes(reports);

      const map = new Map();

      reports.forEach((report: ReportType) => {
        report.fields.forEach((field) => {
          if (!map.has(field.field_code)) {
            map.set(field.field_code, field);
          }
        });
      });

      const allFields = Array.from(map.values()) as Field[];

      setFields(allFields);

      /*
      default order all fields
      */
      setOrderedFields(
        allFields.map((x) => x.field_code)
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getReportTypes();
  }, []);

  /*
  ---------------------------------------
  REPORT CHANGE
  ---------------------------------------
  */
  const handleChange = (id: number) => {
    const report = reportTypes.find(
      (x) => x.id === id
    );

    if (!report) return;

    setReportId(id);

    const defaults = report.fields
      .filter(
        (x) =>
          x.is_default ||
          x.is_required
      )
      .map((x) => x.field_code);

    setSelected(defaults);

    // default filename from selected report
    setFileName(report.name);
  };

  /*
  ---------------------------------------
  CHECKBOX
  ---------------------------------------
  */
  const handleCheck = (code: string) => {
    const field = fields.find(
      (x) => x.field_code === code
    );

    if (field?.is_required) return;

    if (selected.includes(code)) {
      setSelected(
        selected.filter(
          (x) => x !== code
        )
      );
    } else {
      setSelected([
        ...selected,
        code
      ]);
    }
  };

  /*
  ---------------------------------------
  GENERATE EXCEL
  ---------------------------------------
  */
  // const generateExcel = async () => {
  //   try {
  //     setLoading(true);

  //     /*
  //     selected fields in custom order
  //     */
  //     const finalFields =
  //       orderedFields.filter((x) =>
  //         selected.includes(x)
  //       );

  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL}/miscellaneous-report`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type":
  //             "application/json"
  //         },
  //         body: JSON.stringify({
  //           report_type_id: reportId,
  //           fields: finalFields,
  //           from_date: fromDate,
  //           to_date: toDate
  //         })
  //       }
  //     );

  //     const json = await res.json();

  //     const rows = json.data || [];

  //     if (!rows.length) {
  //       alert("No data found");
  //       return;
  //     }

  //     const finalRows = rows.map(
  //       (
  //         row: Record<
  //           string,
  //           any
  //         >,
  //         index: number
  //       ) => ({
  //         "Sr. No.":
  //           index + 1,
  //         ...row
  //       })
  //     );

  //     const worksheet =
  //       XLSX.utils.json_to_sheet(
  //         finalRows
  //       );

  //     const workbook =
  //       XLSX.utils.book_new();

  //     XLSX.utils.book_append_sheet(
  //       workbook,
  //       worksheet,
  //       "Report"
  //     );

  //     XLSX.writeFile(
  //       workbook,
  //       "miscellaneous-report.xlsx"
  //     );
  //   } catch (error) {
  //     console.log(error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const generateExcel = async () => {
    try {
      setLoading(true);

      /*
      ---------------------------------------
      Selected fields in custom order
      ---------------------------------------
      */
      const finalFields = orderedFields.filter((x) =>
        selected.includes(x)
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/miscellaneous-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            report_type_id: reportId,
            fields: finalFields,
            ssc_id: sscId || null,
            qp_id: qpId || null,
            from_date: fromDate,
            to_date: toDate
          })
        }
      );

      const json = await res.json();

      const rows = json.data || [];

      if (!rows.length) {

        toast.error("No data found for the selected criteria", {
          hideProgressBar: false
        });

        // alert("No data found");
        return;
      }

      /*
      ---------------------------------------
      Dynamic import ExcelJS
      ---------------------------------------
      */
      const ExcelJS = (await import("exceljs")).default;

      const workbook = new ExcelJS.Workbook();


      const safeFileName = fileName
        .trim()
        .replace(/[\\/:*?"<>|]/g, "");

      // workbook.creator = "ChatGPT";

      workbook.created = new Date();

      const worksheet =
        workbook.addWorksheet(safeFileName || "Report");

      /*
      ---------------------------------------
      Prepare columns
      ---------------------------------------
      */
      const headers = [
        "Sr. No.",
        ...Object.keys(rows[0])
      ];

      worksheet.columns = headers.map(
        (header) => ({
          header,
          key: header,
          width: 25
        })
      );

      /*
      ---------------------------------------
      Title Row
      ---------------------------------------
      */
      worksheet.insertRow(1, [
        safeFileName || "Miscellaneous Report"
      ]);

      worksheet.mergeCells(
        1,
        1,
        1,
        headers.length
      );

      const titleCell =
        worksheet.getCell("A1");

      titleCell.font = {
        bold: true,
        size: 16
      };

      titleCell.alignment = {
        horizontal: "center",
        vertical: "middle"
      };

      worksheet.getRow(1).height = 28;

      /*
      ---------------------------------------
      Header Row
      ---------------------------------------
      */
      const headerRow =
        worksheet.getRow(2);

      headerRow.values = headers;

      headerRow.height = 22;

      headerRow.eachCell((cell) => {
        cell.font = {
          bold: true,
          color: {
            argb: "FFFFFFFF"
          }
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "4472C4"
          }
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true
        };

        cell.border = {
          top: {
            style: "thin"
          },
          left: {
            style: "thin"
          },
          bottom: {
            style: "thin"
          },
          right: {
            style: "thin"
          }
        };
      });

      /*
      ---------------------------------------
      Data Rows
      ---------------------------------------
      */
      rows.forEach(
        (
          row: Record<string, any>,
          index: number
        ) => {
          const rowData: Record<
            string,
            any
          > = {
            "Sr. No.":
              index + 1
          };

          Object.keys(row).forEach(
            (key) => {
              rowData[key] =
                row[key] ?? "";
            }
          );

          const insertedRow =
            worksheet.addRow(
              rowData
            );

          insertedRow.eachCell(
            (cell) => {
              cell.alignment = {
                horizontal:
                  "center",
                vertical:
                  "middle",
                wrapText: true
              };

              cell.border = {
                top: {
                  style:
                    "thin"
                },
                left: {
                  style:
                    "thin"
                },
                bottom: {
                  style:
                    "thin"
                },
                right: {
                  style:
                    "thin"
                }
              };
            }
          );
        }
      );

      /*
      ---------------------------------------
      Auto Filter
      ---------------------------------------
      */
      worksheet.autoFilter = {
        from: {
          row: 2,
          column: 1
        },
        to: {
          row: 2,
          column:
            headers.length
        }
      };

      /*
      ---------------------------------------
      Freeze Header
      ---------------------------------------
      */
      worksheet.views = [
        {
          state: "frozen",
          ySplit: 2
        }
      ];

      /*
      ---------------------------------------
      Alternate Row Color
      ---------------------------------------
      */
      worksheet.eachRow(
        (row, rowNumber) => {
          if (
            rowNumber > 2 &&
            rowNumber % 2 === 0
          ) {
            row.eachCell(
              (cell) => {
                cell.fill = {
                  type:
                    "pattern",
                  pattern:
                    "solid",
                  fgColor: {
                    argb:
                      "F8F9FA"
                  }
                };
              }
            );
          }
        }
      );

      /*
      ---------------------------------------
      Download
      ---------------------------------------
      */
      const buffer =
        await workbook.xlsx.writeBuffer();

      const blob = new Blob(
        [buffer],
        {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
      );

      const url =
        window.URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          "a"
        );

      a.href = url;

      // a.download =
      //   "miscellaneous-report.xlsx";

      a.download = `${safeFileName || "report"}.xlsx`;

      a.click();

      window.URL.revokeObjectURL(
        url
      );
    } catch (error) {

      toast.error("An error occurred while generating the report", {
        hideProgressBar: false
      });

      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  /*
  ---------------------------------------
  GET FIELD OBJECT
  ---------------------------------------
  */
  const getField = (
    code: string
  ) =>
    fields.find(
      (x) => x.field_code === code
    );

  const handleOrderChange = (
    code: string,
    newPosition: number
  ) => {
    if (
      !newPosition ||
      newPosition < 1
    )
      return;

    if (
      newPosition >
      orderedFields.length
    ) {
      newPosition =
        orderedFields.length;
    }

    const currentIndex =
      orderedFields.indexOf(code);

    if (currentIndex === -1)
      return;

    const arr = [
      ...orderedFields
    ];

    // remove current
    arr.splice(currentIndex, 1);

    // insert new
    arr.splice(
      newPosition - 1,
      0,
      code
    );

    setOrderedFields(arr);
  };

  // ---------------------------------------
  // SSC CHANGE
  // ---------------------------------------
  const handleSSCChange = (value: string) => {
    /*
    ALL SSC
    */
    if (value === "") {
      setSSCId("");
      setQP("");
      setQPData([]);

      return;
    }

    const selectedSSCId = Number(value);

    setSSCId(selectedSSCId);
    setQP("");

    const selectedSSC = structure.find(
      (item) => item.id === selectedSSCId
    );

    if (selectedSSC) {
      setQPData(
        selectedSSC.qualification_packs || []
      );
    } else {
      setQPData([]);
    }
  };

  // ---------------------------------------
  // QP CHANGE
  // ---------------------------------------
  const handleQPChange = (value: string) => {
    /*
    ALL QP
    */
    if (value === "") {
      setQP("");

      return;
    }

    setQP(Number(value));
  };

  //
  // SELECTED SET (FAST LOOKUP)
  //
  // const selectedSet = useMemo(
  //   () => new Set(selected),
  //   [selected]
  // );
  useMemo(
    () => new Set(selected),
    [selected]
  );

  //
  // REQUIRED FIELDS
  //
  const requiredFields = useMemo(
    () =>
      fields
        .filter(
          (x) => x.is_required
        )
        .map(
          (x) => x.field_code
        ),
    [fields]
  );

  //
  // ALL FIELD CODES
  //
  const allFieldCodes = useMemo(
    () =>
      fields.map(
        (x) => x.field_code
      ),
    [fields]
  );

  //
  // CHECKBOX STATES
  //
  const allSelected =
    fields.length > 0 &&
    selected.length ===
      fields.length;

  const someSelected =
    selected.length > 0 &&
    selected.length <
      fields.length;

  //
  // SELECT ALL
  //
  const handleSelectAll = (
    checked: boolean
  ) => {
    if (checked) {
      setSelected(allFieldCodes);
    } else {
      setSelected(requiredFields);
    }
  };

  //
  // RESET DEFAULTS
  //
  const handleResetSelection = () => {

    const report = reportTypes.find(
      (x) => x.id === Number(reportId)
    );

    if (!report) return;

    const defaults = report.fields
      .filter(
        (x) =>
          x.is_default ||
          x.is_required
      )
      .map((x) => x.field_code);

    console.log("Current:", selected);
    console.log("Reset:", defaults);

    setSelected(defaults);
  };

  return (
    <Card>
      <CardHeader title="Miscellaneous Reports" />

      <CardContent>
        <Grid container spacing={3}>
          {/* REPORT */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>
                Select Report *
              </InputLabel>

              <Select
                value={reportId}
                label="Select Report"
                MenuProps={MenuProps}
                onChange={(e) =>
                  handleChange(
                    Number(
                      e.target.value
                    )
                  )
                }
              >
                {reportTypes.map(
                  (item) => (
                    <MenuItem
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Grid>
          {/* SSC */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>
                Select SSC
              </InputLabel>

              <Select
                value={sscId}
                label="Select SSC"
                MenuProps={MenuProps}
                onChange={(e) =>
                  handleSSCChange(
                    e.target.value.toString()
                  )
                }
              >
                <MenuItem value="">
                  All SSC
                </MenuItem>

                {structure.map((item) => (
                  <MenuItem
                    key={item.id}
                    value={item.id}
                  >
                    {item.ssc_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* QP */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>
                Select QP
              </InputLabel>

              <Select
                value={qpId}
                label="Select QP"
                MenuProps={MenuProps}
                onChange={(e) =>
                  handleQPChange(
                    e.target.value.toString()
                  )
                }
                disabled={!sscId}
              >
                <MenuItem value="">
                  All QP
                </MenuItem>

                {qpData.map((item) => (
                  <MenuItem
                    key={item.id}
                    value={item.id}
                  >
                    {
                      item.qualification_pack_name
                    }
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* FROM */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="From Date"
              type="date"
              InputLabelProps={{
                shrink: true
              }}
              value={fromDate}
              onChange={(e) =>
                setFromDate(
                  e.target.value
                )
              }
            />
          </Grid>

          {/* TO */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="To Date"
              type="date"
              InputLabelProps={{
                shrink: true
              }}
              value={toDate}
              onChange={(e) =>
                setToDate(
                  e.target.value
                )
              }
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="File Name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </Grid>
        </Grid>

        <Box mt={4}>
          <div className="flex items-center gap-2 justify-between flex-wrap">
            <Typography variant="h6" mb={2}>
              Select Fields & Order
            </Typography>
            <Box
              mb={2}
              display="flex"
              justifyContent="flex-end"
              alignItems="center"
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      allSelected
                    }
                    indeterminate={
                      someSelected
                    }
                    onChange={(e) =>
                      handleSelectAll(
                        e.target.checked
                      )
                    }
                  />
                }
                label={`Select All (${selected.length}/${fields.length})`}
              />

              <Button
                type="button"
                size="small"
                variant="outlined"
                onClick={handleResetSelection}
                disabled={!reportId}
              >
                Reset
              </Button>
            </Box>
          </div>

          <Box
            sx={{
              maxHeight: 500, // custom height
              overflowY: "auto",
              overflowX: "hidden"
            }}
          >
            <Grid container spacing={1.5}>
              {orderedFields.map((code, index) => {
                const field = getField(code);

                if (!field) return null;

                const checked =
                  selected.includes(code);

                return (
                  <Grid
                    item
                    xs={12}
                    md={6}
                    lg={3}
                    key={code}
                  >
                    <Box
                      sx={{
                        border: checked
                          ? "1px solid"
                          : "1px solid",
                        borderColor: checked ? 'primary.main' : 'var(--border-color)',
                        borderRadius: 2,
                        px: 1.5,
                        py: 1,

                        // backgroundColor: checked
                        //   ? "rgba(105,108,255,0.04)"
                        //   : "#fff",

                        backgroundColor: checked
                          ? 'primary.lighterOpacity'
                          : "",
                        transition:
                          "all 0.2s ease",
                        "&:hover": {
                          boxShadow: 1
                        }
                      }}
                    >
                      <Grid
                        container
                        spacing={1}
                        alignItems="center"
                      >
                        {/* Checkbox + Name */}
                        <Grid
                          item
                          xs={9}
                        >
                          <FormControlLabel
                            sx={{
                              m: 0,
                              width: "100%"
                            }}
                            control={
                              <Checkbox
                                size="small"
                                checked={
                                  checked
                                }
                                disabled={
                                  field.is_required
                                }
                                onChange={() =>
                                  handleCheck(
                                    code
                                  )
                                }
                              />
                            }
                            label={
                              <Typography
                                fontSize={
                                  13
                                }
                                fontWeight={
                                  500
                                }
                                noWrap
                              >
                                {
                                  field.field_name
                                }
                              </Typography>
                            }
                          />
                        </Grid>

                        {/* Order */}
                        <Grid
                          item
                          xs={3}
                        >
                          <TextField
                            size="small"
                            type="number"
                            label="No."
                            value={
                              index + 1
                            }
                            onChange={(
                              e
                            ) =>
                              handleOrderChange(
                                code,
                                Number(
                                  e.target
                                    .value
                                )
                              )
                            }
                            fullWidth
                            inputProps={{
                              min: 1,
                              max:
                                orderedFields.length
                            }}
                          />
                        </Grid>
                      </Grid>

                      {field.is_required && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{
                            ml: 4,
                            mt: 0.5,
                            display:
                              "block"
                          }}
                        >
                          Required
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Box>

        {/* FIELDS */}
        {/* <Box mt={4}>
          <Typography variant="h6">
            Select Fields & Order
          </Typography>

          <Grid
            container
            spacing={2}
            mt={1}
          >
            {orderedFields.map(
              (code) => {
                const field =
                  getField(code);

                if (!field)
                  return null;

                return (
                  <Grid
                    item
                    xs={12}
                    md={4}
                    key={code}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        border:
                          "1px solid #eee",
                        borderRadius:
                          "8px",
                        px: 2,
                        py: 1
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selected.includes(
                              code
                            )}
                            disabled={
                              field.is_required
                            }
                            onChange={() =>
                              handleCheck(
                                code
                              )
                            }
                          />
                        }
                        label={
                          field.field_name
                        }
                      />

                      <Box>
                        <IconButton
                          size="small"
                          onClick={() =>
                            moveUp(
                              code
                            )
                          }
                        >
                          Up
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={() =>
                            moveDown(
                              code
                            )
                          }
                        >
                          Down
                        </IconButton>
                      </Box>
                    </Stack>
                  </Grid>
                );
              }
            )}
          </Grid>
        </Box> */}

        {/* BUTTON */}
        <Box mt={4}>
          <Button
            variant="contained"
            disabled={
              loading ||
              !reportId ||
              !selected.length
            }
            onClick={
              generateExcel
            }
          >
            {loading
              ? "Generating..."
              : "Generate Excel"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MiscellaneousReport;
