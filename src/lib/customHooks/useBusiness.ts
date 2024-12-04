import _ from 'lodash';

import { toast } from 'react-toastify';
import { useAuthContext } from 'lib/firebase';
import { useParams } from 'react-router';
import { useQuery, UseQueryResult } from 'react-query';

import {
  Business,
  BusinessDocumentWithId,
  ELicenseType,
  License,
  LicenseDocumentWithId,
  TestResult,
  TestResultWithId,
  UserDetails,
  UserDetailsWithId
} from 'types';

import { useFirebaseContext } from 'lib/firebase';
import { useLicenses } from './useLicenses';

interface UseBusinessReturn {
  // TODO: PASS IN CORESPONDING TYPES
  businessUsersQuery: any;
  businessQuery: UseQueryResult<BusinessDocumentWithId | null>;
  businessId: string;
  businessTestResults: any;
  businessLicensesQuery: any;
}

export const useBusiness = (): UseBusinessReturn => {
  const { licensesQuery } = useLicenses();

  const { firestore } = useFirebaseContext();
  const { businessId } = useParams<{ businessId?: string }>();
  const { user } = useAuthContext();

  const businessQuery = useQuery(
    ['business', businessId],
    async () => {
      const canAccess = await _.find(licensesQuery.data, { businessId, type: ELicenseType.BUSINESS_OWNER });

      if (!canAccess) {
        throw new Error('You do not have access to this business');
      }

      const businessSnap = await firestore
        .collection('business')
        .doc(businessId)
        .withConverter<BusinessDocumentWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as Business)
            };
          },
          toFirestore: (doc: Business) => doc
        })
        .get();

      const userBusiness = businessSnap.data();
      return userBusiness as BusinessDocumentWithId | null;
    },
    {
      refetchOnMount: false,
      enabled: !!businessId && licensesQuery.isSuccess,
      onError: (err: Error) => {
        toast.error(err?.message);
        console.error(err);
      }
    }
  );
  const businessLicensesQuery = useQuery(
    ['business', 'licenses'],
    async () => {
      const licenseResults = await firestore
        .collection('licenses')
        .where('businessId', '==', businessId)
        .withConverter<LicenseDocumentWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as License)
            };
          },
          toFirestore: (doc: License) => doc
        })
        .get();

      return licenseResults.docs.map((d) => ({
        ...d.data(),
        id: d.id
      }));
    },
    {
      enabled: businessQuery.isSuccess,
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  );

  const businessUsersQuery = useQuery(
    ['business', user?.uid, 'users'],
    async () => {
      const usersSnap = await firestore
        .collection('users')
        .where('businessId', '==', businessId)
        .withConverter<UserDetailsWithId>({
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
    },
    {
      enabled: businessQuery.isSuccess,
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  );

  const businessTestResults = useQuery(
    ['business', user?.uid, 'testResults'],
    async () => {
      const testResultsSnap = await firestore
        .collection('testResults')
        .where('businessId', '==', businessQuery.data?.id)
        .where('type', '!=', 'practice')
        .limit(50)
        .withConverter<TestResultWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as TestResult)
            };
          },
          toFirestore: (doc: TestResult) => doc
        })
        .get();

      return testResultsSnap.docs.map((d) => ({
        ...d.data(),
        id: d.id
      }));
    },
    {
      enabled: businessQuery.isSuccess,
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  );

  return {
    businessId,
    businessQuery,
    businessUsersQuery,
    businessLicensesQuery,
    businessTestResults
  };
};
