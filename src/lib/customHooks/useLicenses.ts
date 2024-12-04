import { useQuery, UseQueryResult } from 'react-query';

import { License, LicenseDocumentWithId } from 'types';
import { useAuthContext, useFirebaseContext } from 'lib/firebase';

interface UseLicensesReturn {
  licensesQuery: UseQueryResult<(LicenseDocumentWithId | null)[]>;
  isBusinessOwner: boolean;
  isOwner: boolean;
}

// TODO: Start to get this information from the firestore + firestore rules
const OWNER_USERS = [
  'IAiDpxcTLEQmZ0bowAzpEMeQ9733',
  'y3S5Yc9LALbdoklIiLuiS7fjKox2',
  'nt3ryW2WCbRcmrINCjC9P5pZ4eB2',
  'wv2u4pjvdkeKALEG7eusj6epqBl1',
  'Yn64A5psqFXpaRdC7OaM1vzjxkx1',
  'm9B9kIqkcBhAAdmbza1gujwLXwh1',
  'hTw1956u7zQuNex3pqSBmDvHSg33',
  'CZBxC5LK4lZtGG9sEdOpyLPKDtH3',
  'fpUQRvxoXueSCRhWucMlBZ6yOnT2'
];

export const useLicenses = (): UseLicensesReturn => {
  const { user } = useAuthContext();
  const { firestore } = useFirebaseContext();

  const licensesQuery = useQuery(
    ['licenses', user.uid],
    async () => {
      const licensesSnap = await firestore
        .collection('licenses')
        .where('userId', '==', user.uid)
        .withConverter<LicenseDocumentWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as License)
            };
          },
          toFirestore: (doc: License) => doc
        })
        .limit(10)
        .get();

      const licenses = licensesSnap.docs.map((d) => d.data());
      return licenses;
    },
    {
      enabled: !!user,
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  );

  return {
    licensesQuery,
    isBusinessOwner: user.userDetails?.license?.type === 'BUSINESS_OWNER' ?? false,
    isOwner: OWNER_USERS.includes(user.uid) ?? false

    // isOwner: true
  };
};
