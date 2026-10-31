'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { foodLevelConfig } from 'config/foodLevel';
import { LocalTimestamp } from 'features/fridge-details/components/LocalTimestamp';
import { designColor } from 'theme/palette';
import type { ApiFridge } from 'types/domain';
import { apiClient } from 'utils/api-client';
import { EditFridgeDialog } from './EditFridgeDialog';

function getStatusUpdateTime(fridge: ApiFridge): number | null {
  const timestamp = fridge.latestFridgeReport?.timestamp;
  const time = timestamp ? Date.parse(timestamp) : NaN;
  return Number.isFinite(time) ? time : null;
}

export default function AdminFridgesPage(): React.ReactElement {
  const [fridges, setFridges] = useState<ApiFridge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [conditionFilter, setConditionFilter] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingFridge, setEditingFridge] = useState<ApiFridge | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const conditions = Array.from(
    new Set([
      'good',
      'dirty',
      'out of order',
      'not at location',
      'ghost',
      'No report',
      ...fridges.map(
        (fridge) => fridge.latestFridgeReport?.condition || 'No report'
      ),
    ])
  );
  const filteredFridges = fridges.filter(
    (fridge) =>
      !conditionFilter ||
      (fridge.latestFridgeReport?.condition || 'No report') === conditionFilter
  );
  const sortedFridges = [...filteredFridges].sort((a, b) => {
    const aTime = getStatusUpdateTime(a);
    const bTime = getStatusUpdateTime(b);
    if (aTime === null) return bTime === null ? 0 : 1;
    if (bTime === null) return -1;
    return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
  });

  useEffect(() => {
    let active = true;

    async function loadFridges() {
      try {
        const data = await apiClient.getFridges();
        if (active) setFridges(data);
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Failed to fetch fridges'
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadFridges();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1" sx={{ mb: 1 }}>
          Fridges
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review fridge conditions, food levels, and the latest status updates.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        <FormControl sx={{ minWidth: 220 }} size="small">
          <InputLabel id="fridge-condition-label" shrink>
            Condition
          </InputLabel>
          <Select
            labelId="fridge-condition-label"
            id="fridge-condition"
            label="Condition"
            displayEmpty
            value={conditionFilter}
            onChange={(event) => {
              setConditionFilter(event.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All conditions</MenuItem>
            {conditions.map((condition) => (
              <MenuItem key={condition} value={condition}>
                {condition}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {!isLoading && !errorMessage ? (
          <Typography variant="body1" role="status">
            {filteredFridges.length}{' '}
            {filteredFridges.length === 1 ? 'fridge' : 'fridges'}
          </Typography>
        ) : null}
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 200 }}>
          <CircularProgress aria-label="Loading fridges" />
        </Box>
      ) : errorMessage ? (
        <Alert severity="error">{errorMessage}</Alert>
      ) : fridges.length === 0 ? (
        <Alert severity="info">No fridges found.</Alert>
      ) : (
        <Paper variant="outlined">
          <TableContainer>
            <Table aria-label="Fridges">
              <TableHead>
                <TableRow sx={{ bgcolor: designColor.whiteSmoke }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Food Level</TableCell>
                  <TableCell>Latest Report Notes</TableCell>
                  <TableCell sortDirection={sortDirection}>
                    <TableSortLabel
                      active
                      direction={sortDirection}
                      onClick={() => {
                        setSortDirection((direction) =>
                          direction === 'desc' ? 'asc' : 'desc'
                        );
                        setPage(0);
                      }}
                    >
                      Latest Status Update
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFridges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      No fridges match the selected condition.
                    </TableCell>
                  </TableRow>
                ) : null}
                {sortedFridges
                  .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                  .map((fridge) => {
                    const report = fridge.latestFridgeReport;

                    return (
                      <TableRow key={fridge.id} hover>
                        <TableCell>
                          <Link
                            href={`/fridge/${encodeURIComponent(fridge.id)}`}
                          >
                            {fridge.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {report?.condition || 'No report'}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {report
                            ? (foodLevelConfig[report.foodPercentage]?.label ??
                              'Unknown')
                            : 'No report'}
                        </TableCell>
                        <TableCell
                          sx={{
                            maxWidth: 480,
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {report?.notes || '-'}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {report && getStatusUpdateTime(fridge) !== null ? (
                            <time dateTime={report.timestamp}>
                              <LocalTimestamp timestamp={report.timestamp} />
                            </time>
                          ) : report?.timestamp ? (
                            `Invalid timestamp: ${report.timestamp}`
                          ) : (
                            'No timestamp'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            onClick={() => setEditingFridge(fridge)}
                            aria-label={`Edit ${fridge.name}`}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredFridges.length}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
          />
        </Paper>
      )}
      {editingFridge ? (
        <EditFridgeDialog
          key={editingFridge.id}
          fridge={editingFridge}
          onClose={() => setEditingFridge(null)}
          onSaved={(updated) => {
            setFridges((current) =>
              current.map((fridge) =>
                fridge.id === updated.id ? updated : fridge
              )
            );
            setEditingFridge(null);
            setSuccessMessage('Fridge updated.');
          }}
        />
      ) : null}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
