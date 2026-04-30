
"use client";

import { useEffect, useMemo, useState } from "react";

import { styled } from "@mui/material/styles";

import { format } from "date-fns";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Pagination from "@mui/material/Pagination";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import ToolTip from "@mui/material/Tooltip";

import { MenuProps, TableRowLimit } from "@/configs/customDataConfig";
import CustomTextField from "@/@core/components/mui/TextField";
import { useStructure } from "@/views/agency/questions/list-optimized-version/hooks/useStructure";
import CustomIconButton from "@/@core/components/mui/IconButton";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 600
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.primary.lighterOpacity
  },
  "&:last-child td, &:last-child th": {
    border: 0
  }
}));

type RowType = {
  sector: string;
  assessor_id: string;
  assessor_name: string;
  from_date: string;
  to_date: string;
  total_batches_assessed: number;
  total_candidates: number;
  total_candidates_assessed: number;
  total_states: number;
  total_districts: number;
  percentage: number;
};

const Page = () => {
  const { structure } = useStructure();

  const [data, setData] = useState<RowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [generationLoading, setGenerationLoading] = useState(false);

  const [sscId, setSSCId] = useState<number | "">("");

  const [filters, setFilters] = useState({
    fromDate: format(new Date().setDate(new Date().getDate() - 30), "yyyy-MM-dd"),
    toDate: format(new Date(), "yyyy-MM-dd")
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(TableRowLimit.rowLimit[0]);

  /*
  ---------------------------------------
  FETCH API
  ---------------------------------------
  */
  const fetchData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      params.append("fromDate", filters.fromDate);
      params.append("toDate", filters.toDate);

      if (sscId !== "") {
        params.append("sectorId", String(sscId));
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/ssc-wise-result-percentage?${params.toString()}`
      );

      const result = await response.json();

      setData(result?.data || []);
      setPage(0);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  /*
  ---------------------------------------
  INITIAL LOAD
  ---------------------------------------
  */
  useEffect(() => {
    fetchData();
  }, []);

  /*
  ---------------------------------------
  SSC CHANGE
  ---------------------------------------
  */
  const handleSSCChange = (value: string) => {
    if (value === "") {
      setSSCId("");

      return;
    }

    setSSCId(Number(value));
  };

  /*
  ---------------------------------------
  DATE CHANGE
  ---------------------------------------
  */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  /*
  ---------------------------------------
  APPLY FILTER
  ---------------------------------------
  */
  const handleApplyFilter = () => {
    fetchData();
  };

  /*
  ---------------------------------------
  RESET FILTER
  ---------------------------------------
  */
  const handleResetFilter = () => {
    setSSCId("");

    setFilters({
      fromDate: format(new Date().setDate(new Date().getDate() - 30), "yyyy-MM-dd"),
      toDate: format(new Date(), "yyyy-MM-dd")
    });

    setTimeout(() => {
      fetchData();
    }, 0);
  };

  /*
  ---------------------------------------
  PAGINATION
  ---------------------------------------
  */
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;

    return data.slice(
      startIndex,
      startIndex + rowsPerPage
    );
  }, [data, page, rowsPerPage]);

  const total = data.length;
  const pageCount = Math.ceil(total / rowsPerPage) || 1;

  const start = total === 0 ? 0 : page * rowsPerPage + 1;
  const end = Math.min((page + 1) * rowsPerPage, total);

  const handleGenerateExcel = async () => {

    if(data.length === 0) return;

    setGenerationLoading(true);

    try {
      const ExcelJS = (await import("exceljs")).default;

      const workbook = new ExcelJS.Workbook();

      // workbook.creator = "Roshan";

      workbook.created = new Date();

      const fileName = `SSC Wise Result Percentage`;

      const safeFileName = fileName
        .trim()
        .replace(/[\\/:*?"<>|]/g, "");

      const worksheet = workbook.addWorksheet(
        safeFileName || "Report"
      );

      /*
      ---------------------------------------
      HEADERS
      ---------------------------------------
      */
      const headers = [
        "Sr. No.",
        "Sector",
        "From Date",
        "To Date",
        "Total Batches Assessed",
        "Total Candidates",
        "Total Candidates Assessed",
        "Total States",
        "Total Districts",
        "Percentage"
      ];

      worksheet.columns = [
        { header: headers[0], key: "sr_no", width: 10 },
        { header: headers[1], key: "sector", width: 28 },
        { header: headers[4], key: "from_date", width: 16 },
        { header: headers[5], key: "to_date", width: 16 },
        { header: headers[6], key: "total_batches_assessed", width: 22 },
        { header: headers[7], key: "total_candidates", width: 18 },
        { header: headers[8], key: "total_candidates_assessed", width: 24 },
        { header: headers[9], key: "total_states", width: 14 },
        { header: headers[10], key: "total_districts", width: 16 },
        { header: headers[11], key: "percentage", width: 14 }
      ];

      /*
      ---------------------------------------
      HEADER ROW (ROW 1)
      ---------------------------------------
      */
      const headerRow = worksheet.getRow(1);

      headerRow.values = headers;
      headerRow.height = 24;

      headerRow.eachCell((cell) => {
        cell.font = {
          bold: true,
          color: { argb: "FFFFFFFF" }
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "4472C4" }
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true
        };

        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });

      /*
      ---------------------------------------
      DATA ROWS
      ---------------------------------------
      */
      data.forEach((item, index) => {
        const row = worksheet.addRow({
          sr_no: index + 1,
          sector: item.sector,
          from_date: item.from_date,
          to_date: item.to_date,
          total_batches_assessed: item.total_batches_assessed,
          total_candidates: item.total_candidates,
          total_candidates_assessed: item.total_candidates_assessed,
          total_states: item.total_states,
          total_districts: item.total_districts,
          percentage: `${item.percentage}%`
        });

        row.height = 22;

        row.eachCell((cell) => {
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true
          };

          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
          };
        });
      });

      /*
      ---------------------------------------
      ALTERNATE ROW COLOR
      ---------------------------------------
      */
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1 && rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F8F9FA" }
            };
          });
        }
      });

      /*
      ---------------------------------------
      FILTER
      ---------------------------------------
      */
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length }
      };

      /*
      ---------------------------------------
      FREEZE HEADER
      ---------------------------------------
      */
      worksheet.views = [
        {
          state: "frozen",
          ySplit: 1
        }
      ];

      /*
      ---------------------------------------
      DOWNLOAD
      ---------------------------------------
      */
      const buffer =
        await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      const url =
        window.URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href = url;

      a.download = `${safeFileName} (${format(
        new Date(),
        "dd-MM-yyyy"
      )}).xlsx`;

      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {

      console.error("Excel export error:", error);

    } finally {
      setGenerationLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader title="SSC Wise Result" />

      {/* FILTERS */}
      <CardContent>
        <Grid container spacing={2}>
          {/* SSC */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Select SSC</InputLabel>

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

          {/* FROM DATE */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="From Date"
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>

          {/* TO DATE */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="To Date"
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>

          {/* BUTTONS */}
          <Grid item xs={12}>
            <div className="flex gap-3 flex-wrap justify-end">
              <ToolTip title="Search">
                <CustomIconButton
                  variant="contained"
                  color="primary"
                  onClick={handleApplyFilter}
                  size="small"
                >
                  <i className="tabler-search"/>
                </CustomIconButton>
              </ToolTip>
              <ToolTip title="Reset">
                <CustomIconButton
                  variant="outlined"
                  color="secondary"
                  onClick={handleResetFilter}
                  size="small"
                >
                  <i className="tabler-reload"/>
                </CustomIconButton>
              </ToolTip>
            </div>
          </Grid>
        </Grid>
      </CardContent>

      {/* TOP ACTIONS */}
      <div className="flex justify-between flex-col items-start md:flex-row md:items-center pt-6 pl-6 pr-6 border-bs gap-4">
        <CustomTextField
          select
          value={rowsPerPage}
          onChange={(e) =>
            setRowsPerPage(
              Number(e.target.value)
            )
          }
          className="is-[70px]"
          SelectProps={{ MenuProps }}
        >
          {TableRowLimit.rowLimit.map(
            (limit, index) => (
              <MenuItem
                key={index}
                value={limit}
              >
                {limit}
              </MenuItem>
            )
          )}
        </CustomTextField>

        <Button
          color={
            data.length === 0
              ? "error"
              : "primary"
          }
          variant="tonal"
          startIcon={<i className="tabler-upload" />}
          disabled={
            generationLoading ||
            data.length === 0
          }
          onClick={handleGenerateExcel}
        >
          Export
        </Button>
      </div>

      {/* TABLE */}
      <CardContent>
        <TableContainer
          sx={{ maxHeight: 780 }}
          className="mb-6 border"
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <StyledTableCell>
                  SR. No.
                </StyledTableCell>
                <StyledTableCell>
                  Sector
                </StyledTableCell>
                <StyledTableCell sx={{ minWidth: 120 }}>
                  From Date
                </StyledTableCell>
                <StyledTableCell sx={{ minWidth: 120 }}>
                  To Date
                </StyledTableCell>
                <StyledTableCell>
                  Total Batches Assessed
                </StyledTableCell>
                <StyledTableCell>
                  Total Candidates
                </StyledTableCell>
                <StyledTableCell>
                  Total Candidates Assessed
                </StyledTableCell>
                <StyledTableCell>
                  Total States
                </StyledTableCell>
                <StyledTableCell>
                  Total Districts
                </StyledTableCell>
                <StyledTableCell>
                  Percentage
                </StyledTableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    align="center"
                  >
                    <Box py={4}>
                      <CircularProgress />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length >
                0 ? (
                paginatedData.map(
                  (item, index) => (
                    <StyledTableRow
                      key={index}
                    >
                      <StyledTableCell>
                        {page *
                          rowsPerPage +
                          index +
                          1}
                      </StyledTableCell>

                      <StyledTableCell>
                        {item.sector}
                      </StyledTableCell>

                      <StyledTableCell>
                        {
                          item.from_date
                        }
                      </StyledTableCell>

                      <StyledTableCell>
                        {
                          item.to_date
                        }
                      </StyledTableCell>

                      <StyledTableCell>
                        {
                          item.total_batches_assessed
                        }
                      </StyledTableCell>

                      <StyledTableCell>
                        {
                          item.total_candidates
                        }
                      </StyledTableCell>

                      <StyledTableCell>
                        {
                          item.total_candidates_assessed
                        }
                      </StyledTableCell>

                      <StyledTableCell>
                        {item.total_states}
                      </StyledTableCell>

                      <StyledTableCell>
                        {
                          item.total_districts
                        }
                      </StyledTableCell>

                      <StyledTableCell>
                        {item.percentage}%
                      </StyledTableCell>
                    </StyledTableRow>
                  )
                )
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    align="center"
                  >
                    No Data Found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <div className="flex justify-between items-center flex-wrap gap-4 mt-4">
          <Typography color="text.secondary">
            {`Showing ${start} to ${end} of ${total} entries`}
          </Typography>

          <Pagination
            shape="rounded"
            color="primary"
            variant="tonal"
            count={pageCount}
            page={page + 1}
            onChange={(_, value) =>
              setPage(value - 1)
            }
            showFirstButton
            showLastButton
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default Page;
