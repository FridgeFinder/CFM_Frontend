'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { getFirebaseFirestore } from 'config/firebase';
import { foodLevelConfig } from 'config/foodLevel';
import { useAuthStore } from 'store/useAuthStore';
import { designColor } from 'theme/palette';
import type { FlaggedFridgeReportStatus, FridgeReport } from 'types/domain';

const FLAGGED_REPORTS_COLLECTION = 'FlaggedFridgeReports';

type FlagReason = 'harmful' | 'inaccurate';
type EditableFlaggedFridgeReportStatus = Exclude<
  FlaggedFridgeReportStatus,
  'deleted'
>;

interface FlaggedReportRow {
  id: string;
  fridgeId: string;
  reportTimestamp: string;
  reason: FlagReason;
  status: FlaggedFridgeReportStatus;
  report: FridgeReport | null;
  createdAt: Timestamp;
  reportDeletedAt: Timestamp | null;
}

const FLAGGED_REPORT_STATUS_LABELS: Record<FlaggedFridgeReportStatus, string> =
  {
    none: 'None',
    deleted: 'Deleted',
    not_inappropriate: 'Not Inappropriate',
    not_harmful: 'Not Harmful',
  };

const EDITABLE_FLAGGED_REPORT_STATUSES: EditableFlaggedFridgeReportStatus[] = [
  'none',
  'not_inappropriate',
  'not_harmful',
];

function isFlagReason(value: unknown): value is FlagReason {
  return value === 'harmful' || value === 'inaccurate';
}

