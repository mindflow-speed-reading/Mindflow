import React, { FC, useMemo } from 'react';

import {
  Flex as ChakraFlex,
  FormControl as ChakraFormControl,
  FormLabel as ChakraFormLabel,
  Input as ChakraInput
} from '@chakra-ui/react';
import _, { find, get, sortBy } from 'lodash';
import { useQuery } from 'react-query';

import { ActivitiesListing } from 'components/Pages/Business/Activities';
import { ActivitiesResume, StudentComprehensionData, StudentSpeedReadingData } from 'components/analytics';
import { AverageCard } from 'components/Pages/Business/Home';
import { BaseCard } from 'components/common';
import { BasePage, BasePageTitle } from 'components/layout/Pages';
import {
  Diagnostic,
  DiagnosticDocumentWithId,
  DiagnosticResult,
  DiagnosticResultDocumentWithId,
  FeedActivity,
  FeedActivityWithId,
  UserDetails,
  UserDetailsWithId
} from 'types';
import { formatTimestamp } from 'lib/utils';
import { StudentDiagnosticResults } from 'components/Pages/Owner';
import { useFirebaseContext } from 'lib/firebase';
import { useHistory, useParams } from 'react-router';
import { UserEvolutionChart } from 'components/Pages/Home/UserEvolutionChart';

