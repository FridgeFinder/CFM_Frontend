'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
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
import { AddFridgeForm, AddFridgeFormData } from '../add-fridge/AddFridgeForm';

const FREEDGE_LOG_COLLECTION = 'freedgeLog';
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

type FreedgeLocation = {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  geoLat?: number;
  geoLng?: number;
};

type SeedFreedge = {
  id: string;
  name: string;
  network?: string;
  location: FreedgeLocation;
  contact?: string;
  operatingHours?: string;
  details?: string;
  photoUrl?: string;
  localMap?: string;
  active?: string;
  fridgefinder_id?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  website?: string | null;
};

type FreedgeRow = {
  id: string;
  freedgeId: string;
  name: string;
  network?: string;
  location: FreedgeLocation;
  contact?: string;
  operatingHours?: string;
  details?: string;
  photoUrl?: string;
  localMap?: string;
  active?: string;
  fridgefinderId?: string;
  email?: string;
  phoneNumber?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
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

function getAddress(location: FreedgeLocation): string {
  return [location.street, location.city, location.state, location.zip]
    .filter(Boolean)
    .join(', ');
}

const US_STATE_ABBREVIATION_BY_NAME: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  'district of columbia': 'DC',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
};

// Add Fridge requires a 2-letter state code; freedge data stores full names
// after normalization, so best-effort convert it back for the prefilled form.
function toStateAbbreviation(state?: string): string {
  const trimmed = state?.trim() ?? '';
  if (trimmed.length === 2) {
    return trimmed.toUpperCase();
  }

  return US_STATE_ABBREVIATION_BY_NAME[trimmed.toLowerCase()] ?? '';
}

function buildAddFridgeDefaults(row: FreedgeRow): Partial<AddFridgeFormData> {
  return {
    name: row.name,
    street: row.location.street ?? '',
    city: row.location.city ?? '',
    state: toStateAbbreviation(row.location.state),
    country: row.location.country ?? '',
    zip: row.location.zip ?? '',
    geoLat: row.location.geoLat ?? 0,
    geoLng: row.location.geoLng ?? 0,
    email: row.email ?? '',
    instagram: row.instagram ?? '',
    website: row.website || row.facebook || '',
    notes: row.details ?? '',
  };
}

const US_COUNTRY_NAMES = new Set([
  'united states',
  'united states of america',
  'usa',
  'us',
  'u.s.a.',
  'united states of amerca',
]);

type RegionFilter = 'all' | 'usa' | 'international';

function isUsaLocation(location: FreedgeLocation): boolean {
  const country = location.country?.trim().toLowerCase();
  return country ? US_COUNTRY_NAMES.has(country) : false;
}

function matchesRegionFilter(
  location: FreedgeLocation,
  regionFilter: RegionFilter
): boolean {
  if (regionFilter === 'all') {
    return true;
  }

  return isUsaLocation(location) === (regionFilter === 'usa');
}

function getUsaStateOptions(rows: FreedgeRow[]): string[] {
  const labelByKey = new Map<string, string>();

  rows.forEach((row) => {
    if (!isUsaLocation(row.location)) {
      return;
    }

    const state = row.location.state?.trim();
    if (!state) {
      return;
    }

    const key = state.toLowerCase();
    if (!labelByKey.has(key)) {
      labelByKey.set(key, state);
    }
  });

  return Array.from(labelByKey.values()).sort((a, b) => a.localeCompare(b));
}

function matchesStateFilter(
  location: FreedgeLocation,
  stateFilter: string
): boolean {
  if (!stateFilter) {
    return true;
  }

  return location.state?.trim().toLowerCase() === stateFilter.toLowerCase();
}

function sanitizeLocation(location: FreedgeLocation): FreedgeLocation {
  return {
    ...(typeof location.street === 'string' ? { street: location.street } : {}),
    ...(typeof location.city === 'string' ? { city: location.city } : {}),
    ...(typeof location.state === 'string' ? { state: location.state } : {}),
    ...(typeof location.zip === 'string' ? { zip: location.zip } : {}),
    ...(typeof location.country === 'string'
      ? { country: location.country }
      : {}),
    ...(typeof location.geoLat === 'number' ? { geoLat: location.geoLat } : {}),
    ...(typeof location.geoLng === 'number' ? { geoLng: location.geoLng } : {}),
  };
}

