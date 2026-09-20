'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  TextField,
  Typography,
} from '@mui/material';
import { Sync as SyncIcon } from '@mui/icons-material';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseFirestore } from 'config/firebase';
import { designColor } from 'theme/palette';

const CONTACT_LOG_COLLECTION = 'contactLog';
const FRIDGES_API_URL = '/v1/fridges/';
const FIRESTORE_WRITE_TIMEOUT_MS = 15000;
const IMPORT_BATCH_SIZE = 450;
// Each batch's docs are validated against Firestore rules individually, so
// commit time grows with batch count; scale the timeout instead of a flat cap.
const getImportTimeoutMs = (batchCount: number) => 20000 + batchCount * 20000;

const contactStatuses = [
  { value: 'not_contacted', label: 'Not contacted', color: 'default' },
  { value: 'contacted', label: 'Contacted', color: 'info' },
  {
    value: 'waiting_response',
    label: 'Waiting for response',
    color: 'warning',
  },
  { value: 'follow_up_needed', label: 'Follow-up needed', color: 'secondary' },
  { value: 'finalized', label: 'Finalized', color: 'success' },
  { value: 'not_reachable', label: 'Not reachable', color: 'error' },
] as const;

type ContactStatus = (typeof contactStatuses)[number]['value'];

type ApiFridge = {
  id: string;
  name: string;
  location?: FridgeLocation;
  maintainer?: FridgeMaintainer;
  condition?: string;
  latestFridgeReport?: {
    condition?: string;
  };
};

type FridgeLocation = {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  geoLat?: number;
  geoLng?: number;
};

type FridgeMaintainer = {
  email?: string;
  instagram?: string;
  website?: string;
};

type ContactLogRow = {
  id: string;
  fridgeId: string;
  name: string;
  location: FridgeLocation;
  maintainer: FridgeMaintainer;
  status: ContactStatus;
  contacted: boolean;
  notes: string;
  updatedAt?: Timestamp;
  hasPendingWrites: boolean;
};

const statusLabels = contactStatuses.reduce<Record<ContactStatus, string>>(
  (labels, status) => ({ ...labels, [status.value]: status.label }),
  {} as Record<ContactStatus, string>
);

function isContactStatus(value: unknown): value is ContactStatus {
  return contactStatuses.some((status) => status.value === value);
}

function shouldImportFridge(fridge: ApiFridge): boolean {
  const condition = fridge.latestFridgeReport?.condition ?? fridge.condition;

  return condition !== 'ghost';
}

function getAddress(location: FridgeLocation): string {
  return [location.street, location.city, location.state, location.zip]
    .filter(Boolean)
    .join(', ');
}

function sanitizeLocation(location?: FridgeLocation): FridgeLocation {
  return {
    ...(typeof location?.street === 'string'
      ? { street: location.street }
      : {}),
    ...(typeof location?.city === 'string' ? { city: location.city } : {}),
    ...(typeof location?.state === 'string' ? { state: location.state } : {}),
    ...(typeof location?.zip === 'string' ? { zip: location.zip } : {}),
    ...(typeof location?.geoLat === 'number'
      ? { geoLat: location.geoLat }
      : {}),
    ...(typeof location?.geoLng === 'number'
      ? { geoLng: location.geoLng }
      : {}),
  };
}

function sanitizeMaintainer(maintainer?: FridgeMaintainer): FridgeMaintainer {
  return {
    ...(typeof maintainer?.email === 'string'
      ? { email: maintainer.email }
      : {}),
    ...(typeof maintainer?.instagram === 'string'
      ? { instagram: maintainer.instagram }
      : {}),
    ...(typeof maintainer?.website === 'string'
      ? { website: maintainer.website }
      : {}),
  };
}

function buildContactLogRow(fridge: ApiFridge, exists: boolean) {
  return {
    fridgeId: fridge.id,
    name: fridge.name,
    location: sanitizeLocation(fridge.location),
    maintainer: sanitizeMaintainer(fridge.maintainer),
    ...(exists
      ? {}
      : {
          status: 'not_contacted' satisfies ContactStatus,
          contacted: false,
          notes: '',
          createdAt: serverTimestamp(),
        }),
    updatedAt: serverTimestamp(),
  };
}

