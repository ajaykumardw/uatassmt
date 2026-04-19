"use client";

import { useState, useEffect } from "react";

// MUI Imports
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Checkbox,
  FormControlLabel,
  Typography,
  Grid
} from "@mui/material";

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
  const [fields, setFields] = useState<Field[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const getReportTypes = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/report-types`
      );

      if (!res.ok) {
        console.log("Failed to fetch report types");
        return;
      }

      const data = await res.json();

      setReportTypes(data.data || []);
    } catch (error) {
      console.log("Error:", error);
    }
  };

  useEffect(() => {
    getReportTypes();
  }, []);

  const handleChange = (id: number) => {
    const report = reportTypes.find((x) => x.id === id);

    if (!report) return;

    setReportId(id);
    setFields(report.fields || []);

    const defaultFields = report.fields
      .filter((item) => item.is_default || item.is_required)
      .map((item) => item.field_code);

    setSelected(defaultFields);
  };

  const handleCheck = (code: string) => {
    if (selected.includes(code)) {
      setSelected(selected.filter((item) => item !== code));
    } else {
      setSelected([...selected, code]);
    }
  };

  return (
    <Card>
      <CardHeader title="Filters" />

      <CardContent>
        <FormControl fullWidth>
          <InputLabel>Select Report</InputLabel>

          <Select
            value={reportId}
            label="Select Report"
            onChange={(e) => handleChange(Number(e.target.value))}
          >
            {reportTypes.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box mt={4}>
          <Typography variant="h6">Fields</Typography>

          <Grid container spacing={2} mt={1}>
            {fields.map((field) => (
              <Grid item xs={12} md={4} key={field.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selected.includes(field.field_code)}
                      disabled={field.is_required}
                      onChange={() => handleCheck(field.field_code)}
                    />
                  }
                  label={field.field_name}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MiscellaneousReport;
