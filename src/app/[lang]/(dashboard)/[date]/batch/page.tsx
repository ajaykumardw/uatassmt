"use client";

import { useMemo, useState } from "react";

import { toast } from "react-toastify";

import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  STUDENT_RESULT,
  STUDENT_RESULT_LABEL,
} from "@/configs/customDataConfig";

import {
  getBatchCandidates,
  recalculateBatchCandidates,
  updateBatchCandidateResults,
} from "./action";
import type { BatchCandidate } from "./action";

type ActionType = "recalculate-selected" | "recalculate-all" | "save-manual";

const getResultColor = (result: number) => {
  if (result === STUDENT_RESULT.PASS) return "success" as const;
  if (result === STUDENT_RESULT.FAIL) return "error" as const;

  return "warning" as const;
};

const formatPercentage = (percentage: number) => {
  return `${percentage % 1 ? percentage.toFixed(2) : percentage}%`;
};

const Page = () => {
  const [batchName, setBatchName] = useState("");

  const [batch, setBatch] = useState<{ id: number; batch_name: string } | null>(
    null
  );

  const [rows, setRows] = useState<BatchCandidate[]>([]);

  const [manualResults, setManualResults] = useState<Record<number, number>>(
    {}
  );

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [searching, setSearching] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [confirmAction, setConfirmAction] = useState<ActionType | null>(null);

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const pendingChanges = useMemo(
    () =>
      rows
        .map((row) => ({
          studentId: row.id,
          result: manualResults[row.id] ?? row.result,
          storedResult: row.result,
          candidate_id: row.candidate_id,
          candidate_name: row.candidate_name,
        }))
        .filter((change) => change.result !== change.storedResult),
    [rows, manualResults]
  );

  const allSelected =
    rows.length > 0 && selectedIds.length === rows.length;

  const someSelected =
    selectedIds.length > 0 && selectedIds.length < rows.length;

  const loadBatch = async (
    name: string,
    options?: { showSuccess?: boolean }
  ) => {
    try {
      setSearching(true);
      setError(null);

      const response = await getBatchCandidates(name);

      if (!response.ok) {
        setBatch(null);
        setRows([]);
        setSelectedIds([]);
        setManualResults({});
        setError(response.error);
        toast.error(response.error);

        return;
      }

      setBatch(response.batch);
      setRows(response.candidates);
      setSelectedIds([]);
      setManualResults({});

      if (options?.showSuccess) {
        toast.success("Batch results refreshed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!batchName.trim()) {
      toast.error("Please enter batch name");

      return;
    }

    await loadBatch(batchName);
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);

      return;
    }

    setSelectedIds(rows.map((row) => row.id));
  };

  const handleToggleOne = (studentId: number) => {
    setSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  };

  const handleResultChange = (studentId: number, result: number) => {
    setManualResults((current) => ({
      ...current,
      [studentId]: result,
    }));
  };

  const openConfirmDialog = (action: ActionType) => {
    if (action === "recalculate-selected" && selectedIds.length === 0) {
      toast.error("Please select at least one candidate");

      return;
    }

    if (action === "save-manual" && pendingChanges.length === 0) {
      toast.error("No manual result changes found");

      return;
    }

    setPassword("");
    setShowPassword(false);
    setConfirmAction(action);
  };

  const closeConfirmDialog = () => {
    setConfirmAction(null);
    setPassword("");
    setShowPassword(false);
  };

  const handleConfirmAction = async () => {
    if (!batch || !confirmAction) return;

    if (!password) {
      toast.error("Please enter your password");

      return;
    }

    try {
      setSubmitting(true);

      let response;

      if (confirmAction === "save-manual") {
        response = await updateBatchCandidateResults({
          batchId: batch.id,
          changes: pendingChanges.map((change) => ({
            studentId: change.studentId,
            result: change.result,
          })),
          password,
        });
      } else {
        const studentIds =
          confirmAction === "recalculate-all"
            ? rows.map((row) => row.id)
            : selectedIds;

        response = await recalculateBatchCandidates({
          batchId: batch.id,
          studentIds,
          password,
        });
      }

      if (!response.ok) {
        toast.error(response.error);

        return;
      }

      toast.success(
        [
          `${response.updated} candidate(s) updated`,
          `${response.passed} PASS`,
          `${response.failed} FAIL`,
          response.pending ? `${response.pending} PENDING` : null,
        ]
          .filter(Boolean)
          .join(" • ")
      );

      closeConfirmDialog();

      await loadBatch(batch.batch_name);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const dialogTitle =
    confirmAction === "save-manual"
      ? "Save Manual Results"
      : confirmAction === "recalculate-all"
        ? "Recalculate All Candidates"
        : "Recalculate Selected Candidates";

  const dialogDescription =
    confirmAction === "save-manual"
      ? `${pendingChanges.length} manual result change(s) will be saved directly to the candidate records.`
      : confirmAction === "recalculate-all"
        ? `Results for all ${rows.length} candidate(s) in this batch will be recalculated from current marks.`
        : `Results for ${selectedIds.length} selected candidate(s) will be recalculated from current marks.`;

  return (
    <div className="p-4">
      <div className="mb-4">
        <Typography variant="h4" className="font-bold">
          Batch Result Manager
        </Typography>

        <Typography color="text.secondary" className="mt-1">
          Search a batch, review candidate percentages, update results manually,
          or recalculate results for selected/all candidates.
        </Typography>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            <TextField
              label="Batch Name"
              size="small"
              value={batchName}
              onChange={(event) => setBatchName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearch();
              }}
              fullWidth
            />

            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={searching}
              className="md:min-w-[140px]"
            >
              {searching ? "Searching..." : "Search Batch"}
            </Button>
          </div>

          {error && <Alert severity="error">{error}</Alert>}
        </CardContent>
      </Card>

      {batch && (
        <Card className="mt-4">
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <Typography variant="h6" className="font-semibold">
                  {batch.batch_name}
                </Typography>

                <Typography color="text.secondary" variant="body2">
                  {rows.length} candidate(s)
                </Typography>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => openConfirmDialog("recalculate-selected")}
                  disabled={submitting || selectedIds.length === 0}
                >
                  Recalculate Selected ({selectedIds.length})
                </Button>

                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => openConfirmDialog("recalculate-all")}
                  disabled={submitting || rows.length === 0}
                >
                  Recalculate All
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  onClick={() => openConfirmDialog("save-manual")}
                  disabled={submitting || pendingChanges.length === 0}
                >
                  Save Manual Changes ({pendingChanges.length})
                </Button>
              </div>
            </div>

            <Alert severity="warning">
              Recalculation overwrites the saved result. A candidate who is
              currently PASS but calculates as FAIL will be marked FAIL. Newly
              PASS candidates may get a certificate, while FAIL/PENDING
              candidates will have their certificate cleared. This action cannot
              be undone.
            </Alert>

            <TableContainer className="border rounded">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={handleToggleAll}
                        inputProps={{
                          "aria-label": "Select all candidates",
                        }}
                      />
                    </TableCell>
                    <TableCell>Sr No.</TableCell>
                    <TableCell>Candidate ID</TableCell>
                    <TableCell>Candidate Name</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Percentage</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((row, index) => {
                    const currentResult = manualResults[row.id] ?? row.result;
                    const isChanged = currentResult !== row.result;

                    const calculatedDiffers =
                      row.calculatedResult !== row.result;

                    return (
                      <TableRow key={row.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.includes(row.id)}
                            onChange={() => handleToggleOne(row.id)}
                            inputProps={{
                              "aria-label": `Select ${row.candidate_id}`,
                            }}
                          />
                        </TableCell>

                        <TableCell>{index + 1}</TableCell>

                        <TableCell className="font-medium">
                          {row.candidate_id}
                        </TableCell>

                        <TableCell>{row.candidate_name}</TableCell>

                        <TableCell>
                          <div className="flex min-w-[170px] flex-col gap-1">
                            <Select
                              size="small"
                              value={currentResult}
                              onChange={(event) =>
                                handleResultChange(
                                  row.id,
                                  Number(event.target.value)
                                )
                              }
                              renderValue={(value) => (
                                <Chip
                                  size="small"
                                  label={
                                    STUDENT_RESULT_LABEL[Number(value)] ??
                                    "PENDING"
                                  }
                                  color={getResultColor(Number(value))}
                                />
                              )}
                            >
                              <MenuItem value={STUDENT_RESULT.PENDING}>
                                Pending
                              </MenuItem>
                              <MenuItem value={STUDENT_RESULT.PASS}>
                                Pass
                              </MenuItem>
                              <MenuItem value={STUDENT_RESULT.FAIL}>
                                Fail
                              </MenuItem>
                            </Select>

                            {isChanged && (
                              <Typography
                                variant="caption"
                                color="warning.main"
                              >
                                Unsaved manual change
                              </Typography>
                            )}

                            {calculatedDiffers && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Calculated:{" "}
                                {STUDENT_RESULT_LABEL[row.calculatedResult]}
                              </Typography>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>{formatPercentage(row.percentage)}</TableCell>
                      </TableRow>
                    );
                  })}

                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No candidates found in this batch.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={Boolean(confirmAction)}
        onClose={submitting ? undefined : closeConfirmDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{dialogTitle}</DialogTitle>

        <DialogContent>
          <Alert severity="warning" className="mb-4">
            This will update the candidate table result directly. Existing PASS
            candidates can become FAIL after recalculation. Certificates will be
            synced with the new result. This action cannot be undone.
          </Alert>

          <Typography variant="body2" className="mb-3">
            {dialogDescription}
          </Typography>

          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Enter your password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !submitting) {
                handleConfirmAction();
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((current) => !current)}
                    edge="end"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <i className="tabler-eye" />
                    ) : (
                      <i className="tabler-eye-off" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={closeConfirmDialog}
            disabled={submitting}
            color="secondary"
          >
            Cancel
          </Button>

          <Button
            onClick={handleConfirmAction}
            disabled={submitting}
            variant="contained"
            color={confirmAction === "save-manual" ? "success" : "warning"}
          >
            {submitting ? "Updating..." : "Confirm & Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Page;
