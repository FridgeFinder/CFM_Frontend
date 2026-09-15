'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Slider,
  Radio,
  Divider,
  Button,
  Stack,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import { ButtonLink } from 'components/ui';
import { MapLegendPinLocationIcon } from 'theme/icons';
import { pinColor } from 'theme/palette';
import { reportSchema, ReportFormData } from '../schemas/fridge.schema';

interface ReportFormProps {
  fridgeId: string;
  fridgeName?: string;
  onSubmit: (data: ReportFormData) => void;
  initialValues?: Partial<ReportFormData>;
  cancelTo?: string;
}

function FoodLevelLabel({ color, label }: { color: string; label: string }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.25,
      }}
    >
      <MapLegendPinLocationIcon
        sx={{ fontSize: { xs: '26px', sm: '27px', md: '29px' }, color }}
      />
      <Box component="span">{label}</Box>
    </Box>
  );
}

const sliderMarks = [
  {
    value: 0,
    label: <FoodLevelLabel color={pinColor.itemsEmpty} label="Empty" />,
  },
  {
    value: 1,
    label: <FoodLevelLabel color={pinColor.itemsFew} label="Few Items" />,
  },
  {
    value: 2,
    label: <FoodLevelLabel color={pinColor.itemsMany} label="Many Items" />,
  },
  {
    value: 3,
    label: <FoodLevelLabel color={pinColor.itemsFull} label="Full" />,
  },
];

const fridgeSliderStyles = {
  mx: 'auto',
  width: 7 / 8,
  mt: 5,
  '.MuiSlider-markLabel': {
    fontSize: { xs: 12, sm: 13, md: 14 },
    top: 0,
    transform: 'translateX(-50%) translateY(-100%) translateY(4px)',
  },
  '.MuiSlider-markLabelActive': {
    fontSize: { xs: 12, sm: 13, md: 14 },
    top: 0,
    transform: 'translateX(-50%) translateY(-100%) translateY(4px)',
  },
};

export function ReportForm({
  fridgeId,
  fridgeName,
  onSubmit,
  initialValues,
  cancelTo = '/browse',
}: ReportFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      condition: 'good',
      notes: '',
      foodPercentage: 0,
      ...initialValues,
    },
  });

  return (
    <Box
      sx={{
        width: '100%',
        pt: { xs: 0, md: 0.5 },
        pb: { xs: 4, md: 6 },
        px: { xs: 2, sm: 4 },
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      <Box
        sx={{
          mx: 'auto',
          maxWidth: 650,
          width: { xs: 'calc(100% - 20px)', sm: '100%' },
        }}
      >
        <Stack spacing={2}>
          <Box sx={{ textAlign: 'left', mb: 2 }}>
            <Typography
              variant="h3"
              sx={{
                mb: 1,
                fontWeight: 700,
                color: 'text.primary',
              }}
            >
              Fridge Status Report
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
              }}
            >
              {fridgeName ?? fridgeId}
            </Typography>
            <Divider
              orientation="horizontal"
              flexItem
              sx={{ mt: 0, width: '100%', opacity: 0.2 }}
            />
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            sx={{ ml: 4, mt: 0 }}
          >
            <Stack direction="column" spacing={2} mt={0}>
              <FormLabel
                sx={{
                  mt: 0,
                  mb: 0,
                  fontSize: { xs: '1rem', md: '1.05rem' },
                  fontWeight: 500,
                  color: 'text.primary',
                }}
              >
                Select if applicable:
              </FormLabel>
              <FormControl component="fieldset" sx={{ mt: -0.5 }}>
                <Controller
                  name="condition"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup {...field} sx={{ gap: 0 }}>
                      <FormControlLabel
                        control={<Radio />}
                        value="good"
                        label="Fridge is in good condition"
                      />
                      <FormControlLabel
                        control={<Radio />}
                        value="out of order"
                        label="Fridge needs repairs"
                      />
                      <FormControlLabel
                        control={<Radio />}
                        value="dirty"
                        label="Fridge needs cleaning"
                      />
                      <FormControlLabel
                        control={<Radio />}
                        value="not at location"
                        label="Fridge is not at location"
                      />
                      {/* We will be migrating all ghost fridges to "not at location"
                      disabling for now */}
                      {/* <FormControlLabel
                        control={<Radio />}
                        value="ghost"
                        label="Fridge is permanently unavailable"
                      /> */}
                    </RadioGroup>
                  )}
                />
              </FormControl>

              <FormControl sx={{ mb: -1 }}>
                <FormLabel
                  sx={{
                    fontSize: { xs: '1rem', md: '1.05rem' },
                    fontWeight: 500,
                    color: 'text.primary',
                    mb: { xs: 8, sm: 8.5, md: 9 },
                  }}
                >
                  How full is the fridge?
                </FormLabel>
                <Controller
                  name="foodPercentage"
                  control={control}
                  render={({ field }) => (
                    <Slider
                      {...field}
                      aria-label="Amount of food in the fridge"
                      min={0}
                      max={3}
                      step={1}
                      marks={sliderMarks}
                      sx={fridgeSliderStyles}
                      onChange={(_, value) => field.onChange(value)}
                    />
                  )}
                />
              </FormControl>

              <TextField
                label="Notes"
                multiline
                rows={5}
                fullWidth
                variant="outlined"
                placeholder="Got an update or request? Leave your notes here!"
                {...register('notes')}
                error={!!errors.notes}
                helperText={errors.notes?.message}
                sx={{
                  backgroundColor: 'background.paper',
                  mt: '-8px !important',
                  '@media (max-width: 390px)': {
                    '& .MuiInputBase-inputMultiline': {
                      height: '72px !important',
                    },
                  },
                }}
              />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="stretch"
                spacing={4}
                pt={4}
              >
                <ButtonLink
                  aria-label="Return to map page"
                  variant="outlined"
                  to={cancelTo}
                  title="Cancel"
                  sx={{ flex: 1, minWidth: 0 }}
                />
                <Button
                  aria-label="Submit status update"
                  variant="contained"
                  type="submit"
                  sx={{ flex: 1 }}
                >
                  Confirm
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
