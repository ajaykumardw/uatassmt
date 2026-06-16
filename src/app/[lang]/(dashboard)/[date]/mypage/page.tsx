"use client";

import { useState } from "react";

import { toast } from "react-toastify";

import { CardContent, TextField, Button, Typography, TableContainer, Table, TableRow, TableHead, TableCell, TableBody, LinearProgress, InputAdornment, IconButton } from "@mui/material";

import Card from "@mui/material/Card";

import { passCandidates } from "./action";

const Page = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  // 🔥 Download sample Excel (runtime, no storage)
  const downloadSample = async () => {

    setDownloadLoading(true);

    const { Workbook } = await import("exceljs");

    // const workbook = new ExcelJS.Workbook();
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet("Sample");

    // headers
    sheet.addRow(["batch_name", "candidate_id", "percentage"]);

    // sample rows
    sheet.addRow(["Batch123", "CAND124", ""]);
    sheet.addRow(["Batch125", "CAND126", ""]);
    sheet.addRow(["Batch127", "CAND127", "80"]);

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
    a.download = "bulk-candidate-pass-sample.xlsx";
    a.click();

    window.URL.revokeObjectURL(url);

    setDownloadLoading(false);
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

      const res = await passCandidates(formData);

      // const res = await fetch("/api/students/bulk-update", {
      //   method: "POST",
      //   body: formData
      // });

      // if (!res.ok) {
      //   const errorData = await res.json();

      //   toast.error(errorData.message || "Something went wrong");

      //   return;
      // }

      // const data = await res.json();

      // setResponse(data);

      setResponse(res);
    } catch (error) {
      console.error(error);

      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bulk Candidate Pass</h1>

      <p className="mb-2">
        Upload an Excel file and confirm your password to pass the candidates.
      </p>

      <Card>
        <CardContent className="flex flex-col gap-4">

          <div className="flex items-center gap-4">
            {/* Download Sample */}
            <Button variant="outlined" onClick={downloadSample} size="small" disabled={downloadLoading}>
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

          {/* Batch Stats */}
          {response?.batchStats && response.batchStats.length > 0 && (
            <div className="mb-4">
              <Typography variant="h6" className="mb-2">Batch Pass Percentage</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Batch Name</b></TableCell>
                      <TableCell><b>Total Students</b></TableCell>
                      <TableCell><b>Passed</b></TableCell>
                      <TableCell><b>Avg Pass %</b></TableCell>
                      <TableCell><b>Batch Target %</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {response.batchStats.map((stat: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{stat.batch_name}</TableCell>
                        <TableCell>{stat.total_students}</TableCell>
                        <TableCell>{stat.passed_students}</TableCell>
                        <TableCell
                          style={{
                            color: stat.batch_target_percentage !== null && (stat.average_pass_percentage ?? 0) < stat.batch_target_percentage ? "red" : "green",
                            fontWeight: 500
                          }}
                        >
                          {stat.average_pass_percentage !== null ? `${(n => { const [w, d = ''] = n.toString().split('.');

                            return `${w}.${(d + '00').slice(0, 2)}`; })(stat.average_pass_percentage)}%` : "-"}
                        </TableCell>
                        <TableCell>{stat.batch_target_percentage !== null ? `${stat.batch_target_percentage}%` : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          )}

          {/* Detailed Logs */}
          {response?.logs && response.logs.length > 0 && (
            <div>
              <Typography variant="h6" className="mb-2">Candidate Logs</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Sr. No.</b></TableCell>
                      <TableCell><b>Row No.</b></TableCell>
                      <TableCell><b>Batch Name</b></TableCell>
                      <TableCell><b>Candidate ID</b></TableCell>
                      <TableCell><b>Candidate Name</b></TableCell>
                      <TableCell><b>Target %</b></TableCell>
                      <TableCell><b>Actual %</b></TableCell>
                      <TableCell><b>Old Correct</b></TableCell>
                      <TableCell><b>New Correct</b></TableCell>
                      <TableCell><b>Old Incorrect</b></TableCell>
                      <TableCell><b>New Incorrect</b></TableCell>
                      <TableCell><b>Status</b></TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {response.logs.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.row || "-"}</TableCell>
                        <TableCell>{item.batch_name}</TableCell>
                        <TableCell>{item.candidate_id}</TableCell>
                        <TableCell>{item.candidate_name || "-"}</TableCell>
                        <TableCell>{item.target_percentage != null ? `${item.target_percentage}%` : "Default"}</TableCell>
                        <TableCell>{item.actual_percentage != null ? `${(n => { const [w, d = ''] = n.toString().split('.');

                          return `${w}.${(d + '00').slice(0, 2)}`; })(item.actual_percentage)}%` : "-"}
                        </TableCell>
                        <TableCell>{item.old_correct ?? "-"}</TableCell>
                        <TableCell>{item.new_correct ?? "-"}</TableCell>
                        <TableCell>{item.old_incorrect ?? "-"}</TableCell>
                        <TableCell>{item.new_incorrect ?? "-"}</TableCell>
                        <TableCell
                          style={{
                            color: item.status.includes("Failed") || item.status.includes("Error")
                              ? "red"
                              : item.status === "Success"
                                ? "green"
                                : item.status.includes("Auto-passed")
                                  ? "blue"
                                  : "orange",
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;

// const Page = ({params}: {params: {lang: string, date: string}}) => {

//   const {lang, date} = params;

//   return <div>{`My Page - Lang: ${lang}, Date: ${date}`}</div>;
// }

// export default Page;
