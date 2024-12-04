import React, { FC, useMemo } from 'react';

import { Flex as ChakraFlex, Img as ChakraImg, Text as ChakraText } from '@chakra-ui/react';
import { useQuery } from 'react-query';

import { BaseCard } from 'components/common';

import { formatTimestamp } from 'lib/utils';
import { useFirebaseContext } from 'lib/firebase';

import { Business, BusinessDocumentWithId, UserDetails, UserDocumentWithId } from 'types';

import { BTOBPanelAffiliationChart } from './BTOBPanelAffiliationChart';
import { BTOBPanelCompanies } from './BTOBPanelCompanies';
import { cloneDeep } from 'lodash';
import usaTestPrep from 'assets/images/usa-test-prep.png';

export interface BusinessWithUsers extends Omit<BusinessDocumentWithId, 'timestamp'> {
  timestamp: string;
  users: UserDocumentWithId[];
}

export const OwnerBTOBPanel: FC = () => {
  const { firestore } = useFirebaseContext();

  const usersQuery = useQuery(['query:users'], async () => {
    const usersSnap = await firestore
      .collection('users')
      .withConverter<UserDocumentWithId>({
        fromFirestore: (doc) => {
          return {
            id: doc.id,
            ...(doc.data() as UserDetails)
          };
        },
        toFirestore: (doc: UserDetails) => doc
      })
      .limit(100)
      .get();

    const users = usersSnap.docs.map((d) => d.data());
    return users;
  });

  const businessesQuery = useQuery(['query:businesses'], async () => {
    const businessesSnap = await firestore
      .collection('business')
      .withConverter<BusinessDocumentWithId>({
        fromFirestore: (doc) => {
          return {
            id: doc.id,
            ...(doc.data() as Business)
          };
        },
        toFirestore: (doc: Business) => doc
      })
      .limit(100)
      .get();

    const businesses: BusinessWithUsers[] = businessesSnap.docs.map((d) => ({
      ...d.data(),
      timestamp: formatTimestamp(d.data().timestamp),
      users: usersQuery?.data ? usersQuery.data.filter(({ businessId }) => businessId === d.data().id) : []
    }));

    return businesses.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));
  });

  const getNewestBusinesses = useMemo(() => {
    const clonedBusinesses = cloneDeep(businessesQuery.data);

    return clonedBusinesses?.splice(0, 3);
  }, [businessesQuery.data]);

  return (
    <ChakraFlex flexDirection="column">
      <ChakraFlex marginBottom="lg" flexDirection={{ lg: 'row', md: 'column' }}>
        <BaseCard
          flex="1"
          title="Newest companies!"
          marginRight={{ lg: 'md', md: 'none' }}
          marginBottom={{ md: 'md', lg: 'none' }}
        >
          {getNewestBusinesses?.map((business, idx) => (
            <ChakraFlex
              width="100%"
              alignItems="center"
              key={idx}
              _notLast={{
                marginBottom: 'md'
              }}
            >
              <ChakraFlex
                width="186px"
                height="100px"
                marginRight="md"
                borderRadius="sm"
                boxShadow="lg"
                overflow="hidden"
              >
                <ChakraImg width="100%" objectFit="none" src={usaTestPrep} />
              </ChakraFlex>
              <ChakraText fontWeight="bold">{business.name || '-'}</ChakraText>
            </ChakraFlex>
          ))}
        </BaseCard>
        <BTOBPanelAffiliationChart businesses={businessesQuery.data || []} />
      </ChakraFlex>
      <BTOBPanelCompanies businesses={businessesQuery.data || []} onCreateBusiness={() => businessesQuery.refetch()} />
    </ChakraFlex>
  );
};
