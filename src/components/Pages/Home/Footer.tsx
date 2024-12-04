import { useHistory } from 'react-router';
import React, { FC } from 'react';

import { Box, Button, Divider, Grid, Heading } from '@chakra-ui/react';

import { Icon } from 'components/common';

export const Footer: FC<{}> = ({}) => {
  const { push } = useHistory();

  return (
    <Box mt={10}>
      <Divider borderColor="orange.500" />
      <Grid gridTemplateColumns="1fr 2fr 1fr" gap={5} mt={5}>
        <Grid gridTemplateColumns="1fr auto" gap={4} alignItems="center">
          <Icon name="need_any_help" fontSize="5xl" color="orange.500" />
          <Heading as="p" color="orange.500" fontSize="lg">
            Need any help?
          </Heading>
        </Grid>
        <Grid templateColumns="auto 1fr 1fr" gap={5} alignItems="center">
          <Button px={7} onClick={() => push('/faq')}>
            FAQ
          </Button>
          <Button width="fit-content" onClick={() => push('/tutorial')}>
            Review the onboarding
          </Button>
          {/* <Button >Contact our Support</Button> */}
        </Grid>
        {/* <Box borderLeft="1px solid" borderLeftColor="gray.300" pl={7} ml={4}>
          <Heading as="i" fontWeight="400" fontSize="md" color="gray.500">
            Today’s quote:
          </Heading>
          <Heading as="i" fontWeight="400" fontSize="lg" color="gray.500" d="block" mt={4}>
            <strong>"The mind is everything. What you think you become."</strong>
          </Heading>
          <Heading as="i" fontWeight="400" fontSize="md" color="gray.500">
            Buddha
          </Heading>
        </Box> */}
      </Grid>
    </Box>
  );
};
