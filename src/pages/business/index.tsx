import React, { FC, useEffect } from 'react';

import { ListItem, UnorderedList } from '@chakra-ui/react';

import { BasePage } from 'components/layout/Pages';
import { ELicenseType } from 'types';
import { useHistory } from 'react-router';
import { useLicenses } from 'lib/customHooks';

import { toast } from 'react-toastify';

export const BusinessSelector: FC = () => {
  const router = useHistory();
  const { licensesQuery } = useLicenses();

  const businessLicenses = licensesQuery.data?.filter((l) => l.type === ELicenseType.BUSINESS_OWNER);

  useEffect(() => {
    if (licensesQuery.isSuccess) {
      if (!businessLicenses.length) {
        toast.error("You don't have access to this page");
        router.push('/');
      }

      if (businessLicenses.length === 1) {
        router.push(`/business/${businessLicenses[0].businessId}`);
      }
    }
  }, [businessLicenses, licensesQuery]);

  return (
    <BasePage spacing="md">
      <h1>Business Selector</h1>

      <UnorderedList>
        {businessLicenses.map((l) => (
          <ListItem key={l.id}>
            <a href={`/business/${l.businessId}`}>{l.business?.name ?? 'Unknown'}</a>
          </ListItem>
        ))}
      </UnorderedList>
    </BasePage>
  );
};
