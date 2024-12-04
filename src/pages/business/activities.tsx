import React, { FC } from 'react';

import { ActivitiesListing } from 'components/Pages/BusinessDashboard';
import { BasePage } from 'components/layout/Pages';
import { FeedActivity, FeedActivityWithId } from 'types';
import { useFirebaseContext } from 'lib/firebase';
import { useParams } from 'react-router';
import { useQuery } from 'react-query';

import { sortBy } from 'lodash';

export const StudentsActivities: FC = () => {
  const { firestore } = useFirebaseContext();
  const { businessId } = useParams<{ businessId: string }>();

  const feedQuery = useQuery(
    ['owner', 'students', 'feed'],
    async () => {
      const feed = await firestore
        .collection('feed')
        .where('businessId', '==', businessId)
        .limit(20)
        .withConverter<FeedActivityWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as FeedActivity)
            };
          },
          toFirestore: (doc: FeedActivity) => doc
        })
        .get();

      const feedEvents = feed.docs.map((doc) => doc.data());

      return sortBy(feedEvents, 'timestamp').reverse();
    },
    {
      refetchOnMount: true,
      refetchOnWindowFocus: true
    }
  );

  return (
    <BasePage spacing="md">
      <ActivitiesListing data={feedQuery.data ?? []} isLoading={feedQuery.isLoading} />
    </BasePage>
  );
};