function buildFreedgeLogRow(freedge: SeedFreedge, exists: boolean) {
  return {
    freedgeId: freedge.id,
    name: freedge.name,
    ...(freedge.network ? { network: freedge.network } : {}),
    location: sanitizeLocation(freedge.location),
    ...(freedge.contact ? { contact: freedge.contact } : {}),
    ...(freedge.operatingHours
      ? { operatingHours: freedge.operatingHours }
      : {}),
    ...(freedge.details ? { details: freedge.details } : {}),
    ...(freedge.photoUrl ? { photoUrl: freedge.photoUrl } : {}),
    ...(freedge.localMap ? { localMap: freedge.localMap } : {}),
    ...(freedge.active ? { active: freedge.active } : {}),
    ...(typeof freedge.fridgefinder_id === 'string' && freedge.fridgefinder_id
      ? { fridgefinderId: freedge.fridgefinder_id }
      : {}),
    ...(typeof freedge.email === 'string' && freedge.email
      ? { email: freedge.email }
      : {}),
    ...(typeof freedge.phoneNumber === 'string' && freedge.phoneNumber
      ? { phoneNumber: freedge.phoneNumber }
      : {}),
    ...(typeof freedge.instagram === 'string' && freedge.instagram
      ? { instagram: freedge.instagram }
      : {}),
    ...(typeof freedge.facebook === 'string' && freedge.facebook
      ? { facebook: freedge.facebook }
      : {}),
    ...(typeof freedge.website === 'string' && freedge.website
      ? { website: freedge.website }
      : {}),
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

export default function FreedgePage(): React.ReactElement {
  const [rows, setRows] = useState<FreedgeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savingRowIds, setSavingRowIds] = useState<Set<string>>(new Set());
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [stateFilter, setStateFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [addFridgeRow, setAddFridgeRow] = useState<FreedgeRow | null>(null);

  const db = useMemo(() => getFirebaseFirestore(), []);

  useEffect(() => {
    const freedgeLogQuery = query(
      collection(db, FREEDGE_LOG_COLLECTION),
      orderBy('name')
    );

    return onSnapshot(
      freedgeLogQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        setHasPendingWrites(snapshot.metadata.hasPendingWrites);
        setRows(
          snapshot.docs.map((freedgeLogDoc) => {
            const data = freedgeLogDoc.data();
            const status = isContactStatus(data.status)
              ? data.status
              : 'not_contacted';

            return {
              id: freedgeLogDoc.id,
              freedgeId:
                typeof data.freedgeId === 'string'
                  ? data.freedgeId
                  : freedgeLogDoc.id,
              name:
                typeof data.name === 'string' ? data.name : 'Unnamed freedge',
              network:
                typeof data.network === 'string' ? data.network : undefined,
              location: data.location ?? {},
              contact:
                typeof data.contact === 'string' ? data.contact : undefined,
              operatingHours:
                typeof data.operatingHours === 'string'
                  ? data.operatingHours
                  : undefined,
              details:
                typeof data.details === 'string' ? data.details : undefined,
              photoUrl:
                typeof data.photoUrl === 'string' ? data.photoUrl : undefined,
              localMap:
                typeof data.localMap === 'string' ? data.localMap : undefined,
              active: typeof data.active === 'string' ? data.active : undefined,
              fridgefinderId:
                typeof data.fridgefinderId === 'string'
                  ? data.fridgefinderId
                  : undefined,
              email: typeof data.email === 'string' ? data.email : undefined,
              phoneNumber:
                typeof data.phoneNumber === 'string'
                  ? data.phoneNumber
                  : undefined,
              instagram:
                typeof data.instagram === 'string' ? data.instagram : undefined,
              facebook:
                typeof data.facebook === 'string' ? data.facebook : undefined,
              website:
                typeof data.website === 'string' ? data.website : undefined,
              status,
              contacted: Boolean(data.contacted),
              notes: typeof data.notes === 'string' ? data.notes : '',
              updatedAt: data.updatedAt,
              hasPendingWrites: freedgeLogDoc.metadata.hasPendingWrites,
            };
          })
        );
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load freedge log:', error);
        setErrorMessage(
          `Could not load the freedge log from Firestore: ${getErrorMessage(error)}`
        );
        setIsLoading(false);
      }
    );
  }, [db]);

  const [prevRegionFilter, setPrevRegionFilter] = useState(regionFilter);
  if (regionFilter !== prevRegionFilter) {
    setPrevRegionFilter(regionFilter);
    setStateFilter('');
    setPage(0);
  }

  const [prevStateFilter, setPrevStateFilter] = useState(stateFilter);
  if (stateFilter !== prevStateFilter) {
    setPrevStateFilter(stateFilter);
    setPage(0);
  }

  async function handleImportFreedges(): Promise<void> {
    setIsImporting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { default: freedgeLocations } =
        await import('data/freedge-locations.json');
      const seedFreedges = freedgeLocations as SeedFreedge[];
      const existingIds = new Set(
        rows.filter((row) => !row.hasPendingWrites).map((row) => row.freedgeId)
      );
      const chunks: SeedFreedge[][] = [];

      for (
        let index = 0;
        index < seedFreedges.length;
        index += IMPORT_BATCH_SIZE
      ) {
        chunks.push(seedFreedges.slice(index, index + IMPORT_BATCH_SIZE));
      }

      const settledResults = await withTimeout(
        Promise.allSettled(
          chunks.map((chunk) => {
            const batch = writeBatch(db);

            chunk.forEach((freedge) => {
              batch.set(
                doc(db, FREEDGE_LOG_COLLECTION, freedge.id),
                buildFreedgeLogRow(freedge, existingIds.has(freedge.id)),
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
          `Imported ${importedCount} of ${seedFreedges.length} freedge locations, but ${failedChunks.length} batch(es) failed: ${getErrorMessage(failedChunks[0].reason)}`
        );
      }

      setSuccessMessage(
        `Imported ${importedCount} freedge locations into the log.`
      );
    } catch (error) {
      console.error('Failed to import freedge locations:', error);
      setErrorMessage(
        `Could not import freedge locations: ${getErrorMessage(error)}`
      );
    } finally {
      setIsImporting(false);
    }
  }

  async function saveRow(rowId: string, updates: Partial<FreedgeRow>) {
    setSavingRowIds((currentIds) => new Set(currentIds).add(rowId));

    try {
      await withTimeout(
        updateDoc(doc(db, FREEDGE_LOG_COLLECTION, rowId), {
          ...updates,
          updatedAt: serverTimestamp(),
        }),
        'Firestore did not confirm the update. Check Firestore rules, project configuration, and network access.'
      );
    } catch (error) {
      console.error('Failed to save freedge log row:', error);
      setErrorMessage(
        `Could not save the freedge log update: ${getErrorMessage(error)}`
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
    row: FreedgeRow,
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
    } as Partial<FreedgeRow>);
  }

  function handleNotesBlur(row: FreedgeRow, notes: string): void {
    if (notes !== row.notes) {
      void saveRow(row.id, { notes });
    }
  }

  const filteredRows = rows.filter(
    (row) =>
      matchesRegionFilter(row.location, regionFilter) &&
      matchesStateFilter(row.location, stateFilter)
  );
  const filteredContacted = filteredRows.filter((row) => row.contacted).length;
  const filteredFinalized = filteredRows.filter(
    (row) => row.status === 'finalized'
  ).length;
  const visibleRows = filteredRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const usaStateOptions = getUsaStateOptions(rows);

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
              Freedge
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track outreach to freedge.org listed locations, response state,
              and follow-up notes.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={
              isImporting ? <CircularProgress size={18} /> : <SyncIcon />
            }
            disabled={isImporting}
            onClick={() => void handleImportFreedges()}
            sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}
          >
            {isImporting ? 'Importing...' : 'Import freedges'}
          </Button>
        </Stack>

        <Alert severity="info">
          Importing is idempotent: it creates missing rows and refreshes freedge
          details from the bundled seed data without overwriting outreach status
          or notes.
        </Alert>

        {hasPendingWrites ? (
          <Alert severity="warning">
            Some freedge log changes are still pending in Firestore. They are
            visible locally, but they are not confirmed as persisted yet.
          </Alert>
        ) : null}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total freedges
            </Typography>
            <Typography variant="h4">{filteredRows.length}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Contacted
            </Typography>
            <Typography variant="h4">{filteredContacted}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Finalized
            </Typography>
            <Typography variant="h4">{filteredFinalized}</Typography>
          </Paper>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Tabs
            value={regionFilter}
            onChange={(_, value: RegionFilter) => setRegionFilter(value)}
            aria-label="Freedge region filter"
          >
            <Tab label="All" value="all" />
            <Tab label="USA" value="usa" />
            <Tab label="International" value="international" />
          </Tabs>

          {regionFilter === 'usa' ? (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="freedge-state-filter-label">State</InputLabel>
              <Select
                labelId="freedge-state-filter-label"
                label="State"
                value={stateFilter}
                onChange={(event) => setStateFilter(event.target.value)}
              >
                <MenuItem value="">All states</MenuItem>
                {usaStateOptions.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 1040 }} aria-label="Freedge log">
            <TableHead>
              <TableRow sx={{ bgcolor: designColor.whiteSmoke }}>
                <TableCell>Freedge</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Stack spacing={1} alignItems="center">
                      <Typography variant="h6">
                        No freedge log rows yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Import freedges once to create the Firestore collection.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      No freedges match this filter.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => {
                  const isSaving = savingRowIds.has(row.id);

                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ verticalAlign: 'top', width: 300 }}>
                        <Stack spacing={0.75}>
                          {row.fridgefinderId ? (
                            <Link
                              href={`/fridge/${row.fridgefinderId}`}
                              underline="hover"
                              sx={{ fontWeight: 700 }}
                            >
                              {row.name}
                            </Link>
                          ) : (
                            <Typography fontWeight={700}>{row.name}</Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            {getAddress(row.location) || 'No address'}
                          </Typography>
                          {row.network ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Network: {row.network}
                            </Typography>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top', width: 260 }}>
                        <Stack spacing={0.75}>
                          {row.contact ? (
                            row.contact.startsWith('http') ? (
                              <Link
                                href={row.contact}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {row.contact}
                              </Link>
                            ) : (
                              <Typography variant="body2">
                                {row.contact}
                              </Typography>
                            )
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No contact info
                            </Typography>
                          )}
                          {row.operatingHours ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Hours: {row.operatingHours}
                            </Typography>
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
                      <TableCell sx={{ verticalAlign: 'top', width: 140 }}>
                        {row.fridgefinderId ? (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            sx={{ color: designColor.green.success }}
                          >
                            <CheckCircleIcon fontSize="small" />
                            <Typography variant="caption">Added</Typography>
                          </Stack>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setAddFridgeRow(row)}
                          >
                            Add Fridge
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredRows.length}
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

      <Dialog
        open={Boolean(addFridgeRow)}
        onClose={() => setAddFridgeRow(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          Add Fridge
          <IconButton
            aria-label="Close"
            onClick={() => setAddFridgeRow(null)}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {addFridgeRow ? (
            <AddFridgeForm
              defaultValues={buildAddFridgeDefaults(addFridgeRow)}
              initialPhotoUrl={addFridgeRow.photoUrl}
              onSuccess={(createdFridgeId) => {
                void saveRow(addFridgeRow.id, {
                  fridgefinderId: createdFridgeId,
                });
                setAddFridgeRow(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
