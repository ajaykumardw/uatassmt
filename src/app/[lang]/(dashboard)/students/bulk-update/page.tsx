"use client";

import { useState } from "react";

import { toast } from "react-toastify";

import { CardContent, TextField, Button, Typography, TableContainer, Table, TableRow, TableHead, TableCell, TableBody, LinearProgress, InputAdornment, IconButton } from "@mui/material";
import Card from "@mui/material/Card";

const Page = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  // 🔥 Download sample Excel (runtime, no storage)
  const downloadSample = async () => {

    const { Workbook } = await import("exceljs");

    // const workbook = new ExcelJS.Workbook();
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet("Sample");

    // headers
    sheet.addRow(["candidate_id", "new_candidate_id"]);

    // sample rows
    sheet.addRow(["CAND123", "CAND124"]);
    sheet.addRow(["CAND125", "CAND126"]);

    // style header
    sheet.getRow(1).font = { bold: true };

    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 20;

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "bulk-candidate-id-update-sample.xlsx";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  // 🔥 Submit handler
  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select Excel file");

      return;
    }

    if (!password) {
      toast.error("Please enter password");

      return;
    }

    try {
      setLoading(true);
      setResponse(null);

      const formData = new FormData();

      formData.append("file", file);
      formData.append("password", password);

      const res = await fetch("/api/students/bulk-update", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();

        toast.error(errorData.message || "Something went wrong");

        return;
      }

      const data = await res.json();

      setResponse(data);
    } catch (error) {
      console.error(error);

      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bulk Update Candidate ID</h1>

      <p className="mb-2">
        Upload an Excel file and confirm your password to update candidate IDs.
      </p>

      <Card>
        <CardContent className="flex flex-col gap-4">

          <div className="flex items-center gap-4">
            {/* Download Sample */}
            <Button variant="outlined" onClick={downloadSample} size="small">
              Download Sample Excel
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <Typography variant="subtitle2">
              Upload Excel (.xlsx)
            </Typography>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
            />
          </div>

          {/* Password */}
          <TextField
            label="Enter your password"
            size="small"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <i className="tabler-eye" /> : <i className="tabler-eye-off" />}
                  </IconButton>
                </InputAdornment>
              )
             }}
            fullWidth
          />

          <div className="flex items-center gap-4">
            {/* Submit */}
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Processing..." : "Submit"}
            </Button>
          </div>

          {loading && (
            <LinearProgress className="w-full" />
          )}

          {/* Response */}
          {response?.logs && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><b>Sr. No.</b></TableCell>
                    <TableCell><b>Row No.</b></TableCell>
                    <TableCell><b>Old Candidate ID</b></TableCell>
                    <TableCell><b>New Candidate ID</b></TableCell>
                    <TableCell><b>Status</b></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {response.logs.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.row}</TableCell>
                      <TableCell>{item.old_id}</TableCell>
                      <TableCell>{item.new_id}</TableCell>
                      <TableCell
                        style={{
                          color: item.status.includes("Failed")
                            ? "red"
                            : "green",
                          fontWeight: 500
                        }}
                      >
                        {item.status}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