export const StudentDetails: FC = () => {
  const { firestore } = useFirebaseContext();
  const { studentId } = useParams<{ studentId: string }>();
  const { push } = useHistory();

  const userQuery = useQuery(
    ['owner', 'students', studentId],
    async () => {
      const userSnap = await firestore
        .collection('users')
        .doc(studentId)
        .withConverter<UserDetailsWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as UserDetails)
            };
          },
          toFirestore: (doc: UserDetailsWithId) => doc
        })
        .get();

      return userSnap.data();
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: true
    }
  );

  const feedQuery = useQuery(
    ['owner', 'students', studentId, 'feed'],
    async () => {
      const feed = await firestore
        .collection('feed')
        .where('user.id', '==', studentId)
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

  const diagnosticsQuery = useQuery(
    ['owner', 'diagnostics'],
    async () => {
      const diagnosticsQuery = await firestore
        .collection('diagnostics')
        // .where('category', '==', userQuery.data.testType)
        .orderBy('order', 'asc')
        .withConverter<DiagnosticDocumentWithId>({
          fromFirestore: (doc) => {
            const diagnostic = doc.data() as Diagnostic;

            return {
              id: doc.id,
              ...diagnostic
            };
          },
          toFirestore: (doc: DiagnosticDocumentWithId) => doc
        })
        .get();

      const diagnostics = diagnosticsQuery.docs.map((doc) => doc.data() as DiagnosticDocumentWithId);
      return diagnostics;
    },
    {
      enabled: userQuery.isSuccess,
      refetchOnMount: false,
      refetchOnWindowFocus: true
    }
  );

  const diagnosticResultsQuery = useQuery(
    ['owner', 'students', studentId, 'diagnosticResults'],
    async () => {
      const diagnosticResultsQuery = await firestore
        .collection('diagnosticResults')
        .where('category', '==', userQuery.data.testType)
        .where('userId', '==', studentId)
        .withConverter<DiagnosticResultDocumentWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as DiagnosticResult)
            };
          },
          toFirestore: (doc: DiagnosticResult) => doc
        })
        .get();

      return diagnosticResultsQuery.docs.map((doc) => doc.data());
    },
    {
      enabled: userQuery.isSuccess,
      refetchOnMount: true,
      refetchOnWindowFocus: true
    }
  );

  const queriesLoading =
    userQuery.isLoading || feedQuery.isLoading || diagnosticsQuery.isLoading || diagnosticResultsQuery.isLoading;

  const diagnosticResultsList = useMemo(() => {
    if (queriesLoading) return [];

    const diagnostics = _.sortBy(_.filter(diagnosticsQuery.data, { category: userQuery.data.testType }), 'order');

    return diagnostics.map((diagnostic) => {
      const result = find(diagnosticResultsQuery.data, { diagnosticId: diagnostic.id });

      return {
        diagnostic,
        result
      };
    });
  }, [diagnosticsQuery.data, diagnosticResultsQuery.isLoading, queriesLoading, userQuery.data]);

  const user = userQuery.data;
  const userStats = get(user, ['activity', 'stats']);
  const userCounters = get(user, ['activity', 'counters']);

  return (
    <BasePage spacing="md">
      <BasePageTitle title="Student Details" paddingX="lg" paddingBottom="lg" showGoBack={true} />
      <ChakraFlex gridGap="xl" flexDirection="column">
        <ChakraFlex gridGap="lg">
          <ChakraFormControl>
            <ChakraFormLabel>First Name</ChakraFormLabel>
            <ChakraInput borderRadius="sm" borderColor="gray.400" isDisabled={true} value={user?.firstName} />
          </ChakraFormControl>
          <ChakraFormControl>
            <ChakraFormLabel>Last Name</ChakraFormLabel>
            <ChakraInput borderRadius="sm" borderColor="gray.400" isDisabled={true} value={user?.lastName} />
          </ChakraFormControl>
          <ChakraFormControl>
            <ChakraFormLabel>Program</ChakraFormLabel>
            <ChakraInput borderRadius="sm" borderColor="gray.400" isDisabled={true} value={user?.testType} />
          </ChakraFormControl>
          <ChakraFormControl>
            <ChakraFormLabel>E-mail</ChakraFormLabel>
            <ChakraInput borderRadius="sm" borderColor="gray.400" isDisabled={true} value={user?.email} />
          </ChakraFormControl>
        </ChakraFlex>
        <ChakraFlex gridGap="lg">
          <ChakraFormControl>
            <ChakraFormLabel>License Status</ChakraFormLabel>
            <ChakraInput borderRadius="sm" borderColor="gray.400" isDisabled={true} value={user?.license.status} />
          </ChakraFormControl>

          <ChakraFormControl>
            <ChakraFormLabel>Start Date</ChakraFormLabel>
            <ChakraInput
              borderRadius="sm"
              borderColor="gray.400"
              isDisabled={true}
              value={formatTimestamp(user?.license.purchaseDate)}
            />
          </ChakraFormControl>

          <ChakraFormControl>
            <ChakraFormLabel>Expiration Date</ChakraFormLabel>
            <ChakraInput
              borderRadius="sm"
              borderColor="gray.400"
              isDisabled={true}
              value={formatTimestamp(user?.license.expirationDate)}
            />
          </ChakraFormControl>

          <ChakraFormControl>
            <ChakraFormLabel>Last seen</ChakraFormLabel>
            <ChakraInput
              borderRadius="sm"
              borderColor="gray.400"
              isDisabled={true}
              value={formatTimestamp(user?.lastSeen)}
            />
          </ChakraFormControl>
        </ChakraFlex>
        <ChakraFlex width="100%" gridGap="lg" flexDirection="column">
          <ChakraFlex gridGap="lg">
            <AverageCard value={user?.level ?? 1} color="red" description="Level" icon="star" />
            <AverageCard
              value={userStats?.comprehension?.averageComprehension ?? '-'}
              color="red"
              description="Average Comprehension"
              icon="check"
            />
            {/* <AverageCard value="0" color="orange" description="Days Till Completion" icon="calendar" /> */}
            <AverageCard
              value={Object.keys(userStats?.videos ?? {}).length}
              color="orange"
              description="Videos Watched"
              icon="videos_watched"
            />
          </ChakraFlex>

          <ChakraFlex gridGap="lg">
            <AverageCard
              value={userStats?.wordSpeed?.bestWordSpeed ?? '-'}
              color="blue"
              description="Best Reading Speed"
              icon="view"
            />
            <AverageCard
              value={userStats?.wordSpeed?.firstWordSpeed ?? '-'}
              color="blue"
              description="Initial Reading Speed"
              icon="flag"
            />
            {/* <AverageCard value="-" color="blue" description="Improvement" icon="bar-chart" /> */}
            <AverageCard
              value={userStats?.wordSpeed?.averageWordSpeed ?? '-'}
              color="blue"
              description="Average Reading Speed"
              icon="view"
            />
          </ChakraFlex>
        </ChakraFlex>
        <ChakraFlex width="100%" flexDirection="column">
          <BaseCard width="100%" height="100%" marginBottom="lg">
            <StudentSpeedReadingData wordSpeedStats={userStats?.wordSpeed} />
          </BaseCard>
          <BaseCard width="100%" height="100%">
            <StudentComprehensionData comprehensionStats={userStats?.comprehension} />
          </BaseCard>
        </ChakraFlex>
        <ChakraFlex height="100%" gridGap="lg">
          <BaseCard width="fit-content" title="Student Activities Resume">
            <ActivitiesResume
              finishedBrainEye={userCounters?.brainEyeCoordination ?? 0}
              finishedDiagnostics={userCounters?.diagnostics ?? 0}
              finishedPractices={userCounters?.practices ?? 0}
              finishedSpeedReads={userCounters?.speedRead ?? 0}
              finishedVideos={userCounters?.videos ?? 0}
            />
          </BaseCard>
          <BaseCard title="Reading Speed and Comprehension History" width="100%">
            <ChakraFlex width="100%" height="250px">
              <UserEvolutionChart stats={user?.activity?.stats} />
            </ChakraFlex>
          </BaseCard>
        </ChakraFlex>
        <BaseCard title="Diagnostics">
          <StudentDiagnosticResults data={diagnosticResultsList} isLoading={diagnosticResultsQuery.isLoading} />
          {/* {diagnosticResultsList?.map(({ diagnostic, result }) => (
            ))} */}
        </BaseCard>
        <BaseCard>
          <ActivitiesListing data={feedQuery.data ?? []} user={user} />
        </BaseCard>
      </ChakraFlex>
    </BasePage>
  );
};
