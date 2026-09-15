'use client';

import React, { useState, useCallback } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { designColor } from 'theme/palette';

const panelList = [
  {
    title: 'Dropping off',
    content: [
      'Only bring good food to the community fridges. When considering what is good to donate, ask yourself if you would give the food item to your friends or family to eat? If so, your food donation is probably good for your neighbors, too.',
      'Food must be fresh, stored at the proper temperature, and unexpired.',
      'Portion donations into individual sized quantities that make it easy for people to take with them. Catering trays should not be stored in community fridges due to causing food contents to spill, and being inaccessible for the public to transport.',
      'Food should be kept in clean, airtight containers to avoid food spills.',
      'Label meals with ingredients and the date prepared.',
      'If you notice a fridge needs to be cleaned, help clean it.',
      'Do not bring anything else that is not food to a community fridge, unless told otherwise.',
      'Take your trash with you, including cardboard boxes and food scraps.',
    ],
  },
  {
    title: 'Picking up',
    content: [
      'Only take the amount of food that you need, and leave the rest for others. Many people depend on community fridges to get enough nutrition. Whenever possible, make sure there is enough food left for others to eat as well.',
      'Only take good food from the fridges. If the food does not look good, throw it away using appropriate procedures and sanitation.',
      'If you touch a food item, take it with you or throw it away.',
      'Do not leave trash near community fridges.',
      'If you notice a fridge needs to be cleaned, help clean it.',
      'Be kind to others when interacting with community fridges.',
    ],
  },
];

interface TabPanelProps {
  children?: React.ReactNode;
  currentTab: number;
  index: number;
}

function TabPanel({
  children,
  currentTab,
  index,
  ...other
}: TabPanelProps): React.ReactElement {
  return (
    <Box
      role="tabpanel"
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      sx={{
        gridArea: '1 / 1',
        visibility: currentTab === index ? 'visible' : 'hidden',
      }}
      {...other}
    >
      <Box
        component="ol"
        sx={{
          listStyle: 'none',
          counterReset: 'item',
          p: 0,
          m: 0,
          pb: 3,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export function BestPracticesTabs(): React.ReactElement {
  const [ixCurrentPanel, setCurrentPanelIndex] = useState(0);

  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: number) => {
      setCurrentPanelIndex(newValue);
    },
    []
  );

  return (
    <Box
      sx={{
        backgroundColor: designColor.whiteSmoke,
        borderRadius: 4,
        p: { xs: 3, sm: 4 },
      }}
    >
      <Tabs
        value={ixCurrentPanel}
        onChange={handleChange}
        aria-label="Community Fridge Best Practices"
        variant="fullWidth"
        textColor="primary"
      >
        {panelList.map((panel, index) => (
          <Tab
            key={'tab-title-' + panel.title}
            label={panel.title}
            sx={{
              textTransform: 'none',
              paddingTop: 0,
              '&.Mui-selected': { fontWeight: 700 },
            }}
            id={'tab-' + index}
            aria-controls={'tab-panel-' + index}
          />
        ))}
      </Tabs>
      <Box sx={{ display: 'grid', mt: 4 }}>
        {panelList.map((panel, ixPanel) => (
          <TabPanel
            key={`tab-panel-${ixPanel}`}
            currentTab={ixCurrentPanel}
            index={ixPanel}
          >
            {panel.content.map((item, ixContent) => (
              <Box
                component="li"
                key={`tab-content-${ixPanel}-${ixContent}`}
                sx={{
                  counterIncrement: 'item',
                  position: 'relative',
                  pl: 5,
                  mb: 2,
                  '&::before': {
                    content: 'counter(item) "."',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    minWidth: 24,
                    fontWeight: 500,
                    color: 'text.primary',
                  },
                }}
              >
                <Typography sx={{ lineHeight: 1.7 }}>{item}</Typography>
              </Box>
            ))}
          </TabPanel>
        ))}
      </Box>
    </Box>
  );
}