function isFlaggedFridgeReportStatus(
  value: unknown
): value is FlaggedFridgeReportStatus {
  return (
    value === 'none' ||
    value === 'deleted' ||
    value === 'not_inappropriate' ||
    value === 'not_harmful'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFridgeReport(value: unknown): value is FridgeReport {
  return (
    isRecord(value) &&
    typeof value.fridgeId === 'string' &&
    typeof value.timestamp === 'string' &&
    typeof value.condition === 'string' &&
    typeof value.foodPercentage === 'number' &&
    Number.isFinite(value.foodPercentage) &&
    Number.isInteger(value.foodPercentage) &&
    value.foodPercentage >= 0 &&
    value.foodPercentage <= 3 &&
    (value.epochTimestamp === undefined ||
      typeof value.epochTimestamp === 'string') &&
    (value.photoUrl === undefined || typeof value.photoUrl === 'string') &&
    (value.notes === undefined || typeof value.notes === 'string')
  );
}

function getSafePhotoHref(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function formatReportTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        timeZone: 'UTC',
        timeZoneName: 'short',
      });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export default function FlaggedReportsPage(): React.ReactElement {
  const db = useMemo(() => getFirebaseFirestore(), []);
  const user = useAuthStore((state) => state.user);
  const [rows, setRows] = useState<FlaggedReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [reportToDelete, setReportToDelete] = useState<FlaggedReportRow | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');
  const [statusUpdateErrorMessage, setStatusUpdateErrorMessage] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [reportToDeleteFromApi, setReportToDeleteFromApi] =
    useState<FlaggedReportRow | null>(null);
  const [isDeletingFridgeReport, setIsDeletingFridgeReport] = useState(false);
  const [fridgeReportDeleteErrorMessage, setFridgeReportDeleteErrorMessage] =
    useState('');
  const [deletedReportIds, setDeletedReportIds] = useState<Set<string>>(
    () => new Set()
  );
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const flaggedReportsQuery = query(
      collection(db, FLAGGED_REPORTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      flaggedReportsQuery,
      (snapshot) => {
        try {
          const reportRows = snapshot.docs.map((reportDoc) => {
            const data = reportDoc.data();
            const reportDeletedAt =
              data.reportDeletedAt instanceof Timestamp
                ? data.reportDeletedAt
                : null;
            const status =
              data.status === undefined
                ? reportDeletedAt
                  ? 'deleted'
                  : 'none'
                : data.status;
            if (
              typeof data.fridgeId !== 'string' ||
              typeof data.reportTimestamp !== 'string' ||
              !isFlagReason(data.reason) ||
              !isFlaggedFridgeReportStatus(status) ||
              !(data.createdAt instanceof Timestamp) ||
              (data.reportDeletedAt !== undefined &&
                data.reportDeletedAt !== null &&
                !(data.reportDeletedAt instanceof Timestamp)) ||
              (reportDeletedAt !== null && status !== 'deleted')
            ) {
              throw new Error(
                `Flagged report ${reportDoc.id} has invalid data.`
              );
            }

            let report: FridgeReport | null = null;
            if (data.report !== undefined) {
              if (!isFridgeReport(data.report)) {
                throw new Error(
                  `Flagged report ${reportDoc.id} has an invalid report snapshot.`
                );
              }
              if (
                data.report.fridgeId !== data.fridgeId ||
                data.report.timestamp !== data.reportTimestamp
              ) {
                throw new Error(
                  `Flagged report ${reportDoc.id} has mismatched report identifiers.`
                );
              }
              report = data.report;
            }

            return {
              id: reportDoc.id,
              fridgeId: data.fridgeId,
              reportTimestamp: data.reportTimestamp,
              reason: data.reason,
              status,
              report,
              createdAt: data.createdAt,
              reportDeletedAt,
            };
          });

          setRows(reportRows);
          setErrorMessage('');
        } catch (error) {
          console.error('Failed to parse flagged reports:', error);
          setErrorMessage(
            'Some flagged reports contain invalid data and could not be displayed.'
          );
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Failed to load flagged reports:', error);
        setErrorMessage(
          `Could not load flagged reports from Firestore: ${getErrorMessage(error)}`
        );
        setIsLoading(false);
      }
    );
  }, [db]);

  const visibleRows = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  async function handleDeleteReport(): Promise<void> {
    if (!reportToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteErrorMessage('');
    try {
      await deleteDoc(doc(db, FLAGGED_REPORTS_COLLECTION, reportToDelete.id));
      setReportToDelete(null);
      setSuccessMessage('Flagged report deleted.');
    } catch (error) {
      console.error('Failed to delete flagged report:', error);
      setDeleteErrorMessage(
        `Could not delete flagged report: ${getErrorMessage(error)}`
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleUpdateReportStatus(
    row: FlaggedReportRow,
    status: EditableFlaggedFridgeReportStatus
  ): Promise<void> {
    if (
      status === row.status ||
      row.status === 'deleted' ||
      updatingStatusId !== null ||
      isDeleting ||
      isDeletingFridgeReport
    ) {
      return;
    }

    setUpdatingStatusId(row.id);
    setStatusUpdateErrorMessage('');
    try {
      await updateDoc(doc(db, FLAGGED_REPORTS_COLLECTION, row.id), { status });
      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.id === row.id ? { ...currentRow, status } : currentRow
        )
      );
      setSuccessMessage(
        `Flag status updated to ${FLAGGED_REPORT_STATUS_LABELS[status]}.`
      );
    } catch (error) {
      console.error('Failed to update flagged report status:', error);
      setStatusUpdateErrorMessage(
        `Could not update flag status: ${getErrorMessage(error)}`
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function handleDeleteFridgeReport(): Promise<void> {
    const row = reportToDeleteFromApi;
    if (!row || isDeletingFridgeReport) return;

    const epochTimestamp = row.report?.epochTimestamp;
    if (!epochTimestamp) {
      setFridgeReportDeleteErrorMessage(
        'Cannot delete this fridge report because its epoch timestamp is unavailable.'
      );
      return;
    }
    if (!user) {
      setFridgeReportDeleteErrorMessage(
        'You must be signed in as an admin to delete a fridge report.'
      );
      return;
    }

    setIsDeletingFridgeReport(true);
    setFridgeReportDeleteErrorMessage('');
    let apiDeleteSucceeded = false;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(
        `/v1/fridges/${encodeURIComponent(row.fridgeId)}/reports/${encodeURIComponent(epochTimestamp)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed (${response.status})`);
      }

      apiDeleteSucceeded = true;
      setDeletedReportIds((currentIds) => new Set(currentIds).add(row.id));
      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.id === row.id
            ? { ...currentRow, status: 'deleted' }
            : currentRow
        )
      );
      await updateDoc(doc(db, FLAGGED_REPORTS_COLLECTION, row.id), {
        status: 'deleted',
        reportDeletedAt: serverTimestamp(),
      });
      setReportToDeleteFromApi(null);
      setSuccessMessage('Fridge report deleted. Status set to Deleted.');
    } catch (error) {
      console.error('Failed to delete fridge report:', error);
      setFridgeReportDeleteErrorMessage(
        apiDeleteSucceeded
          ? `Fridge report was deleted, but its Firestore status could not be updated: ${getErrorMessage(error)}`
          : `Could not delete fridge report: ${getErrorMessage(error)}`
      );
    } finally {
      setIsDeletingFridgeReport(false);
    }
  }

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h1" sx={{ mb: 1 }}>
            Flagged Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review reports users have flagged as inaccurate or harmful.
          </Typography>
        </Box>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        {deleteErrorMessage ? (
          <Alert severity="error">{deleteErrorMessage}</Alert>
        ) : null}
        {statusUpdateErrorMessage ? (
          <Alert severity="error">{statusUpdateErrorMessage}</Alert>
        ) : null}
        {fridgeReportDeleteErrorMessage ? (
          <Alert severity="error">{fridgeReportDeleteErrorMessage}</Alert>
        ) : null}

        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 1480 }} aria-label="Flagged reports">
            <TableHead>
              <TableRow sx={{ bgcolor: designColor.whiteSmoke }}>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Fridge ID</TableCell>
                <TableCell>Fridge Report Timestamp</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Food level</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Photo</TableCell>
                <TableCell>Flagged at (UTC)</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6">No flagged reports yet</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => {
                  const photoHref = row.report?.photoUrl
                    ? getSafePhotoHref(row.report.photoUrl)
                    : null;
                  const isFridgeReportDeleted =
                    row.status === 'deleted' ||
                    row.reportDeletedAt !== null ||
                    deletedReportIds.has(row.id);
                  const displayStatus: FlaggedFridgeReportStatus =
                    isFridgeReportDeleted ? 'deleted' : row.status;

                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Chip
                          label={
                            row.reason === 'inaccurate'
                              ? 'Inaccurate'
                              : 'Harmful'
                          }
                          size="small"
                          color={row.reason === 'harmful' ? 'error' : 'warning'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 190 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel id={`${row.id}-status-label`}>
                            Status
                          </InputLabel>
                          <Select<FlaggedFridgeReportStatus>
                            labelId={`${row.id}-status-label`}
                            label="Status"
                            value={displayStatus}
                            disabled={
                              displayStatus === 'deleted' ||
                              updatingStatusId !== null ||
                              isDeleting ||
                              isDeletingFridgeReport
                            }
                            onChange={(
                              event: SelectChangeEvent<FlaggedFridgeReportStatus>
                            ) => {
                              const nextStatus = event.target.value;
                              if (
                                isFlaggedFridgeReportStatus(nextStatus) &&
                                nextStatus !== 'deleted'
                              ) {
                                void handleUpdateReportStatus(row, nextStatus);
                              }
                            }}
                          >
                            {displayStatus === 'deleted' ? (
                              <MenuItem value="deleted">Deleted</MenuItem>
                            ) : (
                              EDITABLE_FLAGGED_REPORT_STATUSES.map((status) => (
                                <MenuItem key={status} value={status}>
                                  {FLAGGED_REPORT_STATUS_LABELS[status]}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/fridge/${encodeURIComponent(row.fridgeId)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.fridgeId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {formatReportTimestamp(
                          row.report?.timestamp ?? row.reportTimestamp
                        )}
                        {row.report?.epochTimestamp ? (
                          <Typography
                            display="block"
                            variant="caption"
                            color="text.secondary"
                          >
                            Epoch: {row.report.epochTimestamp}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>{row.report?.condition ?? '—'}</TableCell>
                      <TableCell>
                        {row.report
                          ? `${foodLevelConfig[row.report.foodPercentage]?.label ?? 'Unknown'} (${row.report.foodPercentage}/3)`
                          : '—'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 360, verticalAlign: 'top' }}>
                        {row.report ? (
                          row.report.notes ? (
                            <Typography
                              variant="body2"
                              sx={{
                                maxHeight: 200,
                                overflowY: 'auto',
                                overflowWrap: 'anywhere',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {row.report.notes}
                            </Typography>
                          ) : (
                            '-'
                          )
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Details unavailable for this older flag
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.report?.photoUrl ? (
                          photoHref ? (
                            <Link
                              href={photoHref}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open photo
                            </Link>
                          ) : (
                            row.report.photoUrl
                          )
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {formatReportTimestamp(
                          row.createdAt.toDate().toISOString()
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack alignItems="flex-end" spacing={1}>
                          {!isFridgeReportDeleted ? (
                            <Button
                              color="error"
                              size="small"
                              disabled={
                                !row.report?.epochTimestamp ||
                                isDeleting ||
                                isDeletingFridgeReport ||
                                updatingStatusId !== null
                              }
                              onClick={() => {
                                setFridgeReportDeleteErrorMessage('');
                                setReportToDeleteFromApi(row);
                              }}
                              aria-label={`Delete fridge report for ${row.fridgeId}`}
                              title={
                                row.report?.epochTimestamp
                                  ? undefined
                                  : 'Epoch timestamp unavailable'
                              }
                            >
                              Delete Fridge Report
                            </Button>
                          ) : null}
                          <Button
                            color="error"
                            size="small"
                            disabled={
                              isDeletingFridgeReport ||
                              updatingStatusId !== null
                            }
                            onClick={() => {
                              setDeleteErrorMessage('');
                              setReportToDelete(row);
                            }}
                            aria-label={`Delete flag for ${row.fridgeId}`}
                          >
                            Delete Flag
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={rows.length}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </TableContainer>
      </Stack>
      <Dialog
        open={Boolean(reportToDelete)}
        onClose={() => {
          if (!isDeleting) setReportToDelete(null);
        }}
        aria-labelledby="delete-flag-dialog-title"
      >
        <DialogTitle id="delete-flag-dialog-title">
          Delete flagged report?
        </DialogTitle>
        <DialogContent>
          {reportToDelete ? (
            <Typography>
              This permanently deletes the flag for fridge{' '}
              <strong>{reportToDelete.fridgeId}</strong>. The original fridge
              report will not be affected.
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportToDelete(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => void handleDeleteReport()}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete flag'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(reportToDeleteFromApi)}
        onClose={() => {
          if (!isDeletingFridgeReport) setReportToDeleteFromApi(null);
        }}
        aria-labelledby="delete-fridge-report-dialog-title"
      >
        <DialogTitle id="delete-fridge-report-dialog-title">
          Delete Fridge Report?
        </DialogTitle>
        <DialogContent>
          {reportToDeleteFromApi ? (
            <Typography>
              This permanently deletes the activity report for fridge{' '}
              <strong>{reportToDeleteFromApi.fridgeId}</strong> at epoch{' '}
              <strong>{reportToDeleteFromApi.report?.epochTimestamp}</strong>.
              The flagged report will remain in Firestore and be marked as
              deleted. Its captured details were submitted with the flag and
              have not been verified against the API; review the report before
              proceeding.
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setReportToDeleteFromApi(null)}
            disabled={isDeletingFridgeReport}
          >
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => void handleDeleteFridgeReport()}
            disabled={isDeletingFridgeReport}
          >
            {isDeletingFridgeReport ? 'Deleting…' : 'Delete Fridge Report'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />
    </Box>
  );
}