function getStatusChipColor(status: ContactStatus) {
  return contactStatuses.find((option) => option.value === status)?.color;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function withTimeout<T>(
  promise: Promise<T>,
  message: string,
  timeoutMs: number = FIRESTORE_WRITE_TIMEOUT_MS
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then((value) => {
        globalThis.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error: unknown) => {
        globalThis.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export default function ContactLogPage(): React.ReactElement {
  const [rows, setRows] = useState<ContactLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savingRowIds, setSavingRowIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const db = useMemo(() => getFirebaseFirestore(), []);

  useEffect(() => {
    const contactLogQuery = query(
      collection(db, CONTACT_LOG_COLLECTION),
      orderBy('name')
    );

    return onSnapshot(
      contactLogQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        setHasPendingWrites(snapshot.metadata.hasPendingWrites);
        setRows(
          snapshot.docs.map((contactLogDoc) => {
            const data = contactLogDoc.data();
            const status = isContactStatus(data.status)
              ? data.status
              : 'not_contacted';

            return {
              id: contactLogDoc.id,
              fridgeId:
                typeof data.fridgeId === 'string'
                  ? data.fridgeId
                  : contactLogDoc.id,
              name:
                typeof data.name === 'string' ? data.name : 'Unnamed fridge',
              location: data.location ?? {},
              maintainer: data.maintainer ?? {},
              status,
              contacted: Boolean(data.contacted),
              notes: typeof data.notes === 'string' ? data.notes : '',
              updatedAt: data.updatedAt,
              hasPendingWrites: contactLogDoc.metadata.hasPendingWrites,
            };
          })
        );
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load contact log:', error);
        setErrorMessage(
          `Could not load the contact log from Firestore: ${getErrorMessage(error)}`
        );
        setIsLoading(false);
      }
    );
  }, [db]);

  const [prevRowsLength, setPrevRowsLength] = useState(rows.length);
  if (rows.length !== prevRowsLength) {
    setPrevRowsLength(rows.length);
    if (page > 0 && page * rowsPerPage >= rows.length) {
      setPage(0);
    }
  }

  async function handleImportFridges(): Promise<void> {
    setIsImporting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(FRIDGES_API_URL, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Fridges API returned ${response.status}`);
      }

      const fridges = (await response.json()) as ApiFridge[];
      const importableFridges = fridges.filter(shouldImportFridge);
      const existingIds = new Set(
        rows.filter((row) => !row.hasPendingWrites).map((row) => row.fridgeId)
      );
      const chunks: ApiFridge[][] = [];

      for (
        let index = 0;
        index < importableFridges.length;
        index += IMPORT_BATCH_SIZE
      ) {
        chunks.push(importableFridges.slice(index, index + IMPORT_BATCH_SIZE));
      }

      const settledResults = await withTimeout(
        Promise.allSettled(
          chunks.map((chunk) => {
            const batch = writeBatch(db);

            chunk.forEach((fridge) => {
              batch.set(
                doc(db, CONTACT_LOG_COLLECTION, fridge.id),
                buildContactLogRow(fridge, existingIds.has(fridge.id)),
                { merge: true }
              );
            });

            return batch.commit();
          })
        ),
        `Firestore did not confirm the import within ${getImportTimeoutMs(chunks.length) / 1000}s. Check Firestore rules, project configuration, and network access.`,
        getImportTimeoutMs(chunks.length)
      );

      const failedChunks = settledResults.filter(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected'
      );
      const importedCount = settledResults.reduce(
        (total, result, index) =>
          result.status === 'fulfilled' ? total + chunks[index].length : total,
        0
      );

      if (failedChunks.length > 0) {
        throw new Error(
          `Imported ${importedCount} of ${importableFridges.length} fridges, but ${failedChunks.length} batch(es) failed: ${getErrorMessage(failedChunks[0].reason)}`
        );
      }

      setSuccessMessage(
        `Imported ${importedCount} fridges into the contact log.`
      );
    } catch (error) {
      console.error('Failed to import fridges:', error);
      setErrorMessage(
        `Could not import fridges into the contact log: ${getErrorMessage(error)}`
      );
    } finally {
      setIsImporting(false);
    }
  }

  async function saveRow(rowId: string, updates: Partial<ContactLogRow>) {
    setSavingRowIds((currentIds) => new Set(currentIds).add(rowId));

    try {
      await withTimeout(
        updateDoc(doc(db, CONTACT_LOG_COLLECTION, rowId), {
          ...updates,
          updatedAt: serverTimestamp(),
        }),
        'Firestore did not confirm the update. Check Firestore rules, project configuration, and network access.'
      );
    } catch (error) {
      console.error('Failed to save contact log row:', error);
      setErrorMessage(
        `Could not save the contact log update: ${getErrorMessage(error)}`
      );
    } finally {
      setSavingRowIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(rowId);
        return nextIds;
      });
    }
  }

  function handleStatusChange(
    row: ContactLogRow,
    event: SelectChangeEvent<ContactStatus>
  ): void {
    const status = event.target.value as ContactStatus;
    const contacted = status !== 'not_contacted';

    void saveRow(row.id, {
      status,
      contacted,
      ...(contacted && !row.contacted
        ? { contactedAt: serverTimestamp() }
        : {}),
    } as Partial<ContactLogRow>);
  }

  function handleNotesBlur(row: ContactLogRow, notes: string): void {
    if (notes !== row.notes) {
      void saveRow(row.id, { notes });
    }
  }

  const totalContacted = rows.filter((row) => row.contacted).length;
  const finalizedCount = rows.filter(
    (row) => row.status === 'finalized'
  ).length;
  const visibleRows = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
        >
          <Box>
            <Typography variant="h1" sx={{ mb: 1 }}>
              Contact Log
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track organizer outreach, response state, and follow-up notes.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={
              isImporting ? <CircularProgress size={18} /> : <SyncIcon />
            }
            disabled={isImporting}
            onClick={() => void handleImportFridges()}
            sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}
          >
            {isImporting ? 'Importing...' : 'Import fridges'}
          </Button>
        </Stack>

        <Alert severity="info">
          Importing is idempotent: it creates missing rows and refreshes fridge
          name, location, and maintainer fields without overwriting outreach
          status or notes.
        </Alert>

        {hasPendingWrites ? (
          <Alert severity="warning">
            Some contact log changes are still pending in Firestore. They are
            visible locally, but they are not confirmed as persisted yet.
          </Alert>
        ) : null}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total fridges
            </Typography>
            <Typography variant="h4">{rows.length}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Contacted
            </Typography>
            <Typography variant="h4">{totalContacted}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Finalized
            </Typography>
            <Typography variant="h4">{finalizedCount}</Typography>
          </Paper>
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 1040 }} aria-label="Contact log">
            <TableHead>
              <TableRow sx={{ bgcolor: designColor.whiteSmoke }}>
                <TableCell>Fridge</TableCell>
                <TableCell>Maintainer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Stack spacing={1} alignItems="center">
                      <Typography variant="h6">
                        No contact log rows yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Import fridges once to create the Firestore collection.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => {
                  const isSaving = savingRowIds.has(row.id);

                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ verticalAlign: 'top', width: 280 }}>
                        <Stack spacing={0.75}>
                          <Link
                            href={`/fridge/${row.fridgeId}`}
                            underline="hover"
                            sx={{ fontWeight: 700 }}
                          >
                            {row.name}
                          </Link>
                          <Typography variant="body2" color="text.secondary">
                            {getAddress(row.location) || 'No address'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {row.fridgeId}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top', width: 260 }}>
                        <Stack spacing={0.75}>
                          {row.maintainer.email ? (
                            <Link href={`mailto:${row.maintainer.email}`}>
                              {row.maintainer.email}
                            </Link>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No email
                            </Typography>
                          )}
                          {row.maintainer.instagram ? (
                            <Link
                              href={row.maintainer.instagram}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Instagram
                            </Link>
                          ) : null}
                          {row.maintainer.website ? (
                            <Link
                              href={row.maintainer.website}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Website
                            </Link>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top', width: 220 }}>
                        <Stack spacing={1}>
                          <FormControl fullWidth size="small">
                            <InputLabel id={`${row.id}-status-label`}>
                              Status
                            </InputLabel>
                            <Select<ContactStatus>
                              labelId={`${row.id}-status-label`}
                              value={row.status}
                              label="Status"
                              onChange={(event) =>
                                handleStatusChange(row, event)
                              }
                            >
                              {contactStatuses.map((status) => (
                                <MenuItem
                                  key={status.value}
                                  value={status.value}
                                >
                                  {status.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Chip
                            label={statusLabels[row.status]}
                            size="small"
                            color={getStatusChipColor(row.status)}
                            variant="outlined"
                            sx={{ alignSelf: 'flex-start' }}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top', minWidth: 300 }}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={3}
                          defaultValue={row.notes}
                          placeholder="Add outreach notes"
                          onBlur={(event) =>
                            handleNotesBlur(row, event.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top', width: 140 }}>
                        <Stack spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            {row.updatedAt?.toDate().toLocaleDateString() ??
                              'New'}
                          </Typography>
                          {isSaving ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Saving...
                            </Typography>
                          ) : null}
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

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={5000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={7000}
        onClose={() => setErrorMessage('')}
      >
        <Alert severity="error" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
